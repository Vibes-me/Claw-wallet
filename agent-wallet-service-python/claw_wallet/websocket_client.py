"""
CLAW Wallet Python SDK - WebSocket Client
==========================================

WebSocket client for real-time updates from the Agent Wallet Service.

Example:
    >>> from claw_wallet import WalletClient, WebSocketClient
    >>> 
    >>> ws = WebSocketClient(api_key="sk_...")
    >>> ws.connect()
    >>> ws.subscribe("0x1234...")
    >>> 
    >>> for event in ws.listen():
    ...     print(f"Event: {event.type}")
"""

import json
import threading
from typing import Optional, Callable, Dict, Any, Iterator
from urllib.parse import urlparse

try:
    import websocket
except ImportError:
    websocket = None  # type: ignore


class WebSocketError(Exception):
    """WebSocket-related errors."""
    pass


class WebSocketClient:
    """
    WebSocket client for real-time wallet updates.
    
    Args:
        base_url: Base URL of the wallet service (default: http://localhost:3000)
        api_key: Your API key for authentication
        on_event: Optional callback for incoming events
        on_connect: Optional callback when connected
        on_disconnect: Optional callback when disconnected
        on_error: Optional callback for errors
    
    Example:
        >>> ws = WebSocketClient(api_key="sk_...")
        >>> ws.connect()
        >>> ws.subscribe("0x1234...")
        >>> 
        >>> # Blocking listen
        >>> for event in ws.listen():
        ...     if event['type'] == 'tx:confirmed':
        ...         print(f"Transaction confirmed: {event['data']['hash']}")
    """
    
    # Event types
    TX_PENDING = "tx:pending"
    TX_CONFIRMED = "tx:confirmed"
    TX_FAILED = "tx:failed"
    WALLET_CREATED = "wallet:created"
    WALLET_IMPORTED = "wallet:imported"
    WALLET_BALANCE_UPDATED = "wallet:balance_updated"
    APPROVAL_REQUIRED = "approval:required"
    APPROVAL_APPROVED = "approval:approved"
    APPROVAL_REJECTED = "approval:rejected"
    DEFI_SWAP = "defi:swap"
    DEFI_STAKE = "defi:stake"
    SYSTEM_SHUTDOWN = "system:shutdown"
    
    def __init__(
        self,
        base_url: str = "http://localhost:3000",
        api_key: Optional[str] = None,
        on_event: Optional[Callable[[Dict[str, Any]], None]] = None,
        on_connect: Optional[Callable[[], None]] = None,
        on_disconnect: Optional[Callable[[], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None,
    ):
        if websocket is None:
            raise ImportError(
                "websocket-client is required for WebSocket support. "
                "Install with: pip install websocket-client"
            )
        
        self.api_key = api_key
        self.on_event = on_event
        self.on_connect = on_connect
        self.on_disconnect = on_disconnect
        self.on_error = on_error
        
        # Convert HTTP URL to WebSocket URL
        parsed = urlparse(base_url)
        ws_scheme = "wss" if parsed.scheme == "https" else "ws"
        self.ws_url = f"{ws_scheme}://{parsed.netloc}{parsed.path}/ws"
        
        self._ws: Optional[websocket.WebSocket] = None
        self._connected = False
        self._authenticated = False
        self._subscriptions: set = set()
        self._event_queue: list = []
        self._lock = threading.Lock()
    
    @property
    def connected(self) -> bool:
        """Check if WebSocket is connected."""
        return self._connected
    
    @property
    def authenticated(self) -> bool:
        """Check if WebSocket is authenticated."""
        return self._authenticated
    
    def connect(self, timeout: int = 10) -> bool:
        """
        Connect to WebSocket server and authenticate.
        
        Args:
            timeout: Connection timeout in seconds
        
        Returns:
            True if connected and authenticated successfully
        """
        try:
            self._ws = websocket.create_connection(
                self.ws_url,
                timeout=timeout
            )
            self._connected = True
            
            # Wait for connection acknowledgment
            result = self._ws.recv()
            msg = json.loads(result)
            
            if msg.get('type') != 'connection:established':
                raise WebSocketError(f"Unexpected message: {msg}")
            
            # Authenticate
            if self.api_key:
                self._send({'type': 'auth', 'data': {'apiKey': self.api_key}})
                result = self._ws.recv()
                msg = json.loads(result)
                
                if msg.get('type') == 'auth:success':
                    self._authenticated = True
                else:
                    raise WebSocketError(f"Authentication failed: {msg}")
            
            # Resubscribe to previous subscriptions
            for wallet_address in self._subscriptions:
                self.subscribe(wallet_address)
            
            if self.on_connect:
                self.on_connect()
            
            return True
            
        except Exception as e:
            self._connected = False
            if self.on_error:
                self.on_error(e)
            raise WebSocketError(f"Connection failed: {e}")
    
    def disconnect(self) -> None:
        """Disconnect from WebSocket server."""
        if self._ws:
            try:
                self._ws.close()
            except:
                pass
            finally:
                self._ws = None
        
        self._connected = False
        self._authenticated = False
        
        if self.on_disconnect:
            self.on_disconnect()
    
    def _send(self, message: Dict[str, Any]) -> None:
        """Send a message to the server."""
        if not self._ws or not self._connected:
            raise WebSocketError("Not connected")
        
        self._ws.send(json.dumps(message))
    
    def subscribe(self, wallet_address: str) -> bool:
        """
        Subscribe to events for a specific wallet.
        
        Args:
            wallet_address: Wallet address to subscribe to
        
        Returns:
            True if subscription successful
        """
        if not self._authenticated:
            raise WebSocketError("Not authenticated")
        
        self._send({
            'type': 'subscribe',
            'data': {'walletAddress': wallet_address}
        })
        
        # Wait for acknowledgment
        result = self._ws.recv()
        msg = json.loads(result)
        
        if msg.get('type') == 'subscribe:success':
            with self._lock:
                self._subscriptions.add(wallet_address.lower())
            return True
        
        return False
    
    def unsubscribe(self, wallet_address: Optional[str] = None) -> bool:
        """
        Unsubscribe from wallet events.
        
        Args:
            wallet_address: Wallet address to unsubscribe from, or None for all
        
        Returns:
            True if unsubscription successful
        """
        if not self._authenticated:
            raise WebSocketError("Not authenticated")
        
        self._send({
            'type': 'unsubscribe',
            'data': {'walletAddress': wallet_address}
        })
        
        with self._lock:
            if wallet_address:
                self._subscriptions.discard(wallet_address.lower())
            else:
                self._subscriptions.clear()
        
        return True
    
    def ping(self) -> float:
        """
        Send a ping and measure latency.
        
        Returns:
            Latency in milliseconds
        """
        if not self._ws or not self._connected:
            raise WebSocketError("Not connected")
        
        import time
        start = time.time()
        
        self._send({'type': 'ping'})
        result = self._ws.recv()
        msg = json.loads(result)
        
        if msg.get('type') == 'pong':
            return (time.time() - start) * 1000
        
        raise WebSocketError(f"Unexpected response: {msg}")
    
    def receive(self, timeout: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """
        Receive a single event (non-blocking with timeout).
        
        Args:
            timeout: Timeout in seconds, or None for no timeout
        
        Returns:
            Event dict or None if timeout
        """
        if not self._ws or not self._connected:
            raise WebSocketError("Not connected")
        
        try:
            if timeout:
                self._ws.settimeout(timeout)
            
            result = self._ws.recv()
            msg = json.loads(result)
            
            if self.on_event:
                self.on_event(msg)
            
            return msg
            
        except websocket.WebSocketTimeoutException:
            return None
        finally:
            if timeout:
                self._ws.settimeout(None)
    
    def listen(self, timeout: Optional[float] = None) -> Iterator[Dict[str, Any]]:
        """
        Iterate over incoming events (blocking generator).
        
        Args:
            timeout: Timeout per event in seconds, or None for infinite
        
        Yields:
            Event dictionaries
        """
        while self._connected:
            try:
                event = self.receive(timeout=timeout)
                if event:
                    yield event
            except WebSocketError:
                break
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()
        return False


# Event data classes for type hints
class TransactionEvent:
    """Transaction event data."""
    
    def __init__(self, data: Dict[str, Any]):
        self.hash: str = data.get('hash', '')
        self.wallet_address: str = data.get('walletAddress', '')
        self.to: str = data.get('to', '')
        self.value: str = data.get('value', '')
        self.chain: str = data.get('chain', '')
        self.status: str = data.get('status', '')
        self.timestamp: str = data.get('timestamp', '')
        self.error: Optional[str] = data.get('error')
    
    def __repr__(self) -> str:
        return f"TransactionEvent(hash={self.hash[:10]}..., value={self.value} ETH)"


class WalletEvent:
    """Wallet event data."""
    
    def __init__(self, data: Dict[str, Any]):
        self.wallet_id: str = data.get('walletId', '')
        self.agent_name: str = data.get('agentName', '')
        self.address: str = data.get('address', '')
        self.chain: str = data.get('chain', '')
        self.timestamp: str = data.get('timestamp', '')
    
    def __repr__(self) -> str:
        return f"WalletEvent(name={self.agent_name}, address={self.address[:10]}...)"


class ApprovalEvent:
    """Approval event data."""
    
    def __init__(self, data: Dict[str, Any]):
        self.id: str = data.get('id', '')
        self.wallet_address: str = data.get('walletAddress', '')
        self.to_address: str = data.get('toAddress', '')
        self.value_eth: str = data.get('valueEth', '')
        self.chain: str = data.get('chain', '')
        self.status: str = data.get('status', '')
        self.approved_by: Optional[str] = data.get('approvedBy')
        self.rejection_reason: Optional[str] = data.get('rejectionReason')
    
    def __repr__(self) -> str:
        return f"ApprovalEvent(id={self.id}, value={self.value_eth} ETH)"


class DeFiEvent:
    """DeFi operation event data."""
    
    def __init__(self, data: Dict[str, Any]):
        self.hash: str = data.get('hash', '')
        self.operation: str = data.get('operation', 'swap')
        self.from_token: str = data.get('fromToken', '')
        self.to_token: str = data.get('toToken', '')
        self.amount_in: str = data.get('amountIn', '')
        self.chain: str = data.get('chain', '')
        self.provider: str = data.get('provider', '')
        self.status: str = data.get('status', '')
    
    def __repr__(self) -> str:
        return f"DeFiEvent(op={self.operation}, from={self.from_token[:10]}...)"
