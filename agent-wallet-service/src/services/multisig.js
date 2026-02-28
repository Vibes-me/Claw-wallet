import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getWalletByAddress } from './viem-wallet.js';
import { logEvent } from './tx-history.js';
import { emitWebhook } from './webhooks.js';

const MULTISIG_FILE = join(process.cwd(), 'multisig.json');

function loadState() {
  if (existsSync(MULTISIG_FILE)) {
    return JSON.parse(readFileSync(MULTISIG_FILE, 'utf-8'));
  }

  return {
    configs: {},
    proposals: {}
  };
}

function saveState(state) {
  writeFileSync(MULTISIG_FILE, JSON.stringify(state, null, 2));
}

const state = loadState();

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function validateScope(scope = {}) {
  const normalized = {
    type: scope.type || 'all'
  };

  if (!['all', 'above_amount', 'specific_chains'].includes(normalized.type)) {
    throw new Error('scope.type must be one of: all, above_amount, specific_chains');
  }

  if (normalized.type === 'above_amount') {
    if (scope.minAmount === undefined || Number(scope.minAmount) < 0) {
      throw new Error('scope.minAmount is required for above_amount scope');
    }
    normalized.minAmount = String(scope.minAmount);
  }

  if (normalized.type === 'specific_chains') {
    if (!Array.isArray(scope.chains) || !scope.chains.length) {
      throw new Error('scope.chains is required for specific_chains scope');
    }
    normalized.chains = scope.chains;
  }

  return normalized;
}

function requiresApproval(config, operation) {
  if (!config) {
    return false;
  }

  const scope = config.scope || { type: 'all' };
  if (scope.type === 'all') {
    return true;
  }

  if (scope.type === 'above_amount') {
    const amount = Number(operation.value || 0);
    return amount >= Number(scope.minAmount || 0);
  }

  if (scope.type === 'specific_chains') {
    return scope.chains.includes(operation.chain);
  }

  return false;
}

async function emitProposalEvent(type, proposal) {
  const eventPayload = {
    txProposalId: proposal.id,
    walletAddress: proposal.walletAddress,
    action: proposal.action,
    status: proposal.status,
    approvals: proposal.approvals
  };

  logEvent({
    type: `proposal.${type}`,
    chain: proposal.payload.chain,
    ...eventPayload
  });

  await emitWebhook(`proposal.${type}`, eventPayload);
}

export function createMultisigConfig({ walletAddress, signers, threshold, scope }) {
  const wallet = getWalletByAddress(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found: ${walletAddress}`);
  }

  if (!Array.isArray(signers) || signers.length < 1) {
    throw new Error('signers must be a non-empty array');
  }

  if (!Number.isInteger(threshold) || threshold < 1 || threshold > signers.length) {
    throw new Error('threshold must be an integer between 1 and signer count');
  }

  const configId = createId('msig');
  const config = {
    id: configId,
    walletAddress,
    signers,
    threshold,
    scope: validateScope(scope),
    createdAt: new Date().toISOString()
  };

  state.configs[configId] = config;
  saveState(state);

  return config;
}

export function getMultisigConfig(configId) {
  return state.configs[configId] || null;
}

export function createProposal({ walletAddress, action, payload, requestedBy }) {
  const wallet = getWalletByAddress(walletAddress);
  if (!wallet) {
    throw new Error(`Wallet not found: ${walletAddress}`);
  }

  if (wallet.securityMode !== 'multisig' || !wallet.multisigConfigId) {
    throw new Error('Wallet is not multisig-enabled');
  }

  const config = getMultisigConfig(wallet.multisigConfigId);
  if (!config) {
    throw new Error(`Multisig config missing: ${wallet.multisigConfigId}`);
  }

  if (!requiresApproval(config, payload)) {
    return null;
  }

  const proposalId = createId('txp');
  const proposal = {
    id: proposalId,
    walletAddress,
    configId: config.id,
    action,
    payload,
    requestedBy,
    approvals: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    executedAt: null,
    executedTx: null
  };

  state.proposals[proposalId] = proposal;
  saveState(state);

  emitProposalEvent('created', proposal).catch(error => {
    console.error('Failed to emit proposal created event:', error.message);
  });

  return proposal;
}

export function approveProposal({ proposalId, signerId }) {
  const proposal = state.proposals[proposalId];
  if (!proposal) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  if (proposal.status !== 'pending') {
    throw new Error(`Proposal is ${proposal.status} and cannot be approved`);
  }

  const config = getMultisigConfig(proposal.configId);
  if (!config) {
    throw new Error('Multisig config not found for proposal');
  }

  const signer = config.signers.find(candidate => candidate.id === signerId || candidate.apiKeyName === signerId);
  if (!signer) {
    throw new Error('Signer is not authorized for this proposal');
  }

  if (proposal.approvals.some(approval => approval.signerId === signer.id)) {
    return proposal;
  }

  proposal.approvals.push({
    signerId: signer.id,
    approvedAt: new Date().toISOString()
  });

  saveState(state);

  emitProposalEvent('approved', proposal).catch(error => {
    console.error('Failed to emit proposal approved event:', error.message);
  });

  return proposal;
}

export function getProposal(proposalId) {
  return state.proposals[proposalId] || null;
}

export function listProposals() {
  return Object.values(state.proposals).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function canExecuteProposal(proposal) {
  const config = getMultisigConfig(proposal.configId);
  return Boolean(config && proposal.approvals.length >= config.threshold);
}

export function markProposalExecuted(proposalId, executedTx) {
  const proposal = state.proposals[proposalId];
  if (!proposal) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  proposal.status = 'executed';
  proposal.executedAt = new Date().toISOString();
  proposal.executedTx = executedTx;
  saveState(state);

  emitProposalEvent('executed', proposal).catch(error => {
    console.error('Failed to emit proposal executed event:', error.message);
  });

  return proposal;
}
