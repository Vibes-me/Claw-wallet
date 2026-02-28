/**
 * ENS Routes
 * Ethereum Name Service registration for agent wallets
 */

import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest, commonSchemas } from '../middleware/validation.js';
import { AppError } from '../errors.js';
import {
  checkAvailability,
  getPrice,
  prepareRegistration,
  listRegistrations,
  getRegistration
} from '../services/ens.js';

const router = Router();

const ensNameParamsSchema = z.object({ name: z.string().min(3) });

router.get('/check/:name', validateRequest({
  params: ensNameParamsSchema,
  query: z.object({ chain: commonSchemas.chain.optional().default('ethereum') })
}), async (req, res, next) => {
  try {
    const { name } = req.params;
    const { chain } = req.query;

    const result = await checkAvailability(name, chain);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/price/:name', validateRequest({
  params: ensNameParamsSchema,
  query: z.object({
    years: z.coerce.number().int().min(1).optional().default(1),
    chain: commonSchemas.chain.optional().default('ethereum')
  })
}), async (req, res, next) => {
  try {
    const { name } = req.params;
    const { years, chain } = req.query;

    const price = await getPrice(name, years, chain);
    res.json(price);
  } catch (error) {
    next(error);
  }
});

router.post('/register', requireAuth('write'), validateRequest({
  body: z.object({
    name: z.string().min(3),
    ownerAddress: commonSchemas.address,
    years: z.coerce.number().int().min(1).optional().default(1),
    chain: commonSchemas.chain.optional().default('ethereum')
  })
}), async (req, res, next) => {
  try {
    const { name, ownerAddress, years, chain } = req.body;

    const result = await prepareRegistration({
      name,
      ownerAddress,
      durationYears: years,
      chain
    });

    res.json({ success: true, registration: result });
  } catch (error) {
    next(error);
  }
});

router.get('/list', (_req, res) => {
  const registrations = listRegistrations();
  res.json({ count: registrations.length, registrations });
});

router.get('/:name', validateRequest({ params: ensNameParamsSchema }), (req, res, next) => {
  try {
    const { name } = req.params;
    const registration = getRegistration(name);

    if (!registration) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    next(error);
  }
});

export default router;
