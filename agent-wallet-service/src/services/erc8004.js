/**
 * ERC-8004 Identity Service
 * 
 * Manages on-chain agent identity registration
 * 
 * Deployed Contracts (ETH Sepolia):
 * - IdentityRegistry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
 * - ReputationRegistry: 0x8004B663056A597Dffe9eCcC1965A193B7388713
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';

// ERC-8004 contract addresses (Sepolia testnet)
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713';

// ERC-8004 Identity Registry ABI (minimal)
const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [{ name: 'agentURI', type: 'string' }],
    name: 'register',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgentURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgentWallet',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newWallet', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'setAgentWallet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Store registered agents (TODO: use proper DB)
const agents = new Map();

/**
 * Create agent registration metadata (would go to IPFS)
 */
function createAgentMetadata({ name, description, walletAddress }) {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name,
    description,
    image: 'ipfs://Qm...', // TODO: agent avatar
    services: [
      {
        name: 'api',
        endpoint: 'https://api.openclaw.ai/agents/mr-claw'
      }
    ],
    supportedTrust: ['reputation'],
    active: true,
    walletAddress
  };
}

/**
 * Register an agent on ERC-8004
 */
export async function registerAgent({ agentId, name, description, walletAddress }) {
  // Create metadata
  const metadata = createAgentMetadata({ name, description, walletAddress });
  const agentURI = JSON.stringify(metadata);

  // For now, store locally (TODO: upload to IPFS, then register on-chain)
  const registrationId = agentId || `agent_${Date.now()}`;
  
  agents.set(registrationId, {
    id: registrationId,
    name,
    description,
    walletAddress,
    metadata,
    registeredAt: new Date().toISOString(),
    onChain: false // Will be true after on-chain registration
  });

  console.log(`✅ Registered agent: ${name} (${registrationId})`);

  return {
    id: registrationId,
    name,
    walletAddress,
    agentURI,
    onChain: false
  };
}

/**
 * Get agent info
 */
export async function getAgent(agentId) {
  const agent = agents.get(agentId);
  
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  return agent;
}

/**
 * Get all registered agents
 */
export function getAllAgents() {
  return Array.from(agents.values());
}

/**
 * TODO: Register on-chain with viem
 * Requires private key and gas
 */
export async function registerOnChain(agentId, privateKey) {
  // TODO: Implement on-chain registration
  // 1. Upload metadata to IPFS
  // 2. Call IdentityRegistry.register(agentURI)
  // 3. Set agentWallet
  throw new Error('On-chain registration not yet implemented');
}
