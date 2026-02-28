const WEBHOOK_TIMEOUT_MS = 5000;

function getWebhookTargets() {
  const urls = process.env.WEBHOOK_URLS || process.env.WEBHOOK_URL || '';
  return urls
    .split(',')
    .map(url => url.trim())
    .filter(Boolean);
}

export async function emitWebhook(eventType, payload) {
  const targets = getWebhookTargets();
  if (!targets.length) {
    return [];
  }

  const body = JSON.stringify({
    eventType,
    timestamp: new Date().toISOString(),
    payload
  });

  const deliveries = await Promise.allSettled(
    targets.map(async (url) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Webhook delivery failed (${response.status}) for ${url}`);
        }

        return { url, statusCode: response.status };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  return deliveries;
}
