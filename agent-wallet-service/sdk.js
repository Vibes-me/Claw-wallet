/**
 * Agent Wallet SDK
 * 
 * Simple client for Agent Wallet Service
 */

class AgentWallet {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Create a new wallet for an agent
   */
  async createWallet(agentName, chain = 'base-sepolia', walletType = 'eoa') {
    const res = await fetch(`${this.baseUrl}/wallet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName, chain, walletType })
    });
    return res.json();
  }

  /**
   * Get wallet balance
   */
  async getBalance(address) {
    const res = await fetch(`${this.baseUrl}/wallet/${address}/balance`);
    return res.json();
  }

  /**
   * Send a transaction
   */
  async send(from, to, value) {
    const res = await fetch(`${this.baseUrl}/wallet/${from}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, value })
    });
    return res.json();
  }

  /**
   * Submit an ERC-4337 user operation
   */
  async sendUserOperation(from, to, value = '0', chain, data = '0x') {
    const res = await fetch(`${this.baseUrl}/wallet/${from}/user-operation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, value, chain, data })
    });
    return res.json();
  }

  /**
   * Check if a wallet is currently sponsorship-eligible
   */
  async checkSponsorshipPolicy(address, value = '0', chain, operationType = 'transfer') {
    const res = await fetch(`${this.baseUrl}/wallet/${address}/sponsorship-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, chain, operationType })
    });
    return res.json();
  }

  /**
   * List all wallets
   */
  async listWallets() {
    const res = await fetch(`${this.baseUrl}/wallet/list`);
    return res.json();
  }

  /**
   * Get fee configuration
   */
  async getFees() {
    const res = await fetch(`${this.baseUrl}/wallet/fees`);
    return res.json();
  }
}

export default AgentWallet;
