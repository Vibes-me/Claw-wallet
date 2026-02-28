import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createMultisigConfig,
  createProposal,
  approveProposal,
  getProposal,
  listProposals,
  canExecuteProposal,
  markProposalExecuted
} from '../services/multisig.js';
import { updateWalletSecurity } from '../services/viem-wallet.js';
import { signTransaction, sweepWallet } from '../services/viem-wallet.js';

const router = Router();

router.post('/config', requireAuth('write'), (req, res) => {
  try {
    const { walletAddress, signers, threshold, scope } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required' });
    }

    const config = createMultisigConfig({ walletAddress, signers, threshold, scope });
    const wallet = updateWalletSecurity({
      address: walletAddress,
      securityMode: 'multisig',
      multisigConfigId: config.id
    });

    res.json({ success: true, config, wallet });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/proposals', requireAuth('write'), (req, res) => {
  try {
    const { walletAddress, action, payload } = req.body;

    if (!walletAddress || !action || !payload) {
      return res.status(400).json({ error: 'walletAddress, action and payload are required' });
    }

    const proposal = createProposal({
      walletAddress,
      action,
      payload,
      requestedBy: req.apiKey?.name || 'unknown'
    });

    if (!proposal) {
      return res.json({
        success: true,
        bypassed: true,
        reason: 'proposal_not_required_by_scope'
      });
    }

    res.json({ success: true, proposal });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/proposals/:id/approve', requireAuth('write'), (req, res) => {
  try {
    const signerId = req.body.signerId || req.apiKey?.name;
    if (!signerId) {
      return res.status(400).json({ error: 'signerId is required' });
    }

    const proposal = approveProposal({
      proposalId: req.params.id,
      signerId
    });

    res.json({
      success: true,
      proposal,
      readyToExecute: canExecuteProposal(proposal)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/proposals/:id/execute', requireAuth('write'), async (req, res) => {
  try {
    const proposal = getProposal(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ error: `Proposal is ${proposal.status}` });
    }

    if (!canExecuteProposal(proposal)) {
      return res.status(400).json({ error: 'Not enough approvals to execute' });
    }

    let executedTx;
    if (proposal.action === 'send') {
      executedTx = await signTransaction({
        from: proposal.walletAddress,
        to: proposal.payload.to,
        value: proposal.payload.value || '0',
        data: proposal.payload.data || '0x',
        chain: proposal.payload.chain
      });
    } else if (proposal.action === 'sweep') {
      executedTx = await sweepWallet({
        from: proposal.walletAddress,
        to: proposal.payload.to,
        chain: proposal.payload.chain
      });
    } else {
      return res.status(400).json({ error: `Unsupported proposal action: ${proposal.action}` });
    }

    const executedProposal = markProposalExecuted(proposal.id, executedTx);
    res.json({ success: true, proposal: executedProposal, transaction: executedTx });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/proposals', requireAuth('read'), (req, res) => {
  res.json({ proposals: listProposals() });
});

router.get('/proposals/:id', requireAuth('read'), (req, res) => {
  const proposal = getProposal(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  res.json({ proposal, readyToExecute: canExecuteProposal(proposal) });
});

export default router;
