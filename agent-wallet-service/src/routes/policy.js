import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPolicy, setPolicy, evaluateTransfer } from '../services/policy-engine.js';

const router = Router();

router.get('/:walletAddress', requireAuth('read'), (req, res) => {
  try {
    const { walletAddress } = req.params;
    const policy = getPolicy({ walletAddress });
    res.json({
      walletAddress,
      policy
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:walletAddress', requireAuth('write'), (req, res) => {
  try {
    const { walletAddress } = req.params;
    const policy = setPolicy({ walletAddress, policy: req.body || {} });
    res.json({
      success: true,
      walletAddress,
      policy
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:walletAddress/test', requireAuth('read'), (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { chain = 'base-sepolia', to, value = '0', token = 'native', timestamp } = req.body || {};

    if (!to) {
      return res.status(400).json({ error: 'recipient address (to) is required' });
    }

    const decision = evaluateTransfer({
      walletAddress,
      chain,
      to,
      value,
      token,
      timestamp
    });

    res.json({
      walletAddress,
      decision
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
