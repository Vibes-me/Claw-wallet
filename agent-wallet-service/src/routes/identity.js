import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest, commonSchemas } from '../middleware/validation.js';
import { AppError } from '../errors.js';
import {
  createAgentIdentity,
  getIdentity,
  getIdentitiesByWallet,
  listIdentities,
  updateCapability,
  revokeIdentity,
  exportVerifiableCredential,
  getSupportedCapabilities,
  getAgentTypes
} from '../services/agent-identity.js';

const router = Router();

const agentIdParamsSchema = z.object({
  agentId: z.string().startsWith('agent:')
});

const createIdentitySchema = z.object({
  walletAddress: commonSchemas.address,
  agentName: z.string().min(1),
  description: z.string().optional(),
  agentType: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  owner: commonSchemas.address.optional(),
  chain: commonSchemas.chain.optional()
});

router.get('/capabilities', (_req, res) => {
  res.json({ capabilities: getSupportedCapabilities() });
});

router.get('/types', (_req, res) => {
  res.json({ types: getAgentTypes() });
});

router.post('/create', requireAuth('write'), validateRequest({ body: createIdentitySchema }), async (req, res, next) => {
  try {
    const identity = await createAgentIdentity(req.body);
    res.json({ success: true, identity });
  } catch (error) {
    next(error);
  }
});

router.get('/list', (_req, res) => {
  const identities = listIdentities();
  res.json({ count: identities.length, identities });
});

router.get('/wallet/:address', validateRequest({
  params: z.object({ address: commonSchemas.address })
}), (req, res) => {
  const { address } = req.params;
  const identities = getIdentitiesByWallet(address);
  res.json({ wallet: address, count: identities.length, identities });
});

router.get('/:agentId', validateRequest({ params: agentIdParamsSchema }), (req, res, next) => {
  try {
    const { agentId } = req.params;
    const identity = getIdentity(agentId);

    if (!identity) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'Identity not found' });
    }

    res.json(identity);
  } catch (error) {
    next(error);
  }
});

router.patch('/:agentId/capability', requireAuth('write'), validateRequest({
  params: agentIdParamsSchema,
  body: z.object({
    capability: z.string().min(1),
    granted: z.boolean().optional()
  })
}), (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { capability, granted } = req.body;

    const identity = updateCapability(agentId, capability, granted ?? true);
    res.json({ success: true, identity });
  } catch (error) {
    next(error);
  }
});

router.post('/:agentId/revoke', requireAuth('write'), validateRequest({ params: agentIdParamsSchema }), (req, res, next) => {
  try {
    const { agentId } = req.params;
    const revoked = revokeIdentity(agentId);

    if (!revoked) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'Identity not found' });
    }

    res.json({ success: true, message: 'Identity revoked' });
  } catch (error) {
    next(error);
  }
});

router.get('/:agentId/credential', validateRequest({ params: agentIdParamsSchema }), (req, res, next) => {
  try {
    const { agentId } = req.params;
    const credential = exportVerifiableCredential(agentId);
    res.json(credential);
  } catch (error) {
    next(error);
  }
});

export default router;
