import { createHmac } from 'crypto';

const DEFAULT_NON_PROD_HASH_SECRET = 'claw_wallet_dev_hash_secret_v1';
let warnedAboutFallbackSecret = false;

export function getApiKeyHashSecret() {
  const configuredSecret = process.env.API_KEY_HASH_SECRET;
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: API_KEY_HASH_SECRET is required in production.');
  }

  if (!warnedAboutFallbackSecret) {
    warnedAboutFallbackSecret = true;
    console.warn('⚠️  API_KEY_HASH_SECRET is not set; using deterministic non-production fallback secret.');
  }

  return DEFAULT_NON_PROD_HASH_SECRET;
}

export function hashApiKey(rawKey) {
  return createHmac('sha256', getApiKeyHashSecret()).update(String(rawKey)).digest('hex');
}
