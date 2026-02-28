import viemAdapter, { getSupportedChains } from './viem-adapter.js';
import { assertAdapterContract } from './types.js';

const SUPPORTED_PROVIDERS = ['alchemy', 'public', 'custom'];
const DEFAULT_PROVIDER = process.env.WALLET_PROVIDER || (process.env.ALCHEMY_API_KEY ? 'alchemy' : 'public');

const registry = new Map();

function makeKey(chain, provider) {
  return `${chain}:${provider}`;
}

function normalizeProvider(provider) {
  const normalized = (provider || DEFAULT_PROVIDER).toLowerCase();
  return SUPPORTED_PROVIDERS.includes(normalized) ? normalized : DEFAULT_PROVIDER;
}

export function registerAdapter({ chain, provider = '*', adapter }) {
  const validated = assertAdapterContract(adapter, adapter?.id || 'unknown');
  registry.set(makeKey(chain, provider), validated);
}

export function resolveAdapter({ chain, provider }) {
  const normalizedProvider = normalizeProvider(provider);

  return (
    registry.get(makeKey(chain, normalizedProvider)) ||
    registry.get(makeKey(chain, '*')) ||
    registry.get(makeKey('*', normalizedProvider)) ||
    registry.get(makeKey('*', '*'))
  );
}

for (const chain of getSupportedChains()) {
  for (const provider of SUPPORTED_PROVIDERS) {
    registerAdapter({ chain: chain.id, provider, adapter: viemAdapter });
  }
}

registerAdapter({ chain: '*', provider: '*', adapter: viemAdapter });

export { normalizeProvider, SUPPORTED_PROVIDERS };
