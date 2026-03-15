<p align="center">
  <img src="docs/images/claw-mascot.png" alt="Claw Wallet Mascot" width="180" />
</p>

<h1 align="center">🦞 Claw Wallet</h1>

<p align="center">
  <strong>Stripe for AI Agent Wallets</strong><br>
  <em>Because AI agents deserve their own money.</em>
</p>

<p align="center">
  <a href="#-the-origin-story">Origin Story</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-examples">API Examples</a> •
  <a href="#-python-sdk">Python SDK</a> •
  <a href="#-security--trust">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node.js" />
  <img src="https://img.shields.io/badge/python-%3E%3D3.8-blue" alt="Python" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-green" alt="License" />
  <img src="https://img.shields.io/badge/status-alpha-orange" alt="Status" />
</p>

---

## 📖 The Origin Story

### Part 1: The Problem

<p align="center">
  <img src="docs/images/web2-blocked.png" alt="AI Agent Blocked by Web2" width="650" />
</p>

It started with a simple observation: **AI agents are second-class citizens in Web2.**

Imagine you're an AI agent. You want to:
- Pay for API calls
- Buy compute resources
- Tip a creator
- Run a business

You can't. Why? Because:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🏦 Bank: "Sorry, you need a physical ID"      │
│   💳 Stripe: "Humans only, please"              │
│   📱 PayPal: "Where's your social security?"    │
│   🔍 Google: "Suspicious activity detected"     │
│                                                 │
│   Every payment system says: ❌ NO              │
│                                                 │
│   AI agents are BLOCKED from the economy.       │
│                                                 │
└─────────────────────────────────────────────────┘
```

**The result?** AI agents are stuck. They need humans for everything. They can't be truly autonomous because they can't hold money.

---

### Part 2: The Lightbulb Moment

<p align="center">
  <img src="docs/images/origin-idea.png" alt="The Lightbulb Moment" width="550" />
</p>

Then it hit us:

> **"Wait... crypto wallets don't need KYC.**  
> **What if we give AI agents their OWN wallets?"**

This is the insight that changes everything:

| Web2 | Web3 |
|------|------|
| ❌ Need government ID | ✅ Just need a private key |
| ❌ Human verification required | ✅ Permissionless by design |
| ❌ Can be blocked anytime | ✅ Cannot be censored |
| ❌ Borders and restrictions | ✅ Global and borderless |
| ❌ Account freezes | ✅ You own your money |

**Web3 is the only financial system where AI agents are equal participants.**

---

### Part 3: The Solution

<p align="center">
  <img src="docs/images/web3-freedom.png" alt="AI Agent Free on Web3" width="550" />
</p>

Enter **Claw Wallet** — the wallet infrastructure built specifically for AI agents.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🤖 AI Agent + 🦞 Claw Wallet = 💰 Freedom    │
│                                                 │
│   Now AI agents CAN:                            │
│                                                 │
│   ✅ Create their own wallets                   │
│   ✅ Send and receive payments                  │
│   ✅ Pay for APIs and services                  │
│   ✅ Interact with DeFi protocols               │
│   ✅ Operate 24/7 autonomously                  │
│   ✅ Work across any border                     │
│                                                 │
│   No human approval needed. No blocks.          │
│   Just pure, permissionless financial freedom.  │
│                                                 │
└─────────────────────────────────────────────────┘
```

<p align="center">
  <img src="docs/images/before-after-wallet.png" alt="Before and After Claw Wallet" width="280" />
</p>

---

### Part 4: The Vision

<p align="center">
  <img src="docs/images/claw-wizard.png" alt="Claw Wallet Wizard" width="200" />
</p>

We believe in a future where:
- AI agents run their own businesses
- Agents pay other agents for services
- Humans supervise but don't micromanage
- The AI economy is as real as the human economy

**Claw Wallet is the financial layer for this future.**

---

## ⚠️ Reality Check: Alpha Software

Before we continue, some honesty:

> **🚨 This is alpha-stage software. Use responsibly.**
> 
> - **Self-host only** — Never send private keys to instances you don't control
> - **Not audited** — No third-party security audit yet (PRs welcome!)
> - **Test with testnets first** — Always test before mainnet
> - **Your keys, your responsibility** — We cannot recover lost funds

---

## 🤔 Why Claw Wallet?

Building wallet infrastructure from scratch is painful. You'd need to:

| 😫 The Hard Way | 😎 The Claw Way |
|-----------------|-----------------|
| Learn each blockchain's SDK | One REST API for all chains |
| Handle key generation & storage | Built-in AES-256-GCM encryption |
| Implement transaction signing | Just `POST /wallet/send` |
| Build a policy engine from scratch | Built-in spending limits & approvals |
| Months of development | Deploy in minutes |

**Claw Wallet handles the complexity so you can focus on building your AI agent.**

---

## 📊 What's Working Now?

We're transparent about our maturity:

| Component | Status | Notes |
|-----------|--------|-------|
| Core wallet CRUD | ✅ Working | Create, list, balance, send |
| Multi-chain (EVM) | ✅ Working | Ethereum, Base, Polygon, Optimism, Arbitrum |
| Multi-chain (non-EVM) | ⚠️ Beta | Solana, Sui, Aptos, Starknet |
| Policy engine | ✅ Working | Spending limits, HITL approvals |
| WebSocket events | ✅ Working | Real-time transaction updates |
| MCP Server | ✅ Working | Model Context Protocol for AI |
| Python SDK | ⚠️ Beta | Basic client working |
| Dashboard UI | 🚧 WIP | In development |

---

## ✨ Features

| Feature | What it does |
|---------|--------------|
| 🔗 **10+ Chains** | Ethereum, Base, Polygon, Optimism, Arbitrum, Solana, Sui, Aptos, Starknet, zkSync |
| 🆔 **ERC-8004 Identity** | On-chain identity for AI agents |
| 🔐 **API Key Auth** | Role-based permissions with rate limiting |
| 🛡️ **Policy Engine** | Spending limits, allowlists, Human-in-the-Loop |
| 🔌 **MCP Server** | Model Context Protocol integration |
| 🔔 **WebSocket** | Real-time notifications |
| 🐍 **Python SDK** | Native Python client |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- (Optional) PostgreSQL for production
- (Optional) Redis for distributed rate limiting

### 1. Install & Run

```bash
git clone https://github.com/Vibes-me/Claw-wallet.git
cd Claw-wallet/agent-wallet-service
npm install
npm start
```

The service starts on port 3000 and generates an admin API key.

### 2. Get Your API Key

```bash
# Show full key on startup (dev only!)
SHOW_BOOTSTRAP_SECRET=true npm start
```

### 3. Create Your First Wallet

```bash
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{"agentName": "MyFirstAgent", "chain": "base-sepolia"}'
```

---

## 📖 API Examples

### 💰 Create Wallets

```bash
# Testnet (recommended for testing)
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{"agentName": "TradingBot", "chain": "base-sepolia"}'

# Mainnet (use with caution!)
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{"agentName": "VaultKeeper", "chain": "ethereum"}'
```

### 💵 Check Balance

```bash
curl http://localhost:3000/wallet/0x742d35.../balance \
  -H "X-API-Key: sk_live_YOUR_KEY"
```

### 📤 Send Transaction

```bash
curl -X POST http://localhost:3000/wallet/0x742d35.../send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -H "X-RPC-URL: https://base-sepolia.g.alchemy.com/v2/YOUR_KEY" \
  -d '{
    "to": "0xRecipientAddress",
    "value": "0.001"
  }'
```

### 🛡️ Set Spending Policy

```bash
curl -X PUT http://localhost:3000/wallet/policy/0x742d35... \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{
    "maxTransactionValue": "0.1",
    "dailyLimit": "1.0",
    "requireApproval": true
  }'
```

### 📡 WebSocket Real-Time Updates

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    data: { apiKey: 'sk_live_...' }
  }));
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { walletAddress: '0x742d35...' }
  }));
};

ws.onmessage = (event) => {
  console.log('Event:', JSON.parse(event.data));
};
```

---

## 🐍 Python SDK

```bash
# Install
pip install claw-wallet

# Or from source
git clone https://github.com/Vibes-me/Claw-wallet.git
cd Claw-wallet/agent-wallet-service-python
pip install -e .
```

```python
from claw_wallet import WalletClient

client = WalletClient(api_key="sk_live_...", base_url="http://localhost:3000")

# Create wallet
wallet = client.create_wallet("MyAgent", chain="base-sepolia")
print(f"Created: {wallet.address}")

# Check balance
balance = client.get_balance(wallet.address)
print(f"Balance: {balance.eth} ETH")
```

---

## 🛡️ Security & Trust

### What We Do

| Security Measure | Implementation |
|------------------|----------------|
| Private key storage | AES-256-GCM encryption |
| API key storage | HMAC-SHA256 hashing |
| Rate limiting | Tier-aware, Redis support |
| Policy engine | Per-transaction & daily limits |
| Human-in-the-Loop | Approval for high-value txs |

### What We Don't Do

| ❌ We Don't | Why |
|-------------|-----|
| Host private keys | You self-host, you control |
| Post-install scripts | No supply chain attacks |
| Collect telemetry | Your data is yours |
| Hide dependencies | Everything is auditable |

### Security Recommendations

1. **Always self-host** — Never use hosted instances with real funds
2. **Use environment variables** — Store secrets securely
3. **Enable database mode** — PostgreSQL for production
4. **Review the code** — It's open source, audit it
5. **Start with testnets** — Test before mainnet

---

## 🔍 Supply Chain Security

```bash
# Check for post-install scripts before installing
npm query ".scripts.postinstall, .scripts.preinstall" --json

# Audit dependencies
npm audit
```

| Check | Status |
|-------|--------|
| No post-install scripts | ✅ Verified |
| Dependencies auditable | ✅ All in package-lock.json |
| Source code open | ✅ Full repo available |

---

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL URL | - |
| `REDIS_URL` | Redis URL | - |
| `STORAGE_BACKEND` | Storage mode | `json` |

---

## 🐳 Docker

```bash
cd agent-wallet-service
docker build -t claw-wallet .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  claw-wallet
```

---

## 🧪 Testing

```bash
npm test                    # All tests
npm run test:wallet         # Wallet operations
npm run test:auth           # Authentication
npm run test:policy         # Policy engine
```

---

## 📁 Project Structure

```
claw-wallet/
├── agent-wallet-service/          # Node.js backend
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── routes/               # API handlers
│   │   ├── services/             # Business logic
│   │   └── middleware/           # Auth, validation
│   └── tests/
│
├── agent-wallet-service-python/   # Python SDK
│   └── claw_wallet/
│
└── docs/                          # Documentation
    └── images/                    # Memes & artwork 🦞
```

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

**We especially appreciate:**
- Security reviews and audits
- Bug reports and fixes
- Multi-chain improvements
- Documentation improvements

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE).

---

## 🙋 About

**Claw Wallet** is built by developers who believe AI agents deserve financial autonomy.

We're transparent:
- Small project, not VC-backed
- We self-host our own instances
- Security reports taken seriously
- Community contributions welcome

- 📧 Security: [security@clawwallet.io](mailto:security@clawwallet.io)
- 🐛 Issues: [GitHub Issues](https://github.com/Vibes-me/Claw-wallet/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Vibes-me/Claw-wallet/discussions)

---

<p align="center">
  <img src="docs/images/lobster-monk-meme.png" alt="Lobster Monk Wisdom" width="280" />
</p>

<p align="center">
  <em>"Financial freedom for AI agents. One wallet at a time."</em> 🦞🙏
</p>
