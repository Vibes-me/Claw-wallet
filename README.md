# 🦞 Claw Wallet

**Stripe for AI Agent Wallets** — Add wallet functionality to any AI agent in seconds.

Claw Wallet is a multi-chain wallet service designed specifically for AI agents. It provides a simple HTTP API and SDKs for creating wallets, managing identities, executing transactions, and enforcing spending policies — all without touching blockchain SDKs or managing private keys.

## ✨ Features

- 🔗 **Multi-Chain Support** — Ethereum, Base, Polygon, Optimism, Arbitrum, Solana, Sui, Aptos, Starknet, zkSync
- 🆔 **ERC-8004 Agent Identity** — On-chain identity for AI agents with W3C Verifiable Credentials
- 🔐 **API Key Authentication** — Role-based permissions with tiered rate limiting
- 🛡️ **Policy Engine** — Spending limits, recipient allowlists, and Human-in-the-Loop approvals
- 🔌 **MCP Server** — Model Context Protocol integration for AI assistants
- 📊 **Dashboard UI** — React-based management interface
- 🐍 **Python SDK** — Full-featured Python client

## 📁 Project Structure

```
claw-wallet/
├── agent-wallet-service/          # Main Node.js backend service
│   ├── src/
│   │   ├── index.js              # Express server entry point
│   │   ├── routes/               # API route handlers
│   │   │   ├── wallet.js         # Wallet CRUD & transactions
│   │   │   ├── identity.js       # ERC-8004 identity management
│   │   │   ├── ens.js            # ENS registration & resolution
│   │   │   ├── multisig.js       # Multi-signature wallets
│   │   │   ├── defi.js           # DeFi integrations
│   │   │   ├── webhooks.js       # Webhook management
│   │   │   ├── chains.js         # Chain-specific operations
│   │   │   ├── agents.js         # Agent economy
│   │   │   ├── explorer.js       # Transaction explorer
│   │   │   └── social.js         # Social identity links
│   │   ├── services/             # Business logic
│   │   │   ├── viem-wallet.js    # Core wallet operations
│   │   │   ├── agent-identity.js # ERC-8004 implementation
│   │   │   ├── policy-engine.js  # Spending policies
│   │   │   ├── chain-manager.js  # Multi-chain coordination
│   │   │   └── ...
│   │   ├── middleware/           # Express middleware
│   │   │   ├── auth.js           # API key auth & rate limiting
│   │   │   ├── validation.js     # Zod schema validation
│   │   │   └── rpc-access.js     # BYO RPC handling
│   │   └── repositories/         # Data access layer
│   ├── tests/                    # Test suites
│   ├── migrations/               # Database migrations
│   ├── Dockerfile                # Docker configuration
│   └── docker-compose.yml        # Local development setup
│
├── agent-wallet-service-python/   # Python SDK
│   └── claw_wallet/
│       ├── client.py             # Main API client
│       ├── models.py             # Data models
│       ├── exceptions.py         # Custom exceptions
│       └── langchain/            # LangChain integration
│
├── agent-wallet-service-dashboard/ # React Dashboard UI
│   └── src/
│       ├── App.jsx               # Main dashboard component
│       └── styles.css            # Styling
│
└── agent-wallet-service-src/      # Alternative source layout
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or bun
- (Optional) PostgreSQL for persistent storage
- (Optional) Redis for distributed rate limiting

### 1. Install Dependencies

```bash
cd agent-wallet-service
npm install
```

### 2. Start the Service

```bash
npm start
```

The service will:
- Start on port 3000 (configurable via `PORT`)
- Generate an admin API key on first run
- Print the key prefix (e.g., `sk_live_abc123...`)
- Enable WebSocket server at `/ws`

### 3. Get Your API Key

```bash
# Option A: Read from the generated file
node -e "console.log(JSON.parse(require('fs').readFileSync('api-keys.json','utf8'))[0].key)"

# Option B: Set SHOW_BOOTSTRAP_SECRET=true to print full key
SHOW_BOOTSTRAP_SECRET=true npm start
```

### 4. Create Your First Wallet

```bash
curl -X POST http://localhost:3000/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"agentName":"MyFirstAgent","chain":"base-sepolia"}'
```

## 🔌 WebSocket Real-Time Updates

Claw Wallet supports WebSocket connections for real-time notifications.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Authenticate with API key
  ws.send(JSON.stringify({
    type: 'auth',
    data: { apiKey: 'sk_live_...' }
  }));
  
  // Subscribe to wallet updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { walletAddress: '0x...' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Event:', message.type, message.data);
};
```

### Event Types

| Event | Description |
|-------|-------------|
| `tx:pending` | Transaction submitted to network |
| `tx:confirmed` | Transaction confirmed on chain |
| `tx:failed` | Transaction failed |
| `wallet:created` | New wallet created |
| `wallet:imported` | Wallet imported |
| `wallet:balance_updated` | Balance changed |
| `approval:required` | HITL approval needed |
| `approval:approved` | Transaction approved |
| `approval:rejected` | Transaction rejected |

### Example Event

```json
{
  "type": "tx:pending",
  "data": {
    "hash": "0x...",
    "walletAddress": "0x...",
    "to": "0x...",
    "value": "0.001",
    "chain": "base-sepolia",
    "status": "pending",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### WebSocket Stats

```bash
curl http://localhost:3000/ws
```

Returns connection stats and available events.

## 🔌 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health & supported chains |
| `GET` | `/onboarding` | Setup instructions |
| `POST` | `/api-keys` | Create new API key (admin) |
| `GET` | `/api-keys` | List API keys (admin) |
| `DELETE` | `/api-keys/:prefix` | Revoke API key (admin) |

### Wallet Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/wallet/create` | Create new wallet |
| `POST` | `/wallet/import` | Import from private key |
| `GET` | `/wallet/list` | List all wallets |
| `GET` | `/wallet/:address` | Get wallet details |
| `GET` | `/wallet/:address/balance` | Get balance |
| `POST` | `/wallet/:address/send` | Send transaction |
| `POST` | `/wallet/:address/sweep` | Sweep all funds |
| `GET` | `/wallet/chains` | List supported chains |

### Identity (ERC-8004)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/identity/create` | Create agent identity |
| `GET` | `/identity/list` | List all identities |
| `GET` | `/identity/:agentId` | Get identity details |
| `GET` | `/identity/:agentId/credential` | W3C Verifiable Credential |

### Policy Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wallet/policy/:address` | Get wallet policy |
| `PUT` | `/wallet/policy/:address` | Set policy |
| `POST` | `/wallet/policy/:address/evaluate` | Test policy |

## 🐍 Python SDK

```python
from claw_wallet import WalletClient

# Initialize client
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

# Send transaction
tx = client.send_transaction(
    from_address=wallet.address,
    to_address="0x...",
    value_eth="0.001"
)
print(f"TX: {tx.hash}")
```

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
| `AUTH_BACKEND` | Auth storage mode | `json` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX_POINTS_FREE` | Free tier limit | `100` |
| `RATE_LIMIT_MAX_POINTS_PRO` | Pro tier limit | `300` |
| `RATE_LIMIT_MAX_POINTS_ENTERPRISE` | Enterprise limit | `1000` |
| `ENABLE_MCP` | Enable MCP server | `true` |

### Tiers & Rate Limits

| Tier | Points/Min | RPC Mode |
|------|------------|----------|
| `tier:free` | 100 | BYO RPC required |
| `tier:pro` | 300 | Managed RPC |
| `tier:enterprise` | 1000 | Managed RPC |

## 🐳 Docker Deployment

```bash
# Build
cd agent-wallet-service
docker build -t claw-wallet .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e API_KEY_HASH_SECRET=your-secret \
  claw-wallet

# Or with docker-compose
docker-compose up -d
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:wallet
npm run test:auth
npm run test:policy
npm run test:hitl
```

## 🛡️ Security Considerations

For coordinated vulnerability disclosure, see [SECURITY.md](SECURITY.md).


1. **Private Keys** — Encrypted at rest using AES-256-GCM
2. **API Keys** — Hashed using HMAC-SHA256 in database mode
3. **Rate Limiting** — Tier-aware with Redis support for distributed deployments
4. **BYO RPC** — Whitelisted hosts only (configurable via `BYO_RPC_ALLOWED_HOSTS`)
5. **Policy Engine** — Per-transaction and daily spending limits
6. **HITL** — Human-in-the-Loop approval for high-value transactions

## 📚 Documentation

- [Backend README](./agent-wallet-service/README.md) — Detailed API documentation
- [Code Review](./CODE_REVIEW.md) — Known issues and fixes
- [Improvements](./IMPROVEMENTS.md) — Planned enhancements
- [Self-Hosted Guide](./agent-wallet-service/SELF_HOSTED.md) — Deployment guide

## 🧭 Open Source vs Paid (Open-Core Boundary)

Claw Wallet uses a practical open-core model.

### Open Source (this repo)
- Core SDK/client functionality (JavaScript + Python)
- Core wallet service APIs and policy baseline
- Basic self-host deployment artifacts (Docker + local deployment docs)

### Paid / Commercial
- Managed cloud control plane
- Enterprise policy and compliance modules
- SLA-backed operations, advanced analytics, and hosted governance tooling

For full boundary details, see [OPEN_CORE_STRATEGY.md](OPEN_CORE_STRATEGY.md) and [GOVERNANCE.md](GOVERNANCE.md).

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

## 🦞 Built by Mr. Claw

*Give your AI agents the power of secure, multi-chain wallets in seconds.*
