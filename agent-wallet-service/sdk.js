/**
 * Agent Wallet SDK
 *
 * Simple client for Agent Wallet Service with API key support.
 */

class AgentWallet {
  constructor(options = {}) {
    if (typeof options === 'string') {
      this.baseUrl = options;
      this.apiKey = null;
      this.timeoutMs = 10000;
      return;
    }

    const {
      baseUrl = 'http://localhost:3000',
      apiKey = null,
      timeoutMs = 10000
    } = options;

    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async request(path, { method = 'GET', body, headers = {}, apiKey } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const resolvedApiKey = apiKey ?? this.apiKey;
    const requestHeaders = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(resolvedApiKey ? { 'X-API-Key': resolvedApiKey } : {}),
      ...headers
    };

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      const text = await response.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { raw: text };
        }
      }

      if (!response.ok) {
        const message = payload?.error?.message || payload?.error || payload?.message || `HTTP ${response.status}`;
        return {
          success: false,
          status: response.status,
          error: message,
          details: payload
        };
      }

      return payload;
    } catch (error) {
      const isAbort = error?.name === 'AbortError';
      return {
        success: false,
        status: 0,
        error: isAbort ? `Request timeout after ${this.timeoutMs}ms` : error.message
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async createWallet(agentName, chain = 'base-sepolia', options = {}) {
    return this.request('/wallet/create', {
      method: 'POST',
      body: { agentName, chain },
      ...options
    });
  }

  async getBalance(address, chain, options = {}) {
    const chainQuery = chain ? `?chain=${encodeURIComponent(chain)}` : '';
    return this.request(`/wallet/${address}/balance${chainQuery}`, options);
  }

  async preflight(from, to, value, chain, options = {}) {
    return this.request(`/wallet/${from}/preflight`, {
      method: 'POST',
      body: { to, value, chain },
      ...options
    });
  }

  async send(from, to, value, chain, options = {}) {
    return this.request(`/wallet/${from}/send`, {
      method: 'POST',
      body: { to, value, chain },
      ...options
    });
  }

  async listWallets(options = {}) {
    return this.request('/wallet/list', options);
  }

  async getFees(options = {}) {
    return this.request('/wallet/fees', options);
  }

  async getOnboarding(options = {}) {
    return this.request('/onboarding', options);
  }
}

export default AgentWallet;
