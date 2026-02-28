/**
 * Agent Wallet SDK
 *
 * Simple client for Agent Wallet Service
 */

class AgentWallet {
  constructor(baseUrl = 'http://localhost:3000', apiKey = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    });

    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.error || `Request failed (${res.status})`);
    }
    return payload;
  }

  /**
   * Create a new wallet for an agent
   */
  async createWallet(agentName, chain = 'base-sepolia') {
    return this.request('/wallet/create', {
      method: 'POST',
      body: JSON.stringify({ agentName, chain })
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(address) {
    return this.request(`/wallet/${address}/balance`, { method: 'GET' });
  }

  /**
   * Send a transaction
   */
  async send(from, to, value, options = {}) {
    return this.request(`/wallet/${from}/send`, {
      method: 'POST',
      body: JSON.stringify({ to, value, ...options })
    });
  }

  /**
   * List all wallets
   */
  async listWallets() {
    return this.request('/wallet/list', { method: 'GET' });
  }

  /**
   * Get fee configuration
   */
  async getFees() {
    return this.request('/wallet/fees', { method: 'GET' });
  }

  /**
   * Register webhook endpoint
   */
  async registerWebhook(url, signingSecret, eventFilters = []) {
    return this.request('/webhooks/configs', {
      method: 'POST',
      body: JSON.stringify({ url, signingSecret, eventFilters })
    });
  }

  /**
   * Retrieve one approval by id
   */
  async getApproval(id) {
    return this.request(`/approvals/${id}`, { method: 'GET' });
  }

  /**
   * Approve a pending transfer
   */
  async approveTransfer(id) {
    return this.request(`/approvals/${id}/approve`, { method: 'POST' });
  }

  /**
   * Reject a pending transfer
   */
  async rejectTransfer(id) {
    return this.request(`/approvals/${id}/reject`, { method: 'POST' });
  }

  /**
   * Poll approval until terminal status (approved/rejected/expired) or timeout
   */
  async pollApproval(id, { intervalMs = 2000, timeoutMs = 60000 } = {}) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const approval = await this.getApproval(id);
      if (['approved', 'rejected', 'expired'].includes(approval.status)) {
        return approval;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Polling timed out for approval ${id}`);
  }
}

export default AgentWallet;
