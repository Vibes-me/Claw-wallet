/**
 * Wallet Service
 *
 * Persists agent wallets and resolves chain operations through adapter registry.
 */

import 'dotenv/config';
import { createWalletClient, createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logTransaction } from './tx-history.js';
import { encrypt, decrypt } from './encryption.js';
import { resolveAdapter, normalizeProvider, SUPPORTED_PROVIDERS } from './adapters/registry.js';
import {
  getSupportedChains as getAdapterSupportedChains,
  getProviderConfig
} from './adapters/viem-adapter.js';

const DEFAULT_CHAIN = 'base-sepolia';
const DEFAULT_PROVIDER = normalizeProvider(process.env.WALLET_PROVIDER);

const WALLET_FILE = join(process.cwd(), 'wallets.json');

function loadWallets() {
  if (existsSync(WALLET_FILE)) {
    const data = JSON.parse(readFileSync(WALLET_FILE, 'utf-8'));
    return new Map(Object.entries(data));
  }
  return new Map();
}

function saveWallets(wallets) {
  const obj = Object.fromEntries(wallets);
  writeFileSync(WALLET_FILE, JSON.stringify(obj, null, 2));
}

const wallets = loadWallets();

function generatePrivateKey() {
  const bytes = randomBytes(32);
  return `0x${bytes.toString('hex')}`;
}

function findWalletByAddress(address) {
  return Array.from(wallets.values()).find(
    (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
  );
}

function resolveWalletContext({ address, chain, provider }) {
  const wallet = address ? findWalletByAddress(address) : null;

  if (address && !wallet) {
    throw new Error(`Wallet not found: ${address}`);
  }

  const chainName = chain || wallet?.chain || DEFAULT_CHAIN;
  const providerName = normalizeProvider(provider || wallet?.provider || DEFAULT_PROVIDER);
  const adapter = resolveAdapter({ chain: chainName, provider: providerName });

  if (!adapter) {
    throw new Error(`No adapter registered for chain=${chainName}, provider=${providerName}`);
  }

  return { wallet, chainName, providerName, adapter };
}

export function getSupportedChains() {
  return getAdapterSupportedChains();
}

export function getSupportedProviders() {
  return SUPPORTED_PROVIDERS;
}

export async function createWallet({ agentName, chain = DEFAULT_CHAIN, provider = DEFAULT_PROVIDER }) {
  try {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const walletId = `wallet_${Date.now()}`;

    const wallet = {
      id: walletId,
      agentName,
      address: account.address,
      privateKey: encrypt(privateKey),
      chain,
      provider: normalizeProvider(provider),
      createdAt: new Date().toISOString()
    };

    wallets.set(walletId, wallet);
    saveWallets(wallets);

    return {
      id: walletId,
      address: account.address,
      chain: wallet.chain,
      provider: wallet.provider
    };
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

export async function getBalance(address, chain, provider) {
  const { chainName, providerName, adapter } = resolveWalletContext({ address, chain, provider });
  return adapter.getBalance({ address, chain: chainName, provider: providerName });
}

export async function signTransaction({ from, to, value, data = '0x', chain, provider }) {
  const { wallet, chainName, providerName, adapter } = resolveWalletContext({
    address: from,
    chain,
    provider
  });

  const account = privateKeyToAccount(decrypt(wallet.privateKey));
  const tx = await adapter.sendTransaction({
    from,
    to,
    value,
    data,
    chain: chainName,
    provider: providerName,
    account
  });

  logTransaction({ hash: tx.hash, from, to, value, chain: chainName, provider: providerName });
  return tx;
}

export function getAllWallets() {
  return Array.from(wallets.values()).map((wallet) => ({
    id: wallet.id,
    agentName: wallet.agentName,
    address: wallet.address,
    chain: wallet.chain,
    provider: wallet.provider || DEFAULT_PROVIDER,
    createdAt: wallet.createdAt
  }));
}

export function getWalletById(id) {
  return wallets.get(id);
}

export function getWalletByAddress(address) {
  return findWalletByAddress(address);
}

export async function importWallet({ privateKey, agentName, chain = DEFAULT_CHAIN, provider = DEFAULT_PROVIDER }) {
  try {
    let formatted = privateKey;
    if (!formatted.startsWith('0x')) {
      formatted = `0x${formatted}`;
    }

    const account = privateKeyToAccount(formatted);
    const existing = findWalletByAddress(account.address);

    if (existing) {
      return {
        id: existing.id,
        address: existing.address,
        chain: existing.chain,
        provider: existing.provider || DEFAULT_PROVIDER,
        imported: false,
        message: 'Wallet already exists'
      };
    }

    const walletId = `wallet_imported_${Date.now()}`;
    const wallet = {
      id: walletId,
      agentName: agentName || 'Imported',
      address: account.address,
      privateKey: encrypt(formatted),
      chain,
      provider: normalizeProvider(provider),
      imported: true,
      createdAt: new Date().toISOString()
    };

    wallets.set(walletId, wallet);
    saveWallets(wallets);

    return {
      id: walletId,
      address: account.address,
      chain,
      provider: wallet.provider,
      imported: true
    };
  } catch (error) {
    console.error('Failed to import wallet:', error);
    throw new Error('Invalid private key');
  }
}

export async function getTransactionReceipt(txHash, chainName = DEFAULT_CHAIN, provider) {
  const providerName = normalizeProvider(provider || DEFAULT_PROVIDER);
  const adapter = resolveAdapter({ chain: chainName, provider: providerName });

  if (!adapter) {
    throw new Error(`No adapter registered for chain=${chainName}, provider=${providerName}`);
  }

  return adapter.getReceipt({ hash: txHash, chain: chainName, provider: providerName });
}

export async function getMultiChainBalance(address, provider) {
  const providerName = normalizeProvider(provider || DEFAULT_PROVIDER);
  const balances = [];

  for (const chain of getAdapterSupportedChains()) {
    const adapter = resolveAdapter({ chain: chain.id, provider: providerName });

    try {
      const balance = await adapter.getBalance({
        address,
        chain: chain.id,
        provider: providerName
      });

      balances.push({ ...balance, status: 'ok' });
    } catch (error) {
      balances.push({
        chain: chain.id,
        provider: providerName,
        eth: '0',
        wei: '0',
        status: 'error',
        error: error.message
      });
    }
  }

  return balances;
}

export async function estimateGas({ from, to, value, data = '0x', chain, provider }) {
  const { chainName, providerName, adapter } = resolveWalletContext({
    address: from,
    chain,
    provider
  });

  return adapter.estimateGas({
    from,
    to,
    value,
    data,
    chain: chainName,
    provider: providerName
  });
}

export async function sweepWallet({ from, to, chain, provider }) {
  const { wallet, chainName, providerName } = resolveWalletContext({
    address: from,
    chain,
    provider
  });

  const account = privateKeyToAccount(decrypt(wallet.privateKey));
  const providerConfig = getProviderConfig(chainName, providerName);
  const rpc = providerConfig.rpcs[0];

  const publicClient = createPublicClient({
    chain: providerConfig.chainConfig.chain,
    transport: http(rpc)
  });

  const balance = await publicClient.getBalance({ address: from });
  const gasEstimate = await publicClient.estimateGas({
    account: from,
    to,
    value: balance,
    data: '0x'
  });
  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gasEstimate * gasPrice;
  const amountToSend = balance - gasCost;

  if (amountToSend <= 0n) {
    throw new Error('Insufficient balance to cover gas');
  }

  const walletClient = createWalletClient({
    account,
    chain: providerConfig.chainConfig.chain,
    transport: http(rpc)
  });

  const hash = await walletClient.sendTransaction({
    to,
    value: amountToSend,
    data: '0x'
  });

  return {
    hash,
    from,
    to,
    amountSent: formatEther(amountToSend),
    gasCost: formatEther(gasCost),
    chain: chainName,
    provider: providerName
  };
}
