/**
 * Policy Engine Service
 *
 * Lightweight transfer guardrails:
 * - daily limit (ETH)
 * - per transaction limit (ETH)
 * - allowed recipients (optional allowlist)
 * - blocked recipients (denylist)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const POLICIES_FILE = join(process.cwd(), 'policies.json');
const POLICY_USAGE_FILE = join(process.cwd(), 'policy-usage.json');

function normalizeAddress(address) {
  return (address || '').toLowerCase();
}

function loadJson(filePath, fallback) {
  if (!existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

function saveJson(filePath, value) {
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}

let policies = loadJson(POLICIES_FILE, {});
let policyUsage = loadJson(POLICY_USAGE_FILE, {});

function persistPolicies() {
  saveJson(POLICIES_FILE, policies);
}

function persistUsage() {
  saveJson(POLICY_USAGE_FILE, policyUsage);
}

function sanitizePolicyInput(input = {}) {
  const dailyLimitEth = input.dailyLimitEth == null || input.dailyLimitEth === ''
    ? null
    : String(input.dailyLimitEth);

  const perTxLimitEth = input.perTxLimitEth == null || input.perTxLimitEth === ''
    ? null
    : String(input.perTxLimitEth);

  return {
    enabled: input.enabled !== false,
    dailyLimitEth,
    perTxLimitEth,
    allowedRecipients: Array.isArray(input.allowedRecipients)
      ? input.allowedRecipients.map(normalizeAddress).filter(Boolean)
      : [],
    blockedRecipients: Array.isArray(input.blockedRecipients)
      ? input.blockedRecipients.map(normalizeAddress).filter(Boolean)
      : [],
    updatedAt: new Date().toISOString()
  };
}

export function getPolicy(walletAddress) {
  const key = normalizeAddress(walletAddress);
  return policies[key] || {
    enabled: true,
    dailyLimitEth: null,
    perTxLimitEth: null,
    allowedRecipients: [],
    blockedRecipients: [],
    updatedAt: null
  };
}

export function setPolicy(walletAddress, policyInput) {
  const key = normalizeAddress(walletAddress);
  if (!key) {
    throw new Error('walletAddress is required');
  }

  const next = sanitizePolicyInput(policyInput);
  policies[key] = next;
  persistPolicies();
  return next;
}

function getDailySpentEth(walletAddress, dayKey) {
  const key = normalizeAddress(walletAddress);
  return Number(policyUsage[key]?.[dayKey] || 0);
}

export function recordPolicySpend({ walletAddress, valueEth, timestamp = new Date().toISOString() }) {
  const key = normalizeAddress(walletAddress);
  if (!key) return;

  const dayKey = timestamp.slice(0, 10);
  const amount = Number(valueEth || 0);
  if (!Number.isFinite(amount) || amount <= 0) return;

  if (!policyUsage[key]) {
    policyUsage[key] = {};
  }

  const current = Number(policyUsage[key][dayKey] || 0);
  policyUsage[key][dayKey] = current + amount;
  persistUsage();
}

export function evaluateTransferPolicy({ walletAddress, to, valueEth, chain, timestamp = new Date().toISOString() }) {
  const policy = getPolicy(walletAddress);
  const recipient = normalizeAddress(to);
  const amount = Number(valueEth || 0);

  if (!policy.enabled) {
    return {
      allowed: true,
      reason: 'policy_disabled',
      policy
    };
  }

  if (!recipient) {
    return {
      allowed: false,
      reason: 'invalid_recipient',
      policy
    };
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return {
      allowed: false,
      reason: 'invalid_value',
      policy
    };
  }

  if (policy.blockedRecipients.includes(recipient)) {
    return {
      allowed: false,
      reason: 'recipient_blocked',
      policy
    };
  }

  if (policy.allowedRecipients.length > 0 && !policy.allowedRecipients.includes(recipient)) {
    return {
      allowed: false,
      reason: 'recipient_not_allowlisted',
      policy
    };
  }

  if (policy.perTxLimitEth != null && amount > Number(policy.perTxLimitEth)) {
    return {
      allowed: false,
      reason: 'per_tx_limit_exceeded',
      policy,
      context: {
        perTxLimitEth: policy.perTxLimitEth,
        attemptedValueEth: String(valueEth)
      }
    };
  }

  if (policy.dailyLimitEth != null) {
    const dayKey = timestamp.slice(0, 10);
    const spentToday = getDailySpentEth(walletAddress, dayKey);
    const projected = spentToday + amount;
    const dailyLimit = Number(policy.dailyLimitEth);

    if (projected > dailyLimit) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        policy,
        context: {
          dayKey,
          spentTodayEth: spentToday,
          projectedSpendEth: projected,
          dailyLimitEth: dailyLimit,
          chain
        }
      };
    }
  }

  return {
    allowed: true,
    reason: 'ok',
    policy
  };
}
