/**
 * ERC-8004: AI Agent Identity
 * 
 * On-chain identity for AI agents
 * https://eips.ethereum.org/EIPS/eip-8004
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes, createHash } from 'crypto';

const IDENTITY_FILE = join(process.cwd(), 'agent-identities.json');

// ERC-8004 compliant identity structure
const ERC8004_SCHEMA = {
  version: '1.0.0',
  standard: 'ERC-8004',
  agentTypes: ['assistant', 'autonomous', 'hybrid'],
  capabilities: ['wallet', 'messaging', 'data_access', 'code_execution', 'external_api']
};

// Load identities
function loadIdentities() {
  if (existsSync(IDENTITY_FILE)) {
    return JSON.parse(readFileSync(IDENTITY_FILE, 'utf-8'));
  }
  return {};
}

function saveIdentities(identities) {
  writeFileSync(IDENTITY_FILE, JSON.stringify(identities, null, 2));
}

const identities = loadIdentities();

/**
 * Generate unique agent ID (ERC-8004 compliant)
 */
function generateAgentId(walletAddress, agentName) {
  const timestamp = Date.now();
  const salt = randomBytes(32).toString('hex');
  const hashInput = `${walletAddress}:${agentName}:${timestamp}:${salt}`;
  const idHash = createHash('sha256').update(hashInput).digest('hex');
  
  return {
    id: `agent:${idHash.slice(0, 16)}`,
    hash: `0x${idHash}`,
    timestamp,
    salt
  };
}

/**
 * Create ERC-8004 agent identity
 */
export async function createAgentIdentity({
  walletAddress,
  agentName,
  description,
  agentType = 'assistant',
  capabilities = ['wallet'],
  metadata = {},
  owner,
  chain = 'base-sepolia'
}) {
  try {
    // Validate agent type
    if (!ERC8004_SCHEMA.agentTypes.includes(agentType)) {
      throw new Error(`Invalid agent type. Must be: ${ERC8004_SCHEMA.agentTypes.join(', ')}`);
    }

    // Generate identity
    const agentId = generateAgentId(walletAddress, agentName);
    
    const identity = {
      // ERC-8004 required fields
      '@context': 'https://eips.ethereum.org/EIPS/eip-8004',
      id: agentId.id,
      version: ERC8004_SCHEMA.version,
      
      // Agent identification
      name: agentName,
      description: description || `${agentName} AI Agent`,
      type: agentType,
      
      // Ownership & control
      wallet: walletAddress,
      owner: owner || walletAddress,
      
      // Capabilities (what this agent can do)
      capabilities: capabilities.map(cap => ({
        type: cap,
        granted: true,
        grantedAt: new Date().toISOString()
      })),
      
      // Metadata
      metadata: {
        createdAt: new Date().toISOString(),
        chain,
        standard: 'ERC-8004',
        ...metadata
      },
      
      // Verification
      verification: {
        hash: agentId.hash,
        timestamp: agentId.timestamp,
        salt: agentId.salt
      }
    };

    // Store identity
    identities[agentId.id] = identity;
    saveIdentities(identities);

    console.log(`✅ Created ERC-8004 identity: ${agentId.id}`);

    return identity;
  } catch (error) {
    console.error('Failed to create identity:', error);
    throw error;
  }
}

/**
 * Get agent identity by ID
 */
export function getIdentity(agentId) {
  return identities[agentId] || null;
}

/**
 * Get all identities for a wallet
 */
export function getIdentitiesByWallet(walletAddress) {
  return Object.values(identities).filter(
    id => id.wallet.toLowerCase() === walletAddress.toLowerCase()
  );
}

/**
 * List all identities
 */
export function listIdentities() {
  return Object.values(identities);
}

/**
 * Update agent capability
 */
export function updateCapability(agentId, capability, granted) {
  const identity = identities[agentId];
  if (!identity) throw new Error('Identity not found');

  const capIndex = identity.capabilities.findIndex(c => c.type === capability);
  
  if (capIndex >= 0) {
    identity.capabilities[capIndex].granted = granted;
    identity.capabilities[capIndex].updatedAt = new Date().toISOString();
  } else if (granted) {
    identity.capabilities.push({
      type: capability,
      granted: true,
      grantedAt: new Date().toISOString()
    });
  }

  identity.metadata.updatedAt = new Date().toISOString();
  identities[agentId] = identity;
  saveIdentities(identities);

  return identity;
}

/**
 * Revoke agent identity
 */
export function revokeIdentity(agentId) {
  if (!identities[agentId]) return false;
  
  identities[agentId].metadata.revokedAt = new Date().toISOString();
  identities[agentId].metadata.status = 'revoked';
  saveIdentities(identities);
  
  return true;
}

/**
 * Generate verification proof
 */
export function generateVerificationProof(agentId) {
  const identity = identities[agentId];
  if (!identity) throw new Error('Identity not found');

  // Create message to sign
  const message = JSON.stringify({
    agentId: identity.id,
    wallet: identity.wallet,
    timestamp: Date.now()
  });

  // Note: In production, sign with agent's wallet private key
  
  return {
    agentId: identity.id,
    wallet: identity.wallet,
    message,
    timestamp: Date.now(),
    valid: true
  };
}

/**
 * Export identity as verifiable credential (W3C compatible)
 */
export function exportVerifiableCredential(agentId) {
  const identity = identities[agentId];
  if (!identity) throw new Error('Identity not found');

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://eips.ethereum.org/EIPS/eip-8004'
    ],
    id: identity.id,
    type: ['VerifiableCredential', 'AgentIdentityCredential'],
    issuer: identity.wallet,
    issuanceDate: identity.metadata.createdAt,
    credentialSubject: {
      id: identity.id,
      name: identity.name,
      type: identity.type,
      capabilities: identity.capabilities
    },
    proof: {
      type: 'EthereumEip712Signature2021',
      verificationMethod: identity.wallet,
      proofPurpose: 'assertionMethod'
    }
  };
}

/**
 * Get supported capabilities
 */
export function getSupportedCapabilities() {
  return ERC8004_SCHEMA.capabilities;
}

/**
 * Get agent types
 */
export function getAgentTypes() {
  return ERC8004_SCHEMA.agentTypes;
}
