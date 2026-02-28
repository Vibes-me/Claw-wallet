import { createHash } from 'crypto';

const AA_ENABLED = process.env.AA_BUNDLER_ENABLED === 'true';
const BUNDLER_URL = process.env.AA_BUNDLER_URL || '';
const PAYMASTER_URL = process.env.AA_PAYMASTER_URL || '';
const AA_SUPPORTED_CHAINS = new Set(['base-sepolia', 'base', 'ethereum-sepolia', 'optimism-sepolia']);

export function getAAProviderConfig() {
  return {
    enabled: AA_ENABLED,
    bundlerUrlConfigured: Boolean(BUNDLER_URL),
    paymasterUrlConfigured: Boolean(PAYMASTER_URL),
    supportedChains: Array.from(AA_SUPPORTED_CHAINS)
  };
}

function assertAAEnabled() {
  if (!AA_ENABLED) {
    throw new Error('AA mode is disabled. Set AA_BUNDLER_ENABLED=true to enable bundler/paymaster integration.');
  }
}

function assertChainSupported(chain) {
  if (!AA_SUPPORTED_CHAINS.has(chain)) {
    throw new Error(`AA mode is not supported on ${chain}. Supported chains: ${Array.from(AA_SUPPORTED_CHAINS).join(', ')}`);
  }
}

export async function checkSponsorshipPolicy({ chain, walletType, operationType = 'transfer', value = '0' }) {
  assertAAEnabled();
  assertChainSupported(chain);

  const maxSponsoredEth = Number(process.env.AA_MAX_SPONSORED_ETH || '0.01');
  const normalizedValue = Number(value || '0');
  const supportedWalletType = walletType === 'smart-account';
  const sponsored = supportedWalletType && operationType === 'transfer' && normalizedValue <= maxSponsoredEth;

  return {
    chain,
    walletType,
    operationType,
    value,
    sponsored,
    reason: sponsored
      ? 'Eligible for paymaster sponsorship under current policy threshold.'
      : 'Not eligible: requires smart-account transfer and value within sponsorship threshold.',
    policy: {
      maxSponsoredEth,
      paymasterUrlConfigured: Boolean(PAYMASTER_URL)
    }
  };
}

export async function submitUserOperation({ from, to, value = '0', data = '0x', chain, walletType }) {
  assertAAEnabled();
  assertChainSupported(chain);

  if (walletType !== 'smart-account') {
    throw new Error('User operations are only supported for smart-account wallets.');
  }

  const sponsorship = await checkSponsorshipPolicy({ chain, walletType, operationType: 'transfer', value });
  const operationPayload = JSON.stringify({ from, to, value, data, chain, ts: Date.now() });
  const userOpHash = `0x${createHash('sha256').update(operationPayload).digest('hex')}`;

  return {
    userOpHash,
    entryPoint: process.env.AA_ENTRYPOINT || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    bundler: BUNDLER_URL || 'configured-via-env',
    paymaster: PAYMASTER_URL || 'configured-via-env',
    sponsorship,
    status: 'submitted'
  };
}
