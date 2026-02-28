import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getApprovalRequest, listApprovals, setApprovalDecision, setApprovalExecution } from '../services/approvals.js';
import { signTransaction } from '../services/viem-wallet.js';

const router = Router();

router.get('/', requireAuth('read'), (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  res.json({ approvals: listApprovals(limit) });
});

router.get('/:id', requireAuth('read'), (req, res) => {
  const record = getApprovalRequest(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Approval request not found' });
  }
  return res.json(record);
});

router.post('/:id/approve', requireAuth('write'), async (req, res) => {
  try {
    const approved = setApprovalDecision(req.params.id, 'approved', req.apiKey?.name);

    const tx = await signTransaction(approved.transfer);
    const updated = setApprovalExecution(req.params.id, {
      status: 'submitted',
      transaction: tx
    });

    return res.json({ success: true, approval: updated, transaction: tx });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('expired') || error.message.includes('already')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reject', requireAuth('write'), (req, res) => {
  try {
    const rejected = setApprovalDecision(req.params.id, 'rejected', req.apiKey?.name);
    res.json({ success: true, approval: rejected });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('expired') || error.message.includes('already')) {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message });
  }
});

export default router;
