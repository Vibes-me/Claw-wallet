/**
 * Transaction History Service
 * 
 * Simple transaction logging
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TX_FILE = join(process.cwd(), 'transactions.json');
const MAX_TX_HISTORY = 100;
const DECIMAL_SCALE = 18n;
const SCALE_FACTOR = 10n ** DECIMAL_SCALE;

function toWei(value) {
  if (value === null || value === undefined) return 0n;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return toWei(value.toString());

  const str = String(value).trim();
  if (!str) return 0n;

  const negative = str.startsWith('-');
  const unsigned = negative ? str.slice(1) : str;
  const [whole = '0', fraction = ''] = unsigned.split('.');
  const safeWhole = whole.replace(/\D/g, '') || '0';
  const safeFraction = fraction.replace(/\D/g, '');
  const paddedFraction = (safeFraction + '0'.repeat(Number(DECIMAL_SCALE))).slice(0, Number(DECIMAL_SCALE));
  const wei = (BigInt(safeWhole) * SCALE_FACTOR) + BigInt(paddedFraction || '0');
  return negative ? -wei : wei;
}

export function formatDeterministicAmount(value) {
  const wei = toWei(value);
  const negative = wei < 0n;
  const normalized = negative ? -wei : wei;
  const whole = normalized / SCALE_FACTOR;
  const fraction = (normalized % SCALE_FACTOR).toString().padStart(Number(DECIMAL_SCALE), '0');
  return `${negative ? '-' : ''}${whole.toString()}.${fraction}`;
}

function normalizeMetadata(metadata = {}, tx = {}) {
  const tags = new Set(Array.isArray(metadata.tags) ? metadata.tags : []);
  if (tx.agentName) tags.add(`agent:${tx.agentName}`);
  if (tx.chain) tags.add(`chain:${tx.chain}`);
  if (tx.direction) tags.add(`direction:${tx.direction}`);

  return {
    ...metadata,
    tags: Array.from(tags).filter(Boolean).sort()
  };
}

function normalizeTransaction(tx = {}) {
  const grossAmount = formatDeterministicAmount(tx.grossAmount ?? tx.value ?? '0');
  const fee = formatDeterministicAmount(tx.fee ?? '0');
  const netAmount = formatDeterministicAmount(
    tx.netAmount ?? (toWei(grossAmount) - toWei(fee))
  );

  return {
    hash: tx.hash,
    chain: tx.chain || 'base-sepolia',
    timestamp: tx.timestamp || new Date().toISOString(),
    from: tx.from || null,
    to: tx.to || null,
    grossAmount,
    gas: tx.gas?.toString?.() ?? tx.gas ?? null,
    fee,
    netAmount,
    status: tx.status || 'submitted',
    metadata: normalizeMetadata(tx.metadata, tx)
  };
}

function loadTransactions() {
  if (existsSync(TX_FILE)) {
    const raw = JSON.parse(readFileSync(TX_FILE, 'utf-8'));
    return raw.map(normalizeTransaction);
  }
  return [];
}

function saveTransactions(txs) {
  writeFileSync(TX_FILE, JSON.stringify(txs, null, 2));
}

let transactions = loadTransactions();

/**
 * Log a transaction
 */
export function logTransaction(tx) {
  const record = normalizeTransaction({
    ...tx,
    timestamp: tx.timestamp || new Date().toISOString()
  });
  
  transactions.unshift(record);
  
  // Keep last 100 transactions
  if (transactions.length > MAX_TX_HISTORY) {
    transactions = transactions.slice(0, MAX_TX_HISTORY);
  }
  
  saveTransactions(transactions);
  return record;
}

/**
 * Get transaction history
 */
export function getHistory(limit = 10) {
  return transactions.slice(0, limit).map(normalizeTransaction);
}

/**
 * Get transactions by wallet
 */
export function getWalletTransactions(address) {
  return transactions.filter(tx => {
    const from = tx.from?.toLowerCase?.();
    const to = tx.to?.toLowerCase?.();
    const addr = address.toLowerCase();
    return from === addr || to === addr;
  }).map(normalizeTransaction);
}

export function getTransactionByHash(hash) {
  if (!hash) return null;
  return transactions.find(tx => tx.hash?.toLowerCase() === hash.toLowerCase()) || null;
}

export function queryTransactions({ from, to, wallet, agent, chain } = {}) {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  const walletFilter = wallet?.toLowerCase?.();
  const chainFilter = chain?.toLowerCase?.();
  const agentFilter = agent?.toLowerCase?.();

  return transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    const tags = tx.metadata?.tags || [];

    if (fromDate && txDate < fromDate) return false;
    if (toDate && txDate > toDate) return false;
    if (walletFilter) {
      const fromAddr = tx.from?.toLowerCase?.();
      const toAddr = tx.to?.toLowerCase?.();
      if (fromAddr !== walletFilter && toAddr !== walletFilter) return false;
    }
    if (chainFilter && tx.chain?.toLowerCase?.() !== chainFilter) return false;
    if (agentFilter) {
      const match = tags.some(tag => tag.toLowerCase() === `agent:${agentFilter}`);
      if (!match) return false;
    }
    return true;
  }).map(normalizeTransaction);
}
