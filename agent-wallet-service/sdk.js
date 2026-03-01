/**
 * Agent Wallet SDK
 * 
 * Simple client for Agent Wallet Service
 */

class AgentWallet {
  constructor(options = {}) {
    if (typeof options === 'string') {
      options = { baseUrl: options };
    }

    const {
      baseUrl = 'http://localhost:3000',
      apiKey,
      timeoutMs = 10000
    } = options;

    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  async #request(path, { method = 'GET', body, query } = {}) {
    const pathString = String(path);
    const absoluteUrlPattern = /^https?:\/\//i;
    const url = absoluteUrlPattern.test(pathString)
      ? new URL(pathString)
      : (() => {
          const baseUrl = new URL(this.baseUrl);
          const basePath = baseUrl.pathname.replace(/\/+$/, '');
          const requestPath = pathString.replace(/^\/+/, '');
          baseUrl.pathname = `${basePath}/${requestPath}`;
          return baseUrl;
        })();

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
    } catch (error) {
      const requestError = new Error(`Request failed: ${error.message}`);
      requestError.code = error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
      requestError.cause = error;
      throw requestError;
    } finally {
      clearTimeout(timeout);
    }

    const responseText = await res.text();
    let data;

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }
    }

    if (!res.ok) {
      const message = data?.error || data?.message || `Request failed with status ${res.status}`;
      const httpError = new Error(message);
      httpError.code = 'HTTP_ERROR';
      httpError.status = res.status;
      httpError.details = data;
      throw httpError;
    }

    return data;
  }

  /**
   * Create a new wallet for an agent
   */
  async createWallet(agentName, options = {}) {
    const chain = typeof options === 'string' ? options : options?.chain;
    return this.#request('/wallet/create', {
      method: 'POST',
      body: { agentName, chain }
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(address, options = {}) {
    const chain = typeof options === 'string' ? options : options?.chain;
    return this.#request(`/wallet/${address}/balance`, {
      query: { chain }
    });
  }

  /**
   * Send a transaction
   */
  async send(from, to, value, options = {}) {
    const chain = typeof options === 'string' ? options : options?.chain;
    const data = typeof options === 'object' ? options?.data : undefined;
    return this.#request(`/wallet/${from}/send`, {
      method: 'POST',
      body: { to, value, chain, data }
    });
  }

  /**
   * List all wallets
   */
  async listWallets() {
    return this.#request('/wallet/list');
  }

  /**
   * Get fee configuration
   */
  async getFees() {
    return this.#request('/wallet/fees');
  }
}

export default AgentWallet;

// Usage example:
/*
import AgentWallet from './sdk.js';

const wallet = new AgentWallet({
  baseUrl: 'http://localhost:3000',
  apiKey: process.env.AGENT_WALLET_API_KEY
});

// Create wallet
const { wallet: w } = await wallet.createWallet('MyAgent', { chain: 'base-sepolia' });
console.log('Address:', w.address);

// Check balance
const bal = await wallet.getBalance(w.address, { chain: 'base-sepolia' });
console.log('Balance:', bal.balance.eth, 'ETH');

// Send transaction
const tx = await wallet.send(w.address, '0x...', '0.001', { chain: 'base-sepolia' });
console.log('Tx:', tx.transaction.hash);
*/
