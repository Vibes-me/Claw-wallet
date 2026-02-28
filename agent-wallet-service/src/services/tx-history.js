/**
 * Transaction History Service
 *
 * Tracks tx lifecycle state and webhook subscriptions.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { createPublicClient, http } from 'viem';
import {
  baseSepolia, base, mainnet, sepolia,
  polygon, optimism, optimismSepolia,
  arbitrum, arbitrumSepolia
} from 'viem/chains';

const TX_FILE = join(process.cwd(), 'transactions.json');
const WEBHOOK_FILE = join(process.cwd(), 'tx-webhooks.json');
const MAX_TX_HISTORY = 100;

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const DEFAULT_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-webhook-secret';
const POLL_INTERVAL_MS = parseInt(process.env.TX_POLL_INTERVAL_MS || '12000', 10);
const DEFAULT_MAX_RETRIES = parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10);
const DEFAULT_BASE_BACKOFF_MS = parseInt(process.env.WEBHOOK_BASE_BACKOFF_MS || '1000', 10);

const getAlchemyUrl = (network) => ALCHEMY_KEY
  ? `https://${network}.g.alchemy.com/v2/${ALCHEMY_KEY}`
  : null;

const CHAINS = {
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
  base: {
    chain: base,
    rpcs: [getAlchemyUrl('base-mainnet'), 'https://mainnet.base.org', 'https://base-rpc.publicnode.com'].filter(Boolean)
  },
  ethereum: {
    chain: mainnet,
    rpcs: [getAlchemyUrl('eth-mainnet'), 'https://ethereum.publicnode.com', 'https://eth.llamarpc.com'].filter(Boolean)
  },
  polygon: {
    chain: polygon,
    rpcs: [getAlchemyUrl('polygon-mainnet'), 'https://polygon-rpc.com', 'https://polygon-bor.publicnode.com'].filter(Boolean)
  },
  optimism: {
    chain: optimism,
    rpcs: [getAlchemyUrl('opt-mainnet'), 'https://mainnet.optimism.io', 'https://optimism.publicnode.com'].filter(Boolean)
  },
  arbitrum: {
    chain: arbitrum,
    rpcs: [getAlchemyUrl('arb-mainnet'), 'https://arb1.arbitrum.io/rpc', 'https://arbitrum-one.publicnode.com'].filter(Boolean)
  }
};

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

let transactions = loadJson(TX_FILE, []);
let webhooks = loadJson(WEBHOOK_FILE, []);
let pollingTimer = null;
let pollingInFlight = false;

function normalizeTx(tx) {
  if (tx.lifecycle) return tx;

  const submittedAt = tx.timestamp || new Date().toISOString();
  return {
    ...tx,
    state: tx.status || 'submitted',
    lifecycle: {
      submittedAt,
      pendingAt: tx.status === 'pending' ? submittedAt : null,
      confirmedAt: tx.status === 'confirmed' ? submittedAt : null,
      failedAt: tx.status === 'failed' ? submittedAt : null,
      updatedAt: submittedAt
    },
    stateHistory: [{ state: tx.status || 'submitted', at: submittedAt }]
  };
}

transactions = transactions.map(normalizeTx);
saveJson(TX_FILE, transactions);

function updateState(tx, state, metadata = {}) {
  const now = new Date().toISOString();
  if (!tx.lifecycle) {
    tx.lifecycle = {
      submittedAt: now,
      pendingAt: null,
      confirmedAt: null,
      failedAt: null,
      updatedAt: now
    };
  }

  if (!tx.stateHistory) {
    tx.stateHistory = [];
  }

  if (tx.state !== state) {
    tx.stateHistory.push({ state, at: now });
  }

  tx.state = state;
  tx.lifecycle.updatedAt = now;

  if (state === 'submitted' && !tx.lifecycle.submittedAt) tx.lifecycle.submittedAt = now;
  if (state === 'pending' && !tx.lifecycle.pendingAt) tx.lifecycle.pendingAt = now;
  if (state === 'confirmed' && !tx.lifecycle.confirmedAt) tx.lifecycle.confirmedAt = now;
  if (state === 'failed' && !tx.lifecycle.failedAt) tx.lifecycle.failedAt = now;

  if (metadata.blockNumber !== undefined) tx.blockNumber = metadata.blockNumber;
  if (metadata.gasUsed !== undefined) tx.gasUsed = metadata.gasUsed;
  if (metadata.error) tx.error = metadata.error;

  return tx;
}

async function getReceiptByChain(hash, chainName) {
  const config = CHAINS[chainName];
  if (!config) throw new Error(`Unsupported chain: ${chainName}`);

  for (const rpc of config.rpcs) {
    try {
      const client = createPublicClient({ chain: config.chain, transport: http(rpc) });
      const receipt = await client.getTransactionReceipt({ hash });
      return {
        state: receipt.status === 'success' ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString()
      };
    } catch (error) {
      continue;
    }
  }

  return { state: 'pending' };
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function deliverWebhook(webhook, event) {
  const payload = JSON.stringify(event);
  const timestamp = Date.now().toString();
  const signature = signPayload(`${timestamp}.${payload}`, webhook.secret || DEFAULT_WEBHOOK_SECRET);

  const res = await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tx-Webhook-Id': webhook.id,
      'X-Tx-Webhook-Event': event.type,
      'X-Tx-Webhook-Timestamp': timestamp,
      'X-Tx-Webhook-Signature': signature
    },
    body: payload
  });

  if (!res.ok) {
    throw new Error(`Webhook ${webhook.url} returned HTTP ${res.status}`);
  }
}

function queueWebhook(webhook, event, attempt = 1) {
  const maxRetries = webhook.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = webhook.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;

  deliverWebhook(webhook, event).catch((error) => {
    if (attempt > maxRetries) {
      console.error(`Webhook delivery failed after ${maxRetries} retries`, error.message);
      return;
    }

    const delay = Math.min(baseDelay * (2 ** (attempt - 1)), 30000);
    setTimeout(() => queueWebhook(webhook, event, attempt + 1), delay);
  });
}

function notifyWebhooks(event) {
  for (const hook of webhooks) {
    if (!hook.enabled) continue;
    const events = hook.events || ['tx.status.updated'];
    if (!events.includes(event.type)) continue;
    if (hook.chains?.length && !hook.chains.includes(event.chain)) continue;

    queueWebhook(hook, event);
  }
}

function persistTransactions() {
  saveJson(TX_FILE, transactions);
}

async function runPollingPass() {
  if (pollingInFlight) return;
  pollingInFlight = true;

  try {
    const pendingTxs = transactions.filter(tx => ['submitted', 'pending'].includes(tx.state));
    const txsByChain = pendingTxs.reduce((acc, tx) => {
      acc[tx.chain] = acc[tx.chain] || [];
      acc[tx.chain].push(tx);
      return acc;
    }, {});

    for (const [chainName, chainTxs] of Object.entries(txsByChain)) {
      for (const tx of chainTxs) {
        const receipt = await getReceiptByChain(tx.hash, chainName);
        const prevState = tx.state;
        updateState(tx, receipt.state, receipt);

        if (prevState !== tx.state) {
          notifyWebhooks({
            type: 'tx.status.updated',
            txHash: tx.hash,
            chain: tx.chain,
            fromState: prevState,
            toState: tx.state,
            lifecycle: tx.lifecycle,
            updatedAt: tx.lifecycle.updatedAt
          });
        }
      }
    }

    persistTransactions();
  } finally {
    pollingInFlight = false;
  }
}

export function startTxStatusPolling() {
  if (pollingTimer) return;

  pollingTimer = setInterval(() => {
    runPollingPass().catch((error) => {
      console.error('Transaction polling error:', error.message);
    });
  }, POLL_INTERVAL_MS);

  if (pollingTimer.unref) pollingTimer.unref();

  runPollingPass().catch((error) => {
    console.error('Initial transaction polling error:', error.message);
  });
}

/**
 * Log a transaction
 */
export function logTransaction(tx) {
  const record = {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    chain: tx.chain || 'base-sepolia',
    state: 'submitted',
    lifecycle: {
      submittedAt: new Date().toISOString(),
      pendingAt: null,
      confirmedAt: null,
      failedAt: null,
      updatedAt: new Date().toISOString()
    },
    stateHistory: []
  };

  updateState(record, 'submitted');

  transactions.unshift(record);

  if (transactions.length > MAX_TX_HISTORY) {
    transactions = transactions.slice(0, MAX_TX_HISTORY);
  }

  persistTransactions();
  return record;
}

export function getHistory(limit = 10) {
  return transactions.slice(0, limit);
}

export function getWalletTransactions(address) {
  return transactions.filter(tx =>
    tx.from.toLowerCase() === address.toLowerCase() ||
    tx.to.toLowerCase() === address.toLowerCase()
  );
}

export function registerWebhook({ url, events, chains, secret, maxRetries, baseBackoffMs }) {
  const hook = {
    id: `wh_${Date.now()}`,
    url,
    events: events?.length ? events : ['tx.status.updated'],
    chains: chains || [],
    secret: secret || DEFAULT_WEBHOOK_SECRET,
    maxRetries: Number.isInteger(maxRetries) ? maxRetries : DEFAULT_MAX_RETRIES,
    baseBackoffMs: Number.isInteger(baseBackoffMs) ? baseBackoffMs : DEFAULT_BASE_BACKOFF_MS,
    enabled: true,
    createdAt: new Date().toISOString()
  };

  webhooks.push(hook);
  saveJson(WEBHOOK_FILE, webhooks);
  return { ...hook, secret: '***' };
}

export function listWebhooks() {
  return webhooks.map(h => ({ ...h, secret: '***' }));
}

export function removeWebhook(id) {
  const before = webhooks.length;
  webhooks = webhooks.filter(h => h.id !== id);
  saveJson(WEBHOOK_FILE, webhooks);
  return webhooks.length < before;
}

export function sendTestWebhook({ webhookId, txHash = '0xtest', chain = 'base-sepolia', state = 'pending' }) {
  const hook = webhooks.find(w => w.id === webhookId);
  if (!hook) throw new Error(`Webhook not found: ${webhookId}`);

  const event = {
    type: 'tx.status.updated',
    txHash,
    chain,
    fromState: 'submitted',
    toState: state,
    lifecycle: {
      submittedAt: new Date().toISOString(),
      pendingAt: state === 'pending' ? new Date().toISOString() : null,
      confirmedAt: state === 'confirmed' ? new Date().toISOString() : null,
      failedAt: state === 'failed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString(),
    test: true
  };

  queueWebhook(hook, event);
  return { queued: true, webhookId, event };
}
