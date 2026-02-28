import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  registerWebhookConfig,
  listWebhookConfigs,
  removeWebhookConfig,
  listDeadLetters
} from '../services/webhooks.js';

const router = Router();

router.post('/configs', requireAuth('write'), (req, res) => {
  try {
    const { url, signingSecret, eventFilters = [] } = req.body;
    const config = registerWebhookConfig({ url, signingSecret, eventFilters });
    res.status(201).json({ success: true, webhook: config });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/configs', requireAuth('read'), (req, res) => {
  res.json({ webhooks: listWebhookConfigs() });
});

router.delete('/configs/:id', requireAuth('write'), (req, res) => {
  const removed = removeWebhookConfig(req.params.id);
  res.json({ success: removed });
});

router.get('/dead-letters', requireAuth('admin'), (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  res.json({ deadLetters: listDeadLetters(limit) });
});

export default router;
