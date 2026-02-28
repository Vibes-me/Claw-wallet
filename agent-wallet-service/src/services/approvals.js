import { createHmac, createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const APPROVALS_FILE = join(process.cwd(), 'approvals.json');
const DEFAULT_TTL_MS = 15 * 60 * 1000;
const TOKEN_SECRET = process.env.APPROVAL_TOKEN_SECRET || 'local-approval-secret';

function loadApprovals() {
  if (!existsSync(APPROVALS_FILE)) {
    return [];
  }
  return JSON.parse(readFileSync(APPROVALS_FILE, 'utf-8'));
}

function saveApprovals(records) {
  writeFileSync(APPROVALS_FILE, JSON.stringify(records, null, 2));
}

let approvals = loadApprovals();

function nowIso() {
  return new Date().toISOString();
}

function hasExpired(record) {
  return Date.now() > new Date(record.expiresAt).getTime();
}

function persist() {
  saveApprovals(approvals);
}

export function generateDeterministicRequestId(transfer) {
  const canonical = JSON.stringify({
    from: transfer.from?.toLowerCase(),
    to: transfer.to?.toLowerCase(),
    value: transfer.value,
    data: transfer.data || '0x',
    chain: transfer.chain || 'base-sepolia',
    policyId: transfer.policyId || null,
    policyVersion: transfer.policyVersion || null
  });

  return `apr_${createHash('sha256').update(canonical).digest('hex').slice(0, 24)}`;
}

export function createApprovalRequest({ requestId, transfer, requestedBy, ttlMs = DEFAULT_TTL_MS }) {
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const token = createHmac('sha256', TOKEN_SECRET)
    .update(`${requestId}:${expiresAt}:${JSON.stringify(transfer)}`)
    .digest('hex');

  const existing = approvals.find((record) => record.id === requestId);
  if (existing) {
    if (existing.status === 'expired' || existing.status === 'rejected') {
      throw new Error(`Approval request is not actionable: ${existing.status}`);
    }
    return existing;
  }

  const record = {
    id: requestId,
    token,
    status: 'pending',
    createdAt,
    expiresAt,
    requestedBy: requestedBy || 'unknown',
    transfer: {
      ...transfer,
      data: transfer.data || '0x',
      chain: transfer.chain || 'base-sepolia'
    },
    pendingTransfer: {
      requestId,
      status: 'pending_approval',
      createdAt
    },
    decision: null,
    execution: null
  };

  approvals.unshift(record);
  persist();
  return record;
}

export function getApprovalRequest(id) {
  const record = approvals.find((entry) => entry.id === id);
  if (!record) {
    return null;
  }

  if (record.status === 'pending' && hasExpired(record)) {
    record.status = 'expired';
    record.pendingTransfer.status = 'expired';
    persist();
  }

  return record;
}

export function setApprovalDecision(id, status, actor) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Invalid decision status');
  }

  const record = getApprovalRequest(id);
  if (!record) {
    throw new Error(`Approval request not found: ${id}`);
  }

  if (record.status === 'expired') {
    throw new Error('Approval request has expired');
  }

  if (record.status !== 'pending') {
    throw new Error(`Approval request already ${record.status}`);
  }

  record.status = status;
  record.pendingTransfer.status = status;
  record.decision = {
    status,
    actor: actor || 'unknown',
    decidedAt: nowIso()
  };

  persist();
  return record;
}

export function setApprovalExecution(id, execution) {
  const record = getApprovalRequest(id);
  if (!record) {
    throw new Error(`Approval request not found: ${id}`);
  }

  record.execution = {
    ...execution,
    updatedAt: nowIso()
  };

  if (execution?.status === 'submitted') {
    record.pendingTransfer.status = 'submitted';
  }

  persist();
  return record;
}

export function listApprovals(limit = 50) {
  return approvals.slice(0, limit);
}
