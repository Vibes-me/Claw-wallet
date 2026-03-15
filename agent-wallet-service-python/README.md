# Claw Wallet Python SDK

<p align="center">
  <strong>Stripe for AI Agent Wallets</strong><br>
  <em>Add wallet functionality to any AI agent in seconds</em>
</p>

<p align="center">
  <a href="https://pypi.org/project/claw-wallet/"><img src="https://img.shields.io/pypi/v/claw-wallet.svg" alt="PyPI Version"></a>
  <a href="https://pypi.org/project/claw-wallet/"><img src="https://img.shields.io/pypi/pyversions/claw-wallet.svg" alt="Python Versions"></a>
  <a href="https://github.com/Vibes-me/Claw-wallet/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
</p>

---

## Installation

```bash
pip install claw-wallet

# With WebSocket support
pip install claw-wallet[websocket]

# With development tools
pip install claw-wallet[dev]
```

## Quick Start

```python
from claw_wallet import WalletClient

# Initialize the client
client = WalletClient(api_key="sk_your_api_key_here")

# Create a wallet for your AI agent
wallet = client.create_wallet(
    agent_name="MyAIAgent",
    chain="base-sepolia"  # or "ethereum", "solana", "sui", "aptos", "starknet"
)

print(f"Wallet created: {wallet.address}")

# Check balance
balance = client.get_balance(wallet.address)
print(f"Balance: {balance}")
```

## Features

### Multi-Chain Support

Claw Wallet supports multiple blockchain networks:

| Chain | Network ID | Status |
|-------|------------|--------|
| Ethereum | `ethereum`, `ethereum-sepolia` | ✅ Supported |
| Base | `base`, `base-sepolia` | ✅ Supported |
| Solana | `solana`, `solana-devnet` | ✅ Supported |
| Sui | `sui`, `sui-testnet` | ✅ Supported |
| Aptos | `aptos`, `aptos-testnet` | ✅ Supported |
| Starknet | `starknet`, `starknet-testnet` | ✅ Supported |

### WebSocket Real-Time Updates

```python
from claw_wallet import WebSocketClient

ws = WebSocketClient(api_key="sk_...")
ws.connect()

# Subscribe to wallet events
ws.subscribe("0x123...")

for event in ws.listen():
    if event['type'] == 'transaction.confirmed':
        print(f"Transaction confirmed: {event['transaction']['hash']}")
    elif event['type'] == 'approval.requested':
        print(f"Approval needed: {event['details']}")
```

### LangChain Integration

```python
from claw_wallet.langchain import WalletTools, create_wallet_agent

# Create wallet tools for LangChain
tools = WalletTools(api_key="sk_...")

# Create an agent with wallet capabilities
agent = create_wallet_agent(
    api_key="sk_...",
    model="gpt-4"
)

# The agent can now perform wallet operations
response = agent.run("Create a wallet on Base and check its balance")
```

### Policy Engine

```python
# Set spending limits
client.create_policy(
    wallet_id=wallet.id,
    policy_type="spend_limit",
    config={
        "max_amount": "100",  # in USD
        "period": "daily"
    }
)

# Require approval for large transactions
client.create_policy(
    wallet_id=wallet.id,
    policy_type="approval_required",
    config={
        "threshold": "50"  # USD threshold
    }
)
```

## API Reference

### WalletClient

#### `__init__(api_key: str, base_url: str = None)`

Initialize the wallet client.

- `api_key`: Your API key (starts with `sk_`)
- `base_url`: Optional custom API endpoint

#### `create_wallet(agent_name: str, chain: str, metadata: dict = None) -> Wallet`

Create a new wallet for an AI agent.

#### `get_wallet(wallet_id: str) -> Wallet`

Get wallet details by ID.

#### `get_balance(address: str, chain: str = None) -> Balance`

Get the balance of a wallet address.

#### `send_transaction(from: str, to: str, value: str, chain: str) -> Transaction`

Send a transaction from a wallet.

#### `get_transaction(hash: str, chain: str = None) -> Transaction`

Get transaction details by hash.

## Error Handling

```python
from claw_wallet import WalletClient
from claw_wallet.exceptions import (
    AuthenticationError,
    RateLimitError,
    WalletNotFoundError,
    ValidationError
)

client = WalletClient(api_key="sk_...")

try:
    wallet = client.create_wallet(agent_name="", chain="invalid")
except ValidationError as e:
    print(f"Invalid input: {e}")
except AuthenticationError as e:
    print(f"Authentication failed: {e}")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
```

## Environment Variables

- `CLAW_API_KEY`: Default API key
- `CLAW_BASE_URL`: Custom API endpoint
- `CLAW_TIMEOUT`: Request timeout in seconds (default: 30)

## Development

```bash
# Clone the repository
git clone https://github.com/Vibes-me/Claw-wallet.git
cd Claw-wallet/agent-wallet-service-python

# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black claw_wallet

# Type check
mypy claw_wallet
```

## License

Apache-2.0 - See [LICENSE](../LICENSE) for details.

## Links

- [GitHub Repository](https://github.com/Vibes-me/Claw-wallet)
- [Issue Tracker](https://github.com/Vibes-me/Claw-wallet/issues)
- [Documentation](https://github.com/Vibes-me/Claw-wallet#readme)

---

<p align="center">
  Built with 🦞 by <strong>Mr. Claw</strong>
</p>
