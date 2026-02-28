import { randomBytes, createHmac } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WEBHOOKS_FILE = join(process.cwd(), 'webhooks.json');
const DEAD_LETTER_FILE = join(process.cwd(), 'webhook-dead-letters.json');
const MAX_ATTEMPTS = parseInt(process.env.WEBHOOK_MAX_ATTEMPTS || '5', 10);
const BACKOFF_BASE_MS = parseInt(process.env.WEBHOOK_BACKOFF_BASE_MS || '1000', 10);

function loadJson(path, fallback) {
  if (!existsSync(path)) {
    return fallback;
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

let webhookConfigs = loadJson(WEBHOOKS_FILE, []);
let deadLetters = loadJson(DEAD_LETTER_FILE, []);

function saveWebhooks() {
  saveJson(WEBHOOKS_FILE, webhookConfigs);
}

function saveDeadLetters() {
  saveJson(DEAD_LETTER_FILE, deadLetters);
}

function signPayload(secret, payload) {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export function registerWebhookConfig({ url, signingSecret, eventFilters = [] }) {
  if (!url) {
    throw new Error('Webhook URL is required');
  }

  const existing = webhookConfigs.find((config) => config.url === url);
  const record = {
    id: existing?.id || `wh_${randomBytes(8).toString('hex')}`,
    url,
    signingSecret: signingSecret || randomBytes(16).toString('hex'),
    eventFilters,
    active: true,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    webhookConfigs = webhookConfigs.map((config) => (config.id === existing.id ? record : config));
  } else {
    webhookConfigs.push(record);
  }

  saveWebhooks();
  return record;
}

export function listWebhookConfigs() {
  return webhookConfigs.map((config) => ({
    ...config,
    signingSecret: `${config.signingSecret.slice(0, 6)}...`
  }));
}

export function removeWebhookConfig(id) {
  const before = webhookConfigs.length;
  webhookConfigs = webhookConfigs.filter((config) => config.id !== id);
  saveWebhooks();
  return webhookConfigs.length !== before;
}

export function listDeadLetters(limit = 50) {
  return deadLetters.slice(0, limit);
}

async function deliverWithRetry(config, eventPayload, attempt = 1) {
  const body = JSON.stringify(eventPayload);
  const signature = signPayload(config.signingSecret, body);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': eventPayload.event,
        'X-Webhook-Timestamp': eventPayload.timestamp,
        'X-Webhook-Signature': signature
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Webhook responded ${response.status}`);
    }

    return { success: true, attempts: attempt };
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS) {
      deadLetters.unshift({
        id: `dlq_${randomBytes(8).toString('hex')}`,
        webhookId: config.id,
        url: config.url,
        event: eventPayload.event,
        payload: eventPayload,
        failedAt: new Date().toISOString(),
        attempts: attempt,
        error: error.message
      });
      deadLetters = deadLetters.slice(0, 200);
      saveDeadLetters();
      return { success: false, attempts: attempt, deadLettered: true, error: error.message };
    }

    const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return deliverWithRetry(config, eventPayload, attempt + 1);
  }
}

export async function emitWebhookEvent(event, payload) {
  const matching = webhookConfigs.filter((config) => {
    if (!config.active) return false;
    if (!config.eventFilters?.length) return true;
    return config.eventFilters.includes(event);
  });

  const eventPayload = {
    event,
    timestamp: new Date().toISOString(),
    payload
  };

  const results = await Promise.all(matching.map((config) => deliverWithRetry(config, eventPayload)));

  return {
    event,
    subscribers: matching.length,
    results
  };
}
