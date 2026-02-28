/**
 * Transaction History Service
 * 
 * Simple transaction logging
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

/**
 * Log a transaction
 */
export function logTransaction(tx) {
  const record = {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    timestamp: new Date().toISOString(),
    chain: 'base-sepolia'
  };
  
  transactions.unshift(record);
  
  // Keep last 100 transactions
  if (transactions.length > 100) {
    transactions = transactions.slice(0, 100);
  }
  
  saveTransactions(transactions);
  return record;
}

/**
 * Get transaction history
 */
export function getHistory(limit = 10) {
  return transactions.slice(0, limit);
}

/**
 * Get transactions by wallet
 */
export function getWalletTransactions(address) {
  return transactions.filter(tx => 
    tx.from.toLowerCase() === address.toLowerCase() ||
    tx.to.toLowerCase() === address.toLowerCase()
  );
}
