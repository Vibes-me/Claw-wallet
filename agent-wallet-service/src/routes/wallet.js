import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { 
  createWallet, getBalance, signTransaction, 
  getAllWallets, getSupportedChains, getSupportedWalletTypes, importWallet,
  getTransactionReceipt, getMultiChainBalance, getWalletByAddress,
  estimateGas, sweepWallet
} from '../services/viem-wallet.js';
import { getAAProviderConfig, submitUserOperation, checkSponsorshipPolicy } from '../services/aa-provider.js';
import { getFeeConfig } from '../services/fee-collector.js';
import { getHistory, getWalletTransactions } from '../services/tx-history.js';

const router = Router();

// ============================================================
// STATIC ROUTES (must come before /:address routes)
// ============================================================

/**
 * POST /wallet/create
 * Create a new agent wallet
 */
router.post('/create', requireAuth('write'), async (req, res) => {
  try {
    const { agentName, chain = 'base-sepolia', walletType = 'eoa' } = req.body;
    
    if (!agentName) {
      return res.status(400).json({ error: 'agentName is required' });
    }

    const wallet = await createWallet({ agentName, chain, walletType });
    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        walletType: wallet.walletType
      }
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /wallet/import
 * Import an existing wallet from private key
 */
router.post('/import', requireAuth('write'), async (req, res) => {
  try {
    const { privateKey, agentName, chain, walletType = 'eoa' } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'privateKey is required' });
    }

    const wallet = await importWallet({ privateKey, agentName, chain, walletType });
    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    console.error('Wallet import error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /wallet/list
 * List all wallets
 */
router.get('/list', async (req, res) => {
  try {
    const wallets = getAllWallets();
    res.json({ 
      count: wallets.length,
      wallets 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /wallet/chains
 * List all supported chains
 */
router.get('/chains', (req, res) => {
  const chains = getSupportedChains();
  res.json({ 
    default: 'base-sepolia',
    count: chains.length,
    chains 
  });
});


/**
 * GET /wallet/wallet-types
 * List supported wallet types
 */
router.get('/wallet-types', (req, res) => {
  const walletTypes = getSupportedWalletTypes();
  res.json({
    default: 'eoa',
    count: walletTypes.length,
    walletTypes
  });
});

/**
 * GET /wallet/aa/config
 * AA provider feature flag/config status
 */
router.get('/aa/config', (req, res) => {
  res.json(getAAProviderConfig());
});

/**
 * GET /wallet/fees
 * Get fee configuration
 */
router.get('/fees', (req, res) => {
  res.json(getFeeConfig());
});

/**
 * GET /wallet/history
 * Get global transaction history
 */
router.get('/history', (req, res) => {
  const { limit } = req.query;
  const history = getHistory(parseInt(limit) || 50);
  res.json({ 
    count: history.length,
    transactions: history 
  });
});

/**
 * GET /wallet/tx/:hash
 * Get transaction receipt/status
 */
router.get('/tx/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { chain = 'base-sepolia' } = req.query;
    
    const receipt = await getTransactionReceipt(hash, chain);
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /wallet/estimate-gas
 * Estimate gas for a transaction
 */
router.post('/estimate-gas', async (req, res) => {
  try {
    const { from, to, value, data, chain } = req.body;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to addresses are required' });
    }

    const estimate = await estimateGas({ from, to, value, data, chain });
    res.json(estimate);
  } catch (error) {
    console.error('Gas estimation error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /wallet/:address/user-operation
 * Submit an ERC-4337 user operation
 */
router.post('/:address/user-operation', requireAuth('write'), async (req, res) => {
  try {
    const { address } = req.params;
    const { to, value = '0', data = '0x', chain } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'recipient address (to) is required' });
    }

    const wallet = getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: `Wallet not found: ${address}` });
    }

    const userOperation = await submitUserOperation({
      from: address,
      to,
      value,
      data,
      chain: chain || wallet.chain,
      walletType: wallet.walletType || 'eoa'
    });

    res.json({
      success: true,
      userOperation
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /wallet/:address/sponsorship-check
 * Check if a user operation can be sponsored by paymaster policy
 */
router.post('/:address/sponsorship-check', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain, operationType = 'transfer', value = '0' } = req.body;

    const wallet = getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: `Wallet not found: ${address}` });
    }

    const sponsorship = await checkSponsorshipPolicy({
      chain: chain || wallet.chain,
      walletType: wallet.walletType || 'eoa',
      operationType,
      value
    });

    res.json({
      success: true,
      sponsorship
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// DYNAMIC ROUTES (/:address)
// ============================================================

/**
 * GET /wallet/:address
 * Get wallet details
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const wallet = getWalletByAddress(address);
    
    if (!wallet) {
      return res.status(404).json({ error: `Wallet not found: ${address}` });
    }
    
    res.json({
      id: wallet.id,
      agentName: wallet.agentName,
      address: wallet.address,
      chain: wallet.chain,
      walletType: wallet.walletType || 'eoa',
      createdAt: wallet.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /wallet/:address/balance
 * Get wallet balance
 */
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain } = req.query;
    const balance = await getBalance(address, chain);
    res.json({
      address,
      balance
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /wallet/:address/balance/all
 * Get balance across all chains
 */
router.get('/:address/balance/all', async (req, res) => {
  try {
    const { address } = req.params;
    const balances = await getMultiChainBalance(address);
    res.json({
      address,
      balances
    });
  } catch (error) {
    console.error('Multi-chain balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /wallet/:address/history
 * Get transaction history for a wallet
 */
router.get('/:address/history', (req, res) => {
  const { address } = req.params;
  const history = getWalletTransactions(address);
  res.json({ address, transactions: history });
});

/**
 * POST /wallet/:address/send
 * Send a transaction
 */
router.post('/:address/send', requireAuth('write'), async (req, res) => {
  try {
    const { address } = req.params;
    const { to, value = '0', data = '0x', chain } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'recipient address (to) is required' });
    }

    const tx = await signTransaction({ from: address, to, value, data, chain });
    res.json({
      success: true,
      transaction: tx
    });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /wallet/:address/sweep
 * Sweep all funds to another address
 */
router.post('/:address/sweep', requireAuth('write'), async (req, res) => {
  try {
    const { address } = req.params;
    const { to, chain } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'recipient address (to) is required' });
    }

    const result = await sweepWallet({ from: address, to, chain });
    res.json({
      success: true,
      sweep: result
    });
  } catch (error) {
    console.error('Sweep error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
