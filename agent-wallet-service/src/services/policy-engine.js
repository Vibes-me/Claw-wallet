import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const POLICY_FILE = join(process.cwd(), 'policies.json');

const DEFAULT_POLICY = {
  dailyCap: null,
  perTxCap: null,
  allowedRecipients: [],
  allowedContracts: [],
  blockedRecipients: []
};

function loadPolicies() {
  if (existsSync(POLICY_FILE)) {
    return JSON.parse(readFileSync(POLICY_FILE, 'utf-8'));
  }
  return {};
}

function savePolicies(policies) {
  writeFileSync(POLICY_FILE, JSON.stringify(policies, null, 2));
}

let policies = loadPolicies();

function normalizeAddress(value) {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

function normalizePolicy(input = {}) {
  return {
    dailyCap: input.dailyCap === null || input.dailyCap === undefined ? null : String(input.dailyCap),
    perTxCap: input.perTxCap === null || input.perTxCap === undefined ? null : String(input.perTxCap),
    allowedRecipients: Array.isArray(input.allowedRecipients)
      ? input.allowedRecipients.map(normalizeAddress).filter(Boolean)
      : [],
    allowedContracts: Array.isArray(input.allowedContracts)
      ? input.allowedContracts.map(normalizeAddress).filter(Boolean)
      : [],
    blockedRecipients: Array.isArray(input.blockedRecipients)
      ? input.blockedRecipients.map(normalizeAddress).filter(Boolean)
      : []
  };
}

function getDayBounds(timestamp = new Date().toISOString()) {
  const date = new Date(timestamp);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function toBigIntWei(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.floor(value));
  const normalized = String(value).trim();
  if (!normalized) return null;
  return BigInt(normalized);
}

function isInList(list = [], address = '') {
  if (!address) return false;
  return list.includes(normalizeAddress(address));
}

function getPolicyKey({ walletAddress, agentId }) {
  if (walletAddress) return normalizeAddress(walletAddress);
  if (agentId) return String(agentId).trim();
  return null;
}

export function getPolicy({ walletAddress, agentId }) {
  const key = getPolicyKey({ walletAddress, agentId });
  if (!key) {
    throw new Error('walletAddress or agentId is required');
  }

  const policy = policies[key];
  if (!policy) {
    return null;
  }

  return {
    key,
    ...policy
  };
}

export function setPolicy({ walletAddress, agentId, policy }) {
  const key = getPolicyKey({ walletAddress, agentId });
  if (!key) {
    throw new Error('walletAddress or agentId is required');
  }

  const normalized = normalizePolicy(policy);
  policies[key] = normalized;
  savePolicies(policies);

  return {
    key,
    ...normalized
  };
}

export function evaluateTransfer({
  agentId,
  walletAddress,
  chain,
  to,
  value,
  token = 'native',
  timestamp = new Date().toISOString(),
  dailySpent = 0n
}) {
  const key = getPolicyKey({ walletAddress, agentId });
  const matchedRule = [];

  if (!key || !policies[key]) {
    return {
      allowed: true,
      reasonCode: 'NO_POLICY',
      matchedRule,
      requiresApproval: false
    };
  }

  const policy = {
    ...DEFAULT_POLICY,
    ...policies[key]
  };

  const normalizedTo = normalizeAddress(to);
  const transferValue = toBigIntWei(value) || 0n;
  const dailySpentWei = toBigIntWei(dailySpent) || 0n;

  if (isInList(policy.blockedRecipients, normalizedTo)) {
    matchedRule.push('blockedRecipients');
    return {
      allowed: false,
      reasonCode: 'BLOCKED_RECIPIENT',
      matchedRule,
      requiresApproval: false
    };
  }

  if (policy.allowedRecipients.length > 0 && !isInList(policy.allowedRecipients, normalizedTo)) {
    matchedRule.push('allowedRecipients');
    return {
      allowed: false,
      reasonCode: 'RECIPIENT_NOT_ALLOWED',
      matchedRule,
      requiresApproval: false
    };
  }

  if (policy.perTxCap !== null) {
    const perTxCapWei = toBigIntWei(policy.perTxCap);
    if (perTxCapWei !== null && transferValue > perTxCapWei) {
      matchedRule.push('perTxCap');
      return {
        allowed: false,
        reasonCode: 'PER_TX_CAP_EXCEEDED',
        matchedRule,
        requiresApproval: true
      };
    }
  }

  if (policy.dailyCap !== null) {
    const dailyCapWei = toBigIntWei(policy.dailyCap);
    if (dailyCapWei !== null && (dailySpentWei + transferValue) > dailyCapWei) {
      matchedRule.push('dailyCap');
      return {
        allowed: false,
        reasonCode: 'DAILY_CAP_EXCEEDED',
        matchedRule,
        requiresApproval: true
      };
    }
  }

  if (policy.allowedContracts.length > 0 && token === 'contract') {
    if (!isInList(policy.allowedContracts, normalizedTo)) {
      matchedRule.push('allowedContracts');
      return {
        allowed: false,
        reasonCode: 'CONTRACT_NOT_ALLOWED',
        matchedRule,
        requiresApproval: false
      };
    }
  }

  return {
    allowed: true,
    reasonCode: 'ALLOWED',
    matchedRule,
    requiresApproval: false,
    metadata: {
      chain,
      token,
      period: getDayBounds(timestamp)
    }
  };
}

export function getPoliciesSnapshot() {
  return policies;
}
