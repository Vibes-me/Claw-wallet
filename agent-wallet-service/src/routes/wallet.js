import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest, commonSchemas } from '../middleware/validation.js';
import { AppError } from '../errors.js';
import {
  createWallet, getBalance, signTransaction,
  getAllWallets, getSupportedChains, importWallet,
  getTransactionReceipt, getMultiChainBalance,
  estimateGas, sweepWallet, getWalletByAddress
} from '../services/viem-wallet.js';
import { getFeeConfig } from '../services/fee-collector.js';
import { getHistory, getWalletTransactions } from '../services/tx-history.js';

const router = Router();

const createWalletSchema = z.object({
  agentName: z.string().min(1),
  chain: commonSchemas.chain.optional().default('base-sepolia')
});

const importWalletSchema = z.object({
  privateKey: z.string().min(1),
  agentName: z.string().min(1).optional(),
  chain: commonSchemas.chain.optional()
});

const walletAddressParamsSchema = z.object({
  address: commonSchemas.address
});

const sendBodySchema = z.object({
  to: commonSchemas.address,
  value: z.string().optional().default('0'),
  data: z.string().optional().default('0x'),
  chain: commonSchemas.chain.optional()
});

const sweepBodySchema = z.object({
  to: commonSchemas.address,
  chain: commonSchemas.chain.optional()
});

const txParamsSchema = z.object({
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Must be a valid transaction hash')
});

const txQuerySchema = z.object({
  chain: commonSchemas.chain.optional().default('base-sepolia')
});

router.post('/create', requireAuth('write'), validateRequest({ body: createWalletSchema }), async (req, res, next) => {
  try {
    const { agentName, chain } = req.body;
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
    next(error);
  }
});

router.post('/import', requireAuth('write'), validateRequest({ body: importWalletSchema }), async (req, res, next) => {
  try {
    const { privateKey, agentName, chain } = req.body;
    const wallet = await importWallet({ privateKey, agentName, chain });
    if (!wallet.imported && wallet.message?.toLowerCase().includes('already exists')) {
      throw new AppError({ status: 409, code: 'CONFLICT', message: wallet.message });
    }

    res.json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
});

router.get('/list', async (_req, res, next) => {
  try {
    const wallets = getAllWallets();
    res.json({ count: wallets.length, wallets });
  } catch (error) {
    next(error);
  }
});

router.get('/chains', (_req, res) => {
  const chains = getSupportedChains();
  res.json({ default: 'base-sepolia', count: chains.length, chains });
});

router.get('/fees', (_req, res) => {
  res.json(getFeeConfig());
});

router.get('/history', (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10) || 50;
  const history = getHistory(limit);
  res.json({ count: history.length, transactions: history });
});

router.get('/tx/:hash', validateRequest({ params: txParamsSchema, query: txQuerySchema }), async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { chain } = req.query;

    const receipt = await getTransactionReceipt(hash, chain);
    res.json(receipt);
  } catch (error) {
    next(error);
  }
});

router.post('/estimate-gas', validateRequest({
  body: z.object({
    from: commonSchemas.address,
    to: commonSchemas.address,
    value: z.string().optional(),
    data: z.string().optional(),
    chain: commonSchemas.chain.optional()
  })
}), async (req, res, next) => {
  try {
    const estimate = await estimateGas(req.body);
    res.json(estimate);
  } catch (error) {
    next(error);
  }
});

router.get('/:address', validateRequest({ params: walletAddressParamsSchema }), async (req, res, next) => {
  try {
    const { address } = req.params;
    const wallet = getWalletByAddress(address);

    if (!wallet) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: `Wallet not found: ${address}` });
    }

    res.json({
      id: wallet.id,
      agentName: wallet.agentName,
      address: wallet.address,
      chain: wallet.chain,
      createdAt: wallet.createdAt
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:address/balance', validateRequest({
  params: walletAddressParamsSchema,
  query: z.object({ chain: commonSchemas.chain.optional() })
}), async (req, res, next) => {
  try {
    const { address } = req.params;
    const { chain } = req.query;
    const balance = await getBalance(address, chain);
    res.json({ address, balance });
  } catch (error) {
    next(error);
  }
});

router.get('/:address/balance/all', validateRequest({ params: walletAddressParamsSchema }), async (req, res, next) => {
  try {
    const { address } = req.params;
    const balances = await getMultiChainBalance(address);
    res.json({ address, balances });
  } catch (error) {
    next(error);
  }
});

router.get('/:address/history', validateRequest({ params: walletAddressParamsSchema }), (req, res) => {
  const { address } = req.params;
  const history = getWalletTransactions(address);
  res.json({ address, transactions: history });
});

router.post('/:address/send', requireAuth('write'), validateRequest({
  params: walletAddressParamsSchema,
  body: sendBodySchema
}), async (req, res, next) => {
  try {
    const { address } = req.params;
    const { to, value, data, chain } = req.body;

    const tx = await signTransaction({ from: address, to, value, data, chain });
    res.json({ success: true, transaction: tx });
  } catch (error) {
    next(error);
  }
});

router.post('/:address/sweep', requireAuth('write'), validateRequest({
  params: walletAddressParamsSchema,
  body: sweepBodySchema
}), async (req, res, next) => {
  try {
    const { address } = req.params;
    const { to, chain } = req.body;

    const result = await sweepWallet({ from: address, to, chain });
    res.json({ success: true, sweep: result });
  } catch (error) {
    next(error);
  }
});

export default router;
