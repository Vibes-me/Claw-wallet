/**
 * Transaction History Service
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TX_FILE = join(process.cwd(), 'transactions.json');

function loadTransactions() {
  if (existsSync(TX_FILE)) {
    return JSON.parse(readFileSync(TX_FILE, 'utf-8'));
  }
  return [];
}

function saveTransactions(txs) {
  writeFileSync(TX_FILE, JSON.stringify(txs, null, 2));
}

let transactions = loadTransactions();

export function logEvent(event) {
  const record = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    ...event
  };

  transactions.unshift(record);

  if (transactions.length > 200) {
    transactions = transactions.slice(0, 200);
  }

  saveTransactions(transactions);
  return record;
}

/**
 * Log a transaction
 */
export function logTransaction(tx) {
  return logEvent({
    type: 'transaction.sent',
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    chain: tx.chain || 'base-sepolia'
  });
}

export function getHistory(limit = 10) {
  return transactions.slice(0, limit);
}

export function getWalletTransactions(address) {
  return transactions.filter(tx =>
    tx.from?.toLowerCase() === address.toLowerCase() ||
    tx.to?.toLowerCase() === address.toLowerCase() ||
    tx.walletAddress?.toLowerCase() === address.toLowerCase()
  );
}
