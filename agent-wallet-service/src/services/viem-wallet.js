/**
 * Viem-based Wallet Service
 * 
 * Simple wallet creation using viem (no CDP dependency)
 */

import 'dotenv/config';
import { createWalletClient, createPublicClient, http, parseEther, formatEther, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { 
  baseSepolia, base, mainnet, sepolia,
  polygon, optimism, optimismSepolia,
  arbitrum, arbitrumSepolia
} from 'viem/chains';
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logTransaction } from './tx-history.js';
import { encrypt, decrypt } from './encryption.js';

// ============================================================
// MULTI-CHAIN CONFIG
// ============================================================

// Check for Alchemy API key
const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;

// Alchemy URLs (only works for chains you've created apps for)
const getAlchemyUrl = (network) => ALCHEMY_KEY 
  ? `https://${network}.g.alchemy.com/v2/${ALCHEMY_KEY}` 
  : null;

const CHAINS = {
  // Testnets
  'base-sepolia': { 
    chain: baseSepolia, 
    rpcs: [getAlchemyUrl('base-sepolia'), 'https://sepolia.base.org', 'https://base-sepolia.blockpi.network/v1/rpc/public'].filter(Boolean)
  },
  'ethereum-sepolia': { 
    chain: sepolia, 
    rpcs: [getAlchemyUrl('eth-sepolia'), 'https://ethereum-sepolia.publicnode.com', 'https://rpc.sepolia.org'].filter(Boolean)
  },
  'optimism-sepolia': { 
    chain: optimismSepolia, 
    rpcs: [getAlchemyUrl('opt-sepolia'), 'https://sepolia.optimism.io', 'https://optimism-sepolia.publicnode.com'].filter(Boolean)
  },
  'arbitrum-sepolia': { 
    chain: arbitrumSepolia, 
    rpcs: [getAlchemyUrl('arb-sepolia'), 'https://sepolia-rollup.arbitrum.io/rpc', 'https://arbitrum-sepolia.publicnode.com'].filter(Boolean)
  },
  
  // Mainnets
  'base': { 
    chain: base, 
    rpcs: [getAlchemyUrl('base-mainnet'), 'https://mainnet.base.org', 'https://base-rpc.publicnode.com'].filter(Boolean)
  },
  'ethereum': { 
    chain: mainnet, 
    rpcs: [getAlchemyUrl('eth-mainnet'), 'https://ethereum.publicnode.com', 'https://eth.llamarpc.com'].filter(Boolean)
  },
  'polygon': { 
    chain: polygon, 
    rpcs: [getAlchemyUrl('polygon-mainnet'), 'https://polygon-rpc.com', 'https://polygon-bor.publicnode.com'].filter(Boolean)
  },
  'optimism': { 
    chain: optimism, 
    rpcs: [getAlchemyUrl('opt-mainnet'), 'https://mainnet.optimism.io', 'https://optimism.publicnode.com'].filter(Boolean)
  },
  'arbitrum': { 
    chain: arbitrum, 
    rpcs: [getAlchemyUrl('arb-mainnet'), 'https://arb1.arbitrum.io/rpc', 'https://arbitrum-one.publicnode.com'].filter(Boolean)
  }
};

// Default chain
const DEFAULT_CHAIN = 'base-sepolia';
const DUST_THRESHOLD_WEI = 1_000_000_000n; // 1 gwei

function normalizeAddress(address) {
  return String(address || '').trim().toLowerCase();
}

function parseEthValue(value) {
  const raw = value == null ? '0' : String(value).trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,18})?$/.test(raw)) {
    throw new Error('Invalid value format. Use non-negative decimal ETH value up to 18 decimals');
  }
  return parseEther(raw);
}

function validateRecipient({ from, to, allowSelfSend = false }) {
  if (!isAddress(to)) {
    throw new Error('Invalid recipient address format');
  }

  if (!allowSelfSend && normalizeAddress(from) === normalizeAddress(to)) {
    throw new Error('Self-send is blocked by default. Set allowSelfSend=true to override');
  }
}

function enforceDustRules(amountWei) {
  if (amountWei <= 0n) {
    throw new Error('Transaction value must be greater than zero');
  }
  if (amountWei < DUST_THRESHOLD_WEI) {
    throw new Error(`Value below dust threshold (${formatEther(DUST_THRESHOLD_WEI)} ETH)`);
  }
}

async function preflightTransfer({ from, to, value, data = '0x', chain, allowSelfSend = false, maxFeeCap, gasGuardBps }) {
  const wallet = Array.from(wallets.values()).find(w => w.address.toLowerCase() === normalizeAddress(from));
  if (!wallet) {
    throw new Error(`Wallet not found: ${from}`);
  }

  validateRecipient({ from, to, allowSelfSend });

  const chainName = chain || wallet.chain || DEFAULT_CHAIN;
  const chainConfig = getChainConfig(chainName);
  const valueWei = parseEthValue(value || '0');
  enforceDustRules(valueWei);

  const { client } = await createClientWithFallback(chainConfig, 'public');
  const [balance, gasEstimate, gasPrice] = await Promise.all([
    client.getBalance({ address: from }),
    client.estimateGas({ account: from, to, value: valueWei, data }),
    client.getGasPrice()
  ]);

  const estimatedFeeWei = gasEstimate * gasPrice;
  const totalImpactWei = valueWei + estimatedFeeWei;
  const projectedPostBalanceWei = balance - totalImpactWei;

  if (projectedPostBalanceWei < 0n) {
    throw new Error('Insufficient balance for value + estimated fee');
  }

  if (maxFeeCap != null) {
    const capWei = parseEthValue(maxFeeCap);
    if (estimatedFeeWei > capWei) {
      throw new Error(`Estimated fee ${formatEther(estimatedFeeWei)} ETH exceeds maxFeeCap ${maxFeeCap} ETH`);
    }
  }

  if (gasGuardBps != null && (!Number.isInteger(gasGuardBps) || gasGuardBps < 0 || gasGuardBps > 10_000)) {
    throw new Error('gasGuardBps must be an integer between 0 and 10000');
  }

  return {
    chain: chainName,
    from,
    to,
    value: formatEther(valueWei),
    valueWei: valueWei.toString(),
    balanceWei: balance.toString(),
    balance: formatEther(balance),
    estimatedGas: gasEstimate.toString(),
    gasPriceWei: gasPrice.toString(),
    estimatedFeeWei: estimatedFeeWei.toString(),
    estimatedFee: formatEther(estimatedFeeWei),
    totalImpactWei: totalImpactWei.toString(),
    totalImpact: formatEther(totalImpactWei),
    projectedPostBalanceWei: projectedPostBalanceWei.toString(),
    projectedPostBalance: formatEther(projectedPostBalanceWei),
    guardrails: {
      maxFeeCap: maxFeeCap || null,
      gasGuardBps: gasGuardBps ?? null
    }
  };
}

/**
 * Get chain config by name
 */
function getChainConfig(chainName) {
  const config = CHAINS[chainName];
  if (!config) {
    throw new Error(`Unsupported chain: ${chainName}. Supported: ${Object.keys(CHAINS).join(', ')}`);
  }
  return config;
}

/**
 * Create a client with fallback RPCs
 */
async function createClientWithFallback(chainConfig, clientType = 'public') {
  const { chain, rpcs } = chainConfig;
  
  for (const rpc of rpcs) {
    try {
      const client = clientType === 'public' 
        ? createPublicClient({ chain, transport: http(rpc) })
        : createWalletClient({ chain, transport: http(rpc) });
      
      // Test the connection with a simple request
      if (clientType === 'public') {
        await client.getBlockNumber();
      }
      return { client, rpc };
    } catch (error) {
      console.log(`RPC ${rpc} failed, trying next...`);
      continue;
    }
  }
  
  throw new Error(`All RPCs failed for chain ${chain.name}`);
}

/**
 * Get all supported chains
 */
export function getSupportedChains() {
  return Object.keys(CHAINS).map(key => ({
    id: key,
    name: CHAINS[key].chain.name,
    testnet: key.includes('sepolia') || key.includes('mumbai'),
    nativeCurrency: CHAINS[key].chain.nativeCurrency
  }));
}

// Persist wallets to JSON file
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

/**
 * Generate a random private key
 */
function generatePrivateKey() {
  const bytes = randomBytes(32);
  return '0x' + bytes.toString('hex');
}

/**
 * Create a new wallet for an AI agent
 */
export async function createWallet({ agentName, chain = 'base-sepolia' }) {
  try {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const walletId = `wallet_${Date.now()}`;

    const wallet = {
      id: walletId,
      agentName,
      address: account.address,
      privateKey: encrypt(privateKey), // Encrypted at rest
      chain,
      createdAt: new Date().toISOString()
    };

    // Store wallet
    wallets.set(walletId, wallet);
    saveWallets(wallets);

    console.log(`✅ Created wallet for ${agentName}: ${account.address}`);

    return {
      id: walletId,
      address: account.address,
      chain
    };
  } catch (error) {
    console.error('Failed to create wallet:', error);
    throw error;
  }
}

/**
 * Get wallet balance
 */
export async function getBalance(address, chain) {
  const wallet = Array.from(wallets.values()).find(w => w.address === address);
  
  // Use wallet's chain if not specified, fallback to default
  const chainName = chain || wallet?.chain || DEFAULT_CHAIN;
  const chainConfig = getChainConfig(chainName);
  
  if (!wallet) {
    throw new Error(`Wallet not found: ${address}`);
  }

  try {
    const { client, rpc } = await createClientWithFallback(chainConfig, 'public');
    const balance = await client.getBalance({ address });
    
    return {
      chain: chainName,
      eth: formatEther(balance),
      wei: balance.toString(),
      rpc: rpc.split('/')[2] // Just show domain
    };
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
}

/**
 * Sign and send a transaction
 */
export async function getTransferPreflight(params) {
  return preflightTransfer(params);
}

export async function signTransaction({ from, to, value, data = '0x', chain, allowSelfSend = false, maxFeeCap, gasGuardBps, referenceGasPriceWei }) {
  const wallet = Array.from(wallets.values()).find(w => w.address.toLowerCase() === normalizeAddress(from));
  
  if (!wallet) {
    throw new Error(`Wallet not found: ${from}`);
  }
  
  // Use provided chain or wallet's chain
  const chainName = chain || wallet.chain || DEFAULT_CHAIN;
  const chainConfig = getChainConfig(chainName);

  try {
    const preflight = await preflightTransfer({ from, to, value, data, chain: chainName, allowSelfSend, maxFeeCap, gasGuardBps });

    if (referenceGasPriceWei != null && gasGuardBps != null) {
      const baseline = BigInt(referenceGasPriceWei);
      const current = BigInt(preflight.gasPriceWei);
      const maxAllowed = baseline + ((baseline * BigInt(gasGuardBps)) / 10_000n);
      if (current > maxAllowed) {
        throw new Error(`Gas price moved above guardrail (${current} > ${maxAllowed})`);
      }
    }

    // Decrypt private key for use
    const decryptedKey = decrypt(wallet.privateKey);
    const account = privateKeyToAccount(decryptedKey);
    
    const { client } = await createClientWithFallback(
      { ...chainConfig, account }, 
      'wallet'
    );

    // Re-create with account for wallet client
    const walletClient = createWalletClient({
      account,
      chain: chainConfig.chain,
      transport: http(chainConfig.rpcs[0])
    });

    const hash = await walletClient.sendTransaction({
      to,
      value: BigInt(preflight.valueWei),
      data
    });

    console.log(`✅ Transaction sent on ${chainName}: ${hash}`);

    // Log transaction
    const txRecord = {
      hash,
      from,
      to,
      value,
      chain: chainName
    };
    logTransaction(txRecord);

    return {
      hash,
      from,
      to,
      value,
      data,
      preflight,
      chain: chainName,
      explorer: getExplorerUrl(chainName, hash)
    };
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}


export async function getSweepPreflight({ from, to, chain, allowSelfSend = false, maxFeeCap, gasGuardBps }) {
  const wallet = Array.from(wallets.values()).find(w => w.address.toLowerCase() === normalizeAddress(from));
  if (!wallet) throw new Error(`Wallet not found: ${from}`);

  validateRecipient({ from, to, allowSelfSend });

  const chainName = chain || wallet.chain || DEFAULT_CHAIN;
  const chainConfig = getChainConfig(chainName);
  const { client } = await createClientWithFallback(chainConfig, 'public');

  const [balance, gasPrice] = await Promise.all([
    client.getBalance({ address: from }),
    client.getGasPrice()
  ]);

  const gasEstimate = await client.estimateGas({
    account: from,
    to,
    value: balance,
    data: '0x'
  });

  const estimatedFeeWei = gasEstimate * gasPrice;

  if (maxFeeCap != null) {
    const capWei = parseEthValue(maxFeeCap);
    if (estimatedFeeWei > capWei) {
      throw new Error(`Estimated fee ${formatEther(estimatedFeeWei)} ETH exceeds maxFeeCap ${maxFeeCap} ETH`);
    }
  }

  if (gasGuardBps != null && (!Number.isInteger(gasGuardBps) || gasGuardBps < 0 || gasGuardBps > 10_000)) {
    throw new Error('gasGuardBps must be an integer between 0 and 10000');
  }

  const amountToSendWei = balance - estimatedFeeWei;
  if (amountToSendWei <= 0n) {
    throw new Error('Insufficient balance to cover gas');
  }

  return {
    chain: chainName,
    from,
    to,
    balanceWei: balance.toString(),
    balance: formatEther(balance),
    estimatedGas: gasEstimate.toString(),
    gasPriceWei: gasPrice.toString(),
    estimatedFeeWei: estimatedFeeWei.toString(),
    estimatedFee: formatEther(estimatedFeeWei),
    projectedSendWei: amountToSendWei.toString(),
    projectedSend: formatEther(amountToSendWei),
    projectedPostBalanceWei: '0',
    projectedPostBalance: '0',
    guardrails: {
      maxFeeCap: maxFeeCap || null,
      gasGuardBps: gasGuardBps ?? null
    }
  };
}

/**
 * Get block explorer URL for a transaction
 */
function getExplorerUrl(chainName, txHash) {
  const explorers = {
    'base-sepolia': `https://sepolia.basescan.org/tx/${txHash}`,
    'base': `https://basescan.org/tx/${txHash}`,
    'ethereum': `https://etherscan.io/tx/${txHash}`,
    'ethereum-sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
    'polygon': `https://polygonscan.com/tx/${txHash}`,
    'polygon-mumbai': `https://mumbai.polygonscan.com/tx/${txHash}`,
    'optimism': `https://optimistic.etherscan.io/tx/${txHash}`,
    'optimism-sepolia': `https://sepolia-optimism.etherscan.io/tx/${txHash}`,
    'arbitrum': `https://arbiscan.io/tx/${txHash}`,
    'arbitrum-sepolia': `https://sepolia.arbiscan.io/tx/${txHash}`
  };
  return explorers[chainName];
}

/**
 * Get all wallets (for admin)
 */
export function getAllWallets() {
  return Array.from(wallets.values()).map(w => ({
    id: w.id,
    agentName: w.agentName,
    address: w.address,
    chain: w.chain,
    createdAt: w.createdAt
  }));
}

/**
 * Get wallet by ID (for internal use)
 */
export function getWalletById(id) {
  return wallets.get(id);
}

/**
 * Get wallet by address
 */
export function getWalletByAddress(address) {
  return Array.from(wallets.values()).find(w => 
    w.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Import an existing wallet from private key
 */
export async function importWallet({ privateKey, agentName, chain = DEFAULT_CHAIN }) {
  try {
    // Validate private key format
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }
    
    const account = privateKeyToAccount(privateKey);
    const walletId = `wallet_imported_${Date.now()}`;

    const wallet = {
      id: walletId,
      agentName: agentName || 'Imported',
      address: account.address,
      privateKey: encrypt(privateKey), // Encrypted at rest
      chain,
      imported: true,
      createdAt: new Date().toISOString()
    };

    // Check if wallet already exists
    const existing = Array.from(wallets.values()).find(w => 
      w.address.toLowerCase() === account.address.toLowerCase()
    );
    
    if (existing) {
      return {
        id: existing.id,
        address: existing.address,
        chain: existing.chain,
        imported: false,
        message: 'Wallet already exists'
      };
    }

    wallets.set(walletId, wallet);
    saveWallets(wallets);

    console.log(`✅ Imported wallet: ${account.address}`);

    return {
      id: walletId,
      address: account.address,
      chain,
      imported: true
    };
  } catch (error) {
    console.error('Failed to import wallet:', error);
    throw new Error('Invalid private key');
  }
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash, chainName = DEFAULT_CHAIN) {
  const chainConfig = getChainConfig(chainName);
  
  try {
    const { client } = await createClientWithFallback(chainConfig, 'public');
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    
    return {
      hash: receipt.transactionHash,
      status: receipt.status === 'success' ? 'success' : 'failed',
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
      chain: chainName
    };
  } catch (error) {
    // Transaction might be pending
    return {
      hash: txHash,
      status: 'pending',
      chain: chainName,
      explorer: getExplorerUrl(chainName, txHash)
    };
  }
}

/**
 * Get balance across all chains
 */
export async function getMultiChainBalance(address) {
  const balances = [];
  
  for (const [chainName, config] of Object.entries(CHAINS)) {
    try {
      const { client } = await createClientWithFallback(config, 'public');
      const balance = await client.getBalance({ address });
      
      balances.push({
        chain: chainName,
        eth: formatEther(balance),
        wei: balance.toString(),
        status: 'ok'
      });
    } catch (error) {
      balances.push({
        chain: chainName,
        eth: '0',
        wei: '0',
        status: 'error',
        error: error.message
      });
    }
  }
  
  return balances;
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas({ from, to, value, data = '0x', chain }) {
  const wallet = Array.from(wallets.values()).find(w => w.address.toLowerCase() === normalizeAddress(from));
  const chainName = chain || wallet?.chain || DEFAULT_CHAIN;
  const chainConfig = getChainConfig(chainName);
  
  try {
    const { client } = await createClientWithFallback(chainConfig, 'public');
    
    const gas = await client.estimateGas({
      account: from,
      to,
      value: parseEthValue(value || '0'),
      data
    });
    
    // Get current gas price
    const gasPrice = await client.getGasPrice();
    
    const estimatedCost = gas * gasPrice;
    
    return {
      chain: chainName,
      gasUnits: gas.toString(),
      gasPrice: formatEther(gasPrice) + ' ETH',
      estimatedCost: formatEther(estimatedCost) + ' ETH',
      estimatedCostWei: estimatedCost.toString()
    };
  } catch (error) {
    console.error('Gas estimation failed:', error);
    throw error;
  }
}

/**
 * Transfer all funds (sweep wallet)
 */
export async function sweepWallet({ from, to, chain, maxFeeCap, gasGuardBps, referenceGasPriceWei }) {
  const wallet = Array.from(wallets.values()).find(w => w.address.toLowerCase() === normalizeAddress(from));
  if (!wallet) throw new Error('Wallet not found');

  validateRecipient({ from, to, allowSelfSend: false });
  
  const chainName = chain || wallet.chain || DEFAULT_CHAIN;
  const chainConfig = getChainConfig(chainName);

  try {
    const preflight = await getSweepPreflight({ from, to, chain: chainName, maxFeeCap, gasGuardBps });

    if (referenceGasPriceWei != null && gasGuardBps != null) {
      const baseline = BigInt(referenceGasPriceWei);
      const current = BigInt(preflight.gasPriceWei);
      const maxAllowed = baseline + ((baseline * BigInt(gasGuardBps)) / 10_000n);
      if (current > maxAllowed) {
        throw new Error(`Gas price moved above guardrail (${current} > ${maxAllowed})`);
      }
    }

    const amountToSend = BigInt(preflight.projectedSendWei);
    
    // Create wallet client
    const account = privateKeyToAccount(decrypt(wallet.privateKey));
    const walletClient = createWalletClient({
      account,
      chain: chainConfig.chain,
      transport: http(chainConfig.rpcs[0])
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
      gasCost: preflight.estimatedFee,
      chain: chainName,
      preflight,
      explorer: getExplorerUrl(chainName, hash)
    };
  } catch (error) {
    console.error('Sweep failed:', error);
    throw error;
  }
}
