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
    type: tx.type || 'transaction',
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    timestamp: new Date().toISOString(),
    chain: tx.chain || 'base-sepolia',
    policyDecision: tx.policyDecision || null
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
 * Log policy decision for transfer attempts
 */
export function logPolicyDecision(decision) {
  const record = {
    type: 'policy-decision',
    hash: decision.hash || null,
    from: decision.from,
    to: decision.to,
    value: decision.value,
    chain: decision.chain || 'base-sepolia',
    timestamp: new Date().toISOString(),
    policyDecision: {
      allowed: decision.allowed,
      reasonCode: decision.reasonCode,
      matchedRule: decision.matchedRule || [],
      requiresApproval: Boolean(decision.requiresApproval)
    }
  };

  transactions.unshift(record);
  if (transactions.length > 100) {
    transactions = transactions.slice(0, 100);
  }
  saveTransactions(transactions);
  return record;
}

/**
 * Get total outgoing value for a wallet in UTC day window
 */
export function getDailyOutgoingTotal(address, dayISOString = new Date().toISOString()) {
  const day = new Date(dayISOString);
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);

  const total = transactions.reduce((acc, tx) => {
    const timestamp = tx.timestamp ? new Date(tx.timestamp) : null;
    if (!timestamp || Number.isNaN(timestamp.getTime())) return acc;
    if (timestamp < start || timestamp >= end) return acc;
    if ((tx.type || 'transaction') !== 'transaction') return acc;
    if (!tx.from || tx.from.toLowerCase() !== address.toLowerCase()) return acc;

    try {
      return acc + BigInt(String(tx.value));
    } catch {
      return acc;
    }
  }, 0n);

  return total;
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
