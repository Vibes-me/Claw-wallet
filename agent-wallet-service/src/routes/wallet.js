import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createWallet, getBalance, signTransaction,
  getAllWallets, getSupportedChains, importWallet,
  getTransactionReceipt, getMultiChainBalance,
  estimateGas, sweepWallet, getWalletByAddress
} from '../services/viem-wallet.js';
import { getFeeConfig } from '../services/fee-collector.js';
import { getHistory, getWalletTransactions } from '../services/tx-history.js';
import { createProposal } from '../services/multisig.js';

const router = Router();

router.post('/create', requireAuth('write'), async (req, res) => {
  try {
    const { agentName, chain = 'base-sepolia' } = req.body;

    if (!agentName) {
      return res.status(400).json({ error: 'agentName is required' });
    }

    const wallet = await createWallet({ agentName, chain });
    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain
      }
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/import', requireAuth('write'), async (req, res) => {
  try {
    const { privateKey, agentName, chain } = req.body;

    if (!privateKey) {
      return res.status(400).json({ error: 'privateKey is required' });
    }

    const wallet = await importWallet({ privateKey, agentName, chain });
    res.json({ success: true, wallet });
  } catch (error) {
    console.error('Wallet import error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/list', async (req, res) => {
  try {
    const wallets = getAllWallets();
    res.json({ count: wallets.length, wallets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/chains', (req, res) => {
  const chains = getSupportedChains();
  res.json({ default: 'base-sepolia', count: chains.length, chains });
});

router.get('/fees', (req, res) => {
  res.json(getFeeConfig());
});

router.get('/history', (req, res) => {
  const { limit } = req.query;
  const history = getHistory(parseInt(limit) || 50);
  res.json({ count: history.length, transactions: history });
});

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
      securityMode: wallet.securityMode || 'standard',
      multisigConfigId: wallet.multisigConfigId || null,
      createdAt: wallet.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const { chain } = req.query;
    const balance = await getBalance(address, chain);
    res.json({ address, balance });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:address/balance/all', async (req, res) => {
  try {
    const { address } = req.params;
    const balances = await getMultiChainBalance(address);
    res.json({ address, balances });
  } catch (error) {
    console.error('Multi-chain balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:address/history', (req, res) => {
  const { address } = req.params;
  const history = getWalletTransactions(address);
  res.json({ address, transactions: history });
});

router.post('/:address/send', requireAuth('write'), async (req, res) => {
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

    if (wallet.securityMode === 'multisig' && wallet.multisigConfigId) {
      const proposal = createProposal({
        walletAddress: address,
        action: 'send',
        payload: { to, value, data, chain: chain || wallet.chain },
        requestedBy: req.apiKey?.name || 'unknown'
      });

      if (proposal) {
        return res.status(202).json({
          success: true,
          proposalCreated: true,
          txProposalId: proposal.id,
          proposal
        });
      }
    }

    const tx = await signTransaction({ from: address, to, value, data, chain });
    res.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:address/sweep', requireAuth('write'), async (req, res) => {
  try {
    const { address } = req.params;
    const { to, chain } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'recipient address (to) is required' });
    }

    const wallet = getWalletByAddress(address);
    if (!wallet) {
      return res.status(404).json({ error: `Wallet not found: ${address}` });
    }

    if (wallet.securityMode === 'multisig' && wallet.multisigConfigId) {
      const proposal = createProposal({
        walletAddress: address,
        action: 'sweep',
        payload: { to, value: '0', chain: chain || wallet.chain },
        requestedBy: req.apiKey?.name || 'unknown'
      });

      if (proposal) {
        return res.status(202).json({
          success: true,
          proposalCreated: true,
          txProposalId: proposal.id,
          proposal
        });
      }
    }

    const result = await sweepWallet({ from: address, to, chain });
    res.json({ success: true, sweep: result });
  } catch (error) {
    console.error('Sweep error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
