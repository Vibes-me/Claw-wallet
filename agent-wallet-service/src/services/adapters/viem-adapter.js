import 'dotenv/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther
} from 'viem';
import {
  baseSepolia,
  base,
  mainnet,
  sepolia,
  polygon,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia
} from 'viem/chains';

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY;
const DEFAULT_PROVIDER = process.env.WALLET_PROVIDER || (ALCHEMY_KEY ? 'alchemy' : 'public');

const CHAIN_CONFIG = {
  'base-sepolia': {
    chain: baseSepolia,
    alchemyNetwork: 'base-sepolia',
    publicRpcs: ['https://sepolia.base.org', 'https://base-sepolia.blockpi.network/v1/rpc/public']
  },
  'ethereum-sepolia': {
    chain: sepolia,
    alchemyNetwork: 'eth-sepolia',
    publicRpcs: ['https://ethereum-sepolia.publicnode.com', 'https://rpc.sepolia.org']
  },
  'optimism-sepolia': {
    chain: optimismSepolia,
    alchemyNetwork: 'opt-sepolia',
    publicRpcs: ['https://sepolia.optimism.io', 'https://optimism-sepolia.publicnode.com']
  },
  'arbitrum-sepolia': {
    chain: arbitrumSepolia,
    alchemyNetwork: 'arb-sepolia',
    publicRpcs: ['https://sepolia-rollup.arbitrum.io/rpc', 'https://arbitrum-sepolia.publicnode.com']
  },
  base: {
    chain: base,
    alchemyNetwork: 'base-mainnet',
    publicRpcs: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com']
  },
  ethereum: {
    chain: mainnet,
    alchemyNetwork: 'eth-mainnet',
    publicRpcs: ['https://ethereum.publicnode.com', 'https://eth.llamarpc.com']
  },
  polygon: {
    chain: polygon,
    alchemyNetwork: 'polygon-mainnet',
    publicRpcs: ['https://polygon-rpc.com', 'https://polygon-bor.publicnode.com']
  },
  optimism: {
    chain: optimism,
    alchemyNetwork: 'opt-mainnet',
    publicRpcs: ['https://mainnet.optimism.io', 'https://optimism.publicnode.com']
  },
  arbitrum: {
    chain: arbitrum,
    alchemyNetwork: 'arb-mainnet',
    publicRpcs: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one.publicnode.com']
  }
};

const getAlchemyUrl = (network) =>
  ALCHEMY_KEY ? `https://${network}.g.alchemy.com/v2/${ALCHEMY_KEY}` : null;

const toEnvKey = (chain) =>
  chain
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_');

function normalizeProvider(provider) {
  const selected = (provider || DEFAULT_PROVIDER).toLowerCase();
  if (!['alchemy', 'public', 'custom'].includes(selected)) {
    return DEFAULT_PROVIDER;
  }
  return selected;
}

function getCustomRpcUrl(chain) {
  const chainKey = `CUSTOM_RPC_${toEnvKey(chain)}`;
  return process.env[chainKey] || process.env.CUSTOM_RPC_URL || null;
}

export function getChainConfig(chainName) {
  const config = CHAIN_CONFIG[chainName];
  if (!config) {
    throw new Error(
      `Unsupported chain: ${chainName}. Supported: ${Object.keys(CHAIN_CONFIG).join(', ')}`
    );
  }
  return config;
}

export function getSupportedChains() {
  return Object.keys(CHAIN_CONFIG).map((key) => ({
    id: key,
    name: CHAIN_CONFIG[key].chain.name,
    testnet: key.includes('sepolia') || key.includes('mumbai'),
    nativeCurrency: CHAIN_CONFIG[key].chain.nativeCurrency
  }));
}

export function getProviderConfig(chainName, preferredProvider) {
  const provider = normalizeProvider(preferredProvider);
  const chainConfig = getChainConfig(chainName);
  const customRpc = getCustomRpcUrl(chainName);
  const alchemyRpc = getAlchemyUrl(chainConfig.alchemyNetwork);

  if (provider === 'custom') {
    if (!customRpc) {
      throw new Error(
        `Provider "custom" selected but no RPC configured for ${chainName}. Set CUSTOM_RPC_URL or CUSTOM_RPC_${toEnvKey(chainName)}.`
      );
    }

    return {
      provider,
      chainConfig,
      rpcs: [customRpc]
    };
  }

  if (provider === 'alchemy') {
    return {
      provider,
      chainConfig,
      rpcs: [alchemyRpc, ...chainConfig.publicRpcs].filter(Boolean)
    };
  }

  return {
    provider,
    chainConfig,
    rpcs: [...chainConfig.publicRpcs]
  };
}

async function createClientWithFallback({ chainConfig, rpcs }, clientType = 'public', account) {
  for (const rpc of rpcs) {
    try {
      const client =
        clientType === 'public'
          ? createPublicClient({ chain: chainConfig.chain, transport: http(rpc) })
          : createWalletClient({ chain: chainConfig.chain, account, transport: http(rpc) });

      if (clientType === 'public') {
        await client.getBlockNumber();
      }

      return { client, rpc };
    } catch (error) {
      console.log(`RPC ${rpc} failed, trying next...`);
    }
  }

  throw new Error(`All RPCs failed for chain ${chainConfig.chain.name}`);
}

function getExplorerUrl(chainName, txHash) {
  const explorers = {
    'base-sepolia': `https://sepolia.basescan.org/tx/${txHash}`,
    base: `https://basescan.org/tx/${txHash}`,
    ethereum: `https://etherscan.io/tx/${txHash}`,
    'ethereum-sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    'polygon-mumbai': `https://mumbai.polygonscan.com/tx/${txHash}`,
    optimism: `https://optimistic.etherscan.io/tx/${txHash}`,
    'optimism-sepolia': `https://sepolia-optimism.etherscan.io/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    'arbitrum-sepolia': `https://sepolia.arbiscan.io/tx/${txHash}`
  };

  return explorers[chainName];
}

const viemAdapter = {
  id: 'viem-default',

  async getBalance({ address, chain, provider }) {
    const providerConfig = getProviderConfig(chain, provider);
    const { client, rpc } = await createClientWithFallback(providerConfig, 'public');
    const balance = await client.getBalance({ address });

    return {
      chain,
      provider: providerConfig.provider,
      eth: formatEther(balance),
      wei: balance.toString(),
      rpc: rpc.split('/')[2]
    };
  },

  async estimateGas({ from, to, value = '0', data = '0x', chain, provider }) {
    const providerConfig = getProviderConfig(chain, provider);
    const { client } = await createClientWithFallback(providerConfig, 'public');

    const gas = await client.estimateGas({
      account: from,
      to,
      value: parseEther(value),
      data
    });

    const gasPrice = await client.getGasPrice();
    const estimatedCost = gas * gasPrice;

    return {
      chain,
      provider: providerConfig.provider,
      gasUnits: gas.toString(),
      gasPrice: `${formatEther(gasPrice)} ETH`,
      estimatedCost: `${formatEther(estimatedCost)} ETH`,
      estimatedCostWei: estimatedCost.toString()
    };
  },

  async sendTransaction({ from, to, value = '0', data = '0x', chain, provider, account }) {
    const providerConfig = getProviderConfig(chain, provider);
    const { client: walletClient } = await createClientWithFallback(
      providerConfig,
      'wallet',
      account
    );

    const hash = await walletClient.sendTransaction({
      to,
      value: parseEther(value),
      data
    });

    return {
      hash,
      from,
      to,
      value,
      data,
      chain,
      provider: providerConfig.provider,
      explorer: getExplorerUrl(chain, hash)
    };
  },

  async getReceipt({ hash, chain, provider }) {
    const providerConfig = getProviderConfig(chain, provider);
    const { client } = await createClientWithFallback(providerConfig, 'public');

    try {
      const receipt = await client.getTransactionReceipt({ hash });
      return {
        hash: receipt.transactionHash,
        status: receipt.status === 'success' ? 'success' : 'failed',
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to,
        chain,
        provider: providerConfig.provider
      };
    } catch (error) {
      return {
        hash,
        status: 'pending',
        chain,
        provider: providerConfig.provider,
        explorer: getExplorerUrl(chain, hash)
      };
    }
  },

  supportsFeature(feature) {
    return ['getBalance', 'estimateGas', 'sendTransaction', 'getReceipt', 'fallbackRpc'].includes(feature);
  }
};

export default viemAdapter;
