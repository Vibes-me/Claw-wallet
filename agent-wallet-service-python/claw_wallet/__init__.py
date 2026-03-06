"""
CLAW Wallet Python SDK
======================

Stripe for AI Agent Wallets - Python client library.

Add wallet functionality to any AI agent in seconds.

Usage:
    from claw_wallet import WalletClient
    
    client = WalletClient(api_key="sk_...")
    wallet = client.create_wallet(agent_name="MyAgent", chain="base-sepolia")
    balance = client.get_balance(wallet.address)
    
    # WebSocket for real-time updates
    from claw_wallet import WebSocketClient
    
    ws = WebSocketClient(api_key="sk_...")
    ws.connect()
    ws.subscribe(wallet.address)
    
    for event in ws.listen():
        print(f"Event: {event['type']}")
"""

__version__ = "0.2.0"
__author__ = "Mr. Claw"

from .client import WalletClient
from .exceptions import (
    CLAWWalletError,
    AuthenticationError,
    RateLimitError,
    WalletNotFoundError,
    ValidationError,
)
from .models import (
    Wallet,
    Balance,
    Transaction,
    Identity,
    Policy,
)

# WebSocket support (optional dependency)
try:
    from .websocket_client import (
        WebSocketClient,
        WebSocketError,
        TransactionEvent,
        WalletEvent,
        ApprovalEvent,
        DeFiEvent,
    )
    _WEBSOCKET_AVAILABLE = True
except ImportError:
    _WEBSOCKET_AVAILABLE = False
    WebSocketClient = None  # type: ignore
    WebSocketError = None  # type: ignore
    TransactionEvent = None  # type: ignore
    WalletEvent = None  # type: ignore
    ApprovalEvent = None  # type: ignore
    DeFiEvent = None  # type: ignore

__all__ = [
    # Core client
    "WalletClient",
    
    # Exceptions
    "CLAWWalletError",
    "AuthenticationError",
    "RateLimitError",
    "WalletNotFoundError",
    "ValidationError",
    
    # Models
    "Wallet",
    "Balance",
    "Transaction",
    "Identity",
    "Policy",
]

# Add WebSocket exports if available
if _WEBSOCKET_AVAILABLE:
    __all__.extend([
        "WebSocketClient",
        "WebSocketError",
        "TransactionEvent",
        "WalletEvent",
        "ApprovalEvent",
        "DeFiEvent",
    ])
