<p align="center">
  <img src="docs/images/claw-mascot.png" alt="Claw Wallet Mascot" width="180" />
</p>

<h1 align="center">🦞 Claw Wallet</h1>

<p align="center">
  <strong>Stripe for AI Agent Wallets</strong><br>
  <em>Give your AI agents secure, multi-chain wallets in seconds.</em>
</p>

<p align="center">
  <a href="#-features">Features</a> •
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

## ⚠️ Important: Read Before Using

> **🚨 Security Notice: This is alpha-stage software.**
> 
> - **Self-host only** — Do not send private keys to any hosted instance you don't control
> - **Not audited** — No third-party security audit has been performed yet
> - **Use testnets first** — Always test with testnet funds before mainnet
> - **Your keys, your responsibility** — We cannot recover lost funds

---

## 🤔 Why Claw Wallet?

Building wallet infrastructure for AI agents is hard. You need to:

| Problem | Claw Wallet Solution |
|---------|---------------------|
| 🔐 Manage private keys securely | Encrypted storage with AES-256-GCM |
| 🔗 Support multiple blockchains | 10+ chains: EVM, Solana, Sui, Aptos, Starknet |
| ✍️ Handle transaction signing | Simple REST API, no SDK complexity |
| 🛡️ Implement spending policies | Built-in policy engine with HITL approvals |
| 🏗️ Build from scratch | Deploy in minutes, not months |

---

## 📊 Project Maturity

| Component | Status | Notes |
|-----------|--------|-------|
| Core wallet CRUD | ✅ Working | Create, list, balance, send |
| Multi-chain (EVM) | ✅ Working | Ethereum, Base, Polygon, Optimism, Arbitrum |
| Multi-chain (non-EVM) | ⚠️ Beta | Solana, Sui, Aptos, Starknet - test thoroughly |
| Policy engine | ✅ Working | Spending limits, HITL approvals |
| ERC-8004 Identity | ⚠️ Beta | On-chain identity for agents |
| WebSocket events | ✅ Working | Real-time transaction updates |
| Python SDK | ⚠️ Beta | Basic client working, pip package coming soon |
| LangChain integration | 🚧 WIP | In development |
| Dashboard UI | 🚧 WIP | Basic React UI, full dashboard in progress |
| MCP Server | ✅ Working | Model Context Protocol for AI agents |

**We're transparent about what works. Check the [tests](agent-wallet-service/tests/) to see what's actually verified.**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **Multi-Chain Support** | Ethereum, Base, Polygon, Optimism, Arbitrum, Solana, Sui, Aptos, Starknet, zkSync |
| 🆔 **ERC-8004 Identity** | On-chain identity for AI agents with W3C Verifiable Credentials |
| 🔐 **API Key Authentication** | Role-based permissions with tiered rate limiting |
| 🛡️ **Policy Engine** | Spending limits, recipient allowlists, Human-in-the-Loop approvals |
| 🔌 **MCP Server** | Model Context Protocol integration for AI assistants |
| 📊 **Dashboard UI** | React-based management interface (in progress) |
| 🐍 **Python SDK** | Python client library (coming to PyPI soon) |
| 🔔 **WebSocket** | Real-time transaction notifications |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- (Optional) PostgreSQL for persistent storage
- (Optional) Redis for distributed rate limiting

### 1. Install & Run

```bash
# Clone the repository
git clone https://github.com/Vibes-me/Claw-wallet.git
cd Claw-wallet/agent-wallet-service

# Install dependencies
npm install

# Start the service
npm start
```

The service will:
- Start on **port 3000** (configurable via `PORT`)
- Generate an **admin API key** on first run
- Print the key prefix (e.g., `sk_live_abc123...`)

### 2. Get Your API Key

```bash
# Option A: Show full key on startup (dev only!)
SHOW_BOOTSTRAP_SECRET=true npm start

# Option B: Read from generated file
node -e "console.log(JSON.parse(require('fs').readFileSync('api-keys.json','utf8'))[0].key)"
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

### 🔑 Authentication

All API requests require an API key in the `X-API-Key` header:

```bash
curl http://localhost:3000/wallet/list \
  -H "X-API-Key: sk_live_YOUR_KEY"
```

### 💰 Create Wallets

```bash
# Create wallet on Base Sepolia (testnet) - RECOMMENDED FOR TESTING
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{"agentName": "TradingBot", "chain": "base-sepolia"}'

# Create wallet on Ethereum mainnet - USE WITH CAUTION
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{"agentName": "VaultKeeper", "chain": "ethereum"}'
```

### ⚠️ Import Wallet (Use With Extreme Caution)

> **🚨 WARNING: Only import wallets on machines you fully control.**
> 
> This endpoint requires sending a private key to the server. Only use this:
> - On your own self-hosted instance
> - On machines you have full control over
> - With test wallets first
> 
> **Never send private keys to a hosted/managed service you don't control.**

```bash
# Import an existing wallet - ONLY ON SELF-HOSTED INSTANCES
curl -X POST http://localhost:3000/wallet/import \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_YOUR_KEY" \
  -d '{
    "privateKey": "0x...",
    "chain": "base-sepolia",
    "agentName": "ImportedWallet"
  }'
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
    "allowedRecipients": ["0xAllowed1...", "0xAllowed2..."],
    "requireApproval": true
  }'
```

### 📡 WebSocket Real-Time Updates

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    data: { apiKey: 'sk_live_...' }
  }));
  
  // Subscribe to wallet events
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

### Installation

> **Note: The Python SDK is currently in beta. The PyPI package is coming soon.**
> 
> For now, install directly from the source:

```bash
# Clone and install locally
git clone https://github.com/Vibes-me/Claw-wallet.git
cd Claw-wallet/agent-wallet-service-python
pip install -e .
```

### Basic Usage

```python
from claw_wallet import WalletClient

# Initialize the client
client = WalletClient(
    api_key="sk_live_...",
    base_url="http://localhost:3000"
)

# Create a wallet
wallet = client.create_wallet("MyAgent", chain="base-sepolia")
print(f"Created: {wallet.address}")

# Check balance
balance = client.get_balance(wallet.address)
print(f"Balance: {balance.eth} ETH")
```

---

## 🛡️ Security & Trust

We take security seriously. Here's what you need to know:

### What We Do

| Security Measure | Implementation |
|------------------|----------------|
| Private key storage | AES-256-GCM encryption at rest |
| API key storage | HMAC-SHA256 hashing (in database mode) |
| Rate limiting | Tier-aware, Redis support for distributed |
| RPC access | Whitelisted hosts only (configurable) |
| Policy engine | Per-transaction and daily limits |
| Human-in-the-Loop | Approval for high-value transactions |

### What We Don't Do

| Risk | Our Stance |
|------|------------|
| Hosted private keys | ❌ We don't host - you self-host |
| Post-install scripts | ❌ No npm postinstall scripts in our packages |
| Data collection | ❌ No telemetry, no analytics |
| Hidden dependencies | ✅ All deps are in package.json, auditable |

### Security Recommendations

1. **Always self-host** - Never use a hosted instance with real funds
2. **Use environment variables** - Store secrets securely
3. **Enable database mode** - For production, use PostgreSQL with encrypted storage
4. **Review the code** - It's open source, audit it yourself
5. **Start with testnets** - Always test with fake money first

### Reporting Vulnerabilities

See [SECURITY.md](SECURITY.md) for coordinated vulnerability disclosure.

---

## 🔍 Supply Chain Security

| Check | Status |
|-------|--------|
| No post-install scripts | ✅ Verified |
| Dependencies auditable | ✅ All in package-lock.json |
| Source code open | ✅ Full repo available |
| Reproducible builds | 🚧 Coming soon |

**Before running `npm install` anywhere:**

```bash
# Check for post-install scripts
npm query ".scripts.postinstall, .scripts.preinstall" --json

# Audit dependencies
npm audit

# Review what you're installing
cat package.json
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL URL | - |
| `REDIS_URL` | Redis URL | - |
| `ALCHEMY_API_KEY` | Alchemy API key | - |
| `API_KEY_HASH_SECRET` | Key hashing secret | (random in dev) |
| `STORAGE_BACKEND` | Storage mode (`json`/`db`) | `json` |
| `ENABLE_MCP` | Enable MCP server | `true` |

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL (`DATABASE_URL` set, `STORAGE_BACKEND=db`)
- [ ] Set strong `API_KEY_HASH_SECRET`
- [ ] Configure Redis for distributed rate limiting
- [ ] Set up HTTPS/TLS
- [ ] Enable firewall rules
- [ ] Regular backups of encrypted data

---

## 🐳 Docker Deployment

```bash
# Build the image
cd agent-wallet-service
docker build -t claw-wallet .

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e API_KEY_HASH_SECRET=your-secret \
  claw-wallet
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:wallet      # Wallet operations
npm run test:auth        # Authentication
npm run test:policy      # Policy engine
```

---

## 📁 Project Structure

```
claw-wallet/
├── agent-wallet-service/          # Main Node.js backend
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── routes/               # API handlers
│   │   ├── services/             # Business logic
│   │   └── middleware/           # Auth, validation
│   ├── tests/                    # Test suites
│   └── Dockerfile
│
├── agent-wallet-service-python/   # Python SDK
│   └── claw_wallet/
│
├── agent-wallet-service-dashboard/ # React Dashboard
│
└── docs/                          # Documentation
```

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

**We especially appreciate:**
- Security reviews and audits
- Bug reports and fixes
- Documentation improvements
- Test coverage increases

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE).

---

## 🙋 About

**Claw Wallet** is built by a small team of developers passionate about AI agents and blockchain. We believe AI agents need safe, programmatic access to wallets without the complexity of managing blockchain SDKs.

- 📧 Email: [security@clawwallet.io](mailto:security@clawwallet.io)
- 🐛 Issues: [GitHub Issues](https://github.com/Vibes-me/Claw-wallet/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Vibes-me/Claw-wallet/discussions)

**We're transparent:**
- This is a small project, not a VC-backed company
- We self-host our own instances
- We welcome community contributions and audits
- Security reports are taken seriously

---

<p align="center">
  <img src="docs/images/lobster-monk-meme.png" alt="Lobster Monk Wisdom" width="300" />
</p>

<p align="center">
  <em>"Simplify your agent wallets. Namaste."</em> 🦞🙏
</p>
