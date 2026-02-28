# Agent Wallet Service

**Stripe for AI Agent Wallets**

Add wallet functionality to any AI agent in seconds. No blockchain SDKs, no key management, no contract deployment.

## Status: ✅ Production Ready v0.3.0

- Multi-chain support (9 chains)
- ERC-8004 AI Agent Identity
- API key authentication
- Full CLI + SDK
- Transaction lifecycle tracking + signed webhooks

## Features

### 🔗 Multi-Chain Support

| Testnets | Mainnets |
|----------|----------|
| base-sepolia ✓ | base |
| ethereum-sepolia ✓ | ethereum |
| optimism-sepolia ✓ | polygon |
| arbitrum-sepolia ✓ | optimism |
| | arbitrum |

Each chain has fallback RPCs for reliability.

### 🆔 ERC-8004 Agent Identity

On-chain identity for AI agents:
- Verifiable agent IDs
- Capability tracking
- W3C Verifiable Credentials compatible
- Agent types: `assistant`, `autonomous`, `hybrid`

### 🔐 API Key Authentication

- Generate/revoke API keys
- Role-based permissions (read/write/admin)
- Rate limiting built-in

## Quick Start

```bash
npm install
npm start
```

## CLI Usage

```bash
# Wallet commands
node cli.js create MyBot base-sepolia
node cli.js balance 0x...
node cli.js balances 0x...          # All chains
node cli.js send 0xfrom 0xto 0.001
node cli.js sweep 0xfrom 0xto      # Send all funds
node cli.js estimate 0xfrom 0xto 0.001
node cli.js list
node cli.js chains

# Webhook commands
node cli.js webhook register http://localhost:8787/webhook
node cli.js webhook list
node cli.js webhook test wh_123 confirmed

# Identity commands (ERC-8004)
node cli.js identity create 0xwallet BotName assistant
node cli.js identity list
node cli.js identity get agent:xxx
node cli.js identity wallet 0xaddress

# Demo
node cli.js demo
```

## API Endpoints

### Wallet

```
POST /wallet/create          Create new wallet
POST /wallet/import          Import from private key
GET  /wallet/list            List all wallets
GET  /wallet/chains          Supported chains
GET  /wallet/fees            Fee configuration
GET  /wallet/history              Transaction history
POST /wallet/estimate-gas         Estimate gas cost
GET  /wallet/tx/:hash             Get transaction status
GET  /wallet/webhooks             List tx webhooks (admin)
POST /wallet/webhooks             Register tx webhook (admin)
DELETE /wallet/webhooks/:id       Remove tx webhook (admin)
POST /wallet/webhooks/:id/test    Send test webhook (admin)

GET  /wallet/:address                    Wallet details
GET  /wallet/:address/balance            Balance on wallet's chain
GET  /wallet/:address/balance/all        Balance across all chains
POST /wallet/:address/send               Send transaction
POST /wallet/:address/sweep              Sweep all funds
```

### Identity (ERC-8004)

```
POST /identity/create                    Create agent identity
GET  /identity/list                      List all identities
GET  /identity/types                     Agent types
GET  /identity/capabilities              Supported capabilities
GET  /identity/wallet/:address           Identities by wallet
GET  /identity/:agentId                  Get identity
PATCH /identity/:agentId/capability      Update capability
POST /identity/:agentId/revoke           Revoke identity
GET  /identity/:agentId/credential       W3C Verifiable Credential
```


## Transaction Status Lifecycle

Each outbound transaction is persisted with full lifecycle timestamps:

- `submitted` (immediately after wallet client returns tx hash)
- `pending` (seen on-chain but not yet confirmed)
- `confirmed` (receipt status = success)
- `failed` (receipt status = reverted/failed)

A background poller runs every `TX_POLL_INTERVAL_MS` (default `12000`) and checks pending/submitted hashes by chain.

## Webhooks

Register webhook consumers to receive `tx.status.updated` events.

### Delivery security

Webhooks are signed with `HMAC-SHA256(secret, "timestamp.payload")` and sent in:

- `X-Tx-Webhook-Signature`
- `X-Tx-Webhook-Timestamp`
- `X-Tx-Webhook-Event`
- `X-Tx-Webhook-Id`

Set a global default secret with `WEBHOOK_SECRET` or provide a per-webhook `secret` in `POST /wallet/webhooks`.

### Retry policy

Failed deliveries are retried with exponential backoff:

- default retries: `WEBHOOK_MAX_RETRIES` (default `3`)
- default base delay: `WEBHOOK_BASE_BACKOFF_MS` (default `1000`)
- delay formula: `baseDelay * 2^(attempt-1)` (capped at 30s)

### Local webhook testing

1. Start a local receiver (example using netcat):

```bash
nc -l 8787
```

2. Register webhook in service:

```bash
node cli.js webhook register http://localhost:8787/webhook
```

3. Trigger a signed test delivery:

```bash
node cli.js webhook test <webhookId> confirmed
```

## SDK

```javascript
import AgentWallet from './sdk.js';

const wallet = new AgentWallet();

// Create wallet
const { wallet: w } = await wallet.createWallet('MyBot', 'base-sepolia');

// Check balance
const bal = await wallet.getBalance(w.address);

// Send transaction
const tx = await wallet.send(w.address, '0x...', '0.001');
```

## Architecture

```
src/
├── index.js                    Express server
├── routes/
│   ├── wallet.js               Wallet endpoints
│   └── identity.js             ERC-8004 endpoints
├── services/
│   ├── viem-wallet.js          Core wallet ops
│   ├── agent-identity.js       ERC-8004 identity
│   ├── fee-collector.js        Fee calculations
│   └── tx-history.js           Transaction logging
└── middleware/
    ├── auth.js                 API key auth
    └── rateLimit.js            Rate limiting
```

## Live Transaction

First successful transaction on Base Sepolia:
```
0x7f8feba9bd220fdee58499422135f2cafab818a829d76e72d17273e50d3e3a6c
```

## Coming Soon

- [ ] Public deployment
- [ ] NPM package
- [ ] Web dashboard
- [ ] Multi-signature wallets

## Positioning

> "Add a wallet to any agent in 60 seconds. Your agent can hold funds, pay for services, and earn fees — without touching a single blockchain SDK, managing private keys, or deploying smart contracts."

---

Built by Mr. Claw 🦞
