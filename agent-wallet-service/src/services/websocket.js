/**
 * WebSocket Service for Real-Time Updates
 * 
 * Provides real-time notifications for:
 * - Transaction status changes (pending, confirmed, failed)
 * - Wallet balance updates
 * - Policy approval requests
 * - Pending approval status changes
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { logger } from './logger.js';

// Store active connections with metadata
const clients = new Map();

// Event types for type-safe emissions
export const WSEvents = {
  // Transaction events
  TX_PENDING: 'tx:pending',
  TX_CONFIRMED: 'tx:confirmed',
  TX_FAILED: 'tx:failed',
  TX_SENT: 'tx:sent',
  
  // Wallet events
  WALLET_CREATED: 'wallet:created',
  WALLET_IMPORTED: 'wallet:imported',
  WALLET_BALANCE_UPDATED: 'wallet:balance_updated',
  
  // Policy/HITL events
  APPROVAL_REQUIRED: 'approval:required',
  APPROVAL_APPROVED: 'approval:approved',
  APPROVAL_REJECTED: 'approval:rejected',
  APPROVAL_EXPIRED: 'approval:expired',
  
  // DeFi events
  DEFI_SWAP: 'defi:swap',
  DEFI_SWAP_CONFIRMED: 'defi:swap:confirmed',
  DEFI_STAKE: 'defi:stake',
  DEFI_UNSTAKE: 'defi:unstake',
  DEFI_SUPPLY: 'defi:supply',
  DEFI_BORROW: 'defi:borrow',
  DEFI_REPAY: 'defi:repay',
  DEFI_CROSSCHAIN: 'defi:crosschain',
  
  // System events
  SYSTEM_HEALTH: 'system:health',
  SYSTEM_ALERT: 'system:alert',
  SYSTEM_SHUTDOWN: 'system:shutdown'
};

let wss = null;

/**
 * Initialize WebSocket server
 * @param {import('http').Server} server - HTTP server instance
 * @param {import('express').Express} app - Express app for path mounting
 */
export function initWebSocket(server, app) {
  wss = new WebSocketServer({ 
    server,
    path: '/ws',
    clientTracking: true
  });

  wss.on('connection', (ws, req) => {
    const clientId = randomUUID();
    const clientIp = req.socket.remoteAddress;
    
    // Store client with metadata
    clients.set(clientId, {
      ws,
      id: clientId,
      ip: clientIp,
      connectedAt: new Date().toISOString(),
      subscriptions: new Set(), // Wallet addresses to subscribe to
      apiKey: null,
      tenantId: null
    });

    logger.info({ clientId, ip: clientIp, totalClients: clients.size }, 'WebSocket client connected');

    // Send connection acknowledgment
    sendToClient(ws, {
      type: 'connection:established',
      data: {
        clientId,
        timestamp: new Date().toISOString(),
        message: 'Connected to Claw Wallet WebSocket'
      }
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch (error) {
        logger.warn({ clientId, error: error.message }, 'Invalid WebSocket message');
        sendToClient(ws, {
          type: 'error',
          data: { message: 'Invalid message format' }
        });
      }
    });

    ws.on('close', () => {
      const client = clients.get(clientId);
      if (client) {
        logger.info({ clientId, duration: Date.now() - new Date(client.connectedAt).getTime() }, 'WebSocket client disconnected');
        clients.delete(clientId);
      }
    });

    ws.on('error', (error) => {
      logger.error({ clientId, error: error.message }, 'WebSocket error');
      clients.delete(clientId);
    });
  });

  wss.on('error', (error) => {
    logger.error({ error: error.message }, 'WebSocket server error');
  });

  // Heartbeat to detect dead connections
  const heartbeatInterval = setInterval(() => {
    for (const [clientId, client] of clients.entries()) {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        try {
          client.ws.ping();
        } catch {
          clients.delete(clientId);
        }
      } else {
        clients.delete(clientId);
      }
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  logger.info('WebSocket server initialized on /ws');
  return wss;
}

/**
 * Handle incoming WebSocket messages from clients
 */
function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  const { type, data } = message;

  switch (type) {
    case 'auth':
      // Authenticate client with API key
      handleAuth(clientId, data);
      break;

    case 'subscribe':
      // Subscribe to wallet events
      handleSubscribe(clientId, data);
      break;

    case 'unsubscribe':
      // Unsubscribe from wallet events
      handleUnsubscribe(clientId, data);
      break;

    case 'ping':
      // Heartbeat response
      sendToClient(client.ws, { type: 'pong', data: { timestamp: Date.now() } });
      break;

    default:
      logger.warn({ clientId, type }, 'Unknown WebSocket message type');
  }
}

/**
 * Handle client authentication
 */
function handleAuth(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;

  // Store API key and tenant info (validation happens via API routes)
  client.apiKey = data?.apiKey || null;
  client.tenantId = data?.tenantId || null;

  sendToClient(client.ws, {
    type: 'auth:success',
    data: { 
      message: 'Authentication acknowledged',
      clientId 
    }
  });

  logger.debug({ clientId }, 'WebSocket client authenticated');
}

/**
 * Handle wallet subscription
 */
function handleSubscribe(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;

  const { walletAddress } = data;
  if (!walletAddress) {
    sendToClient(client.ws, {
      type: 'error',
      data: { message: 'walletAddress required for subscription' }
    });
    return;
  }

  client.subscriptions.add(walletAddress.toLowerCase());

  sendToClient(client.ws, {
    type: 'subscribe:success',
    data: { 
      walletAddress,
      message: `Subscribed to wallet ${walletAddress}`
    }
  });

  logger.debug({ clientId, walletAddress }, 'Client subscribed to wallet');
}

/**
 * Handle wallet unsubscription
 */
function handleUnsubscribe(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;

  const { walletAddress } = data;
  if (walletAddress) {
    client.subscriptions.delete(walletAddress.toLowerCase());
  } else {
    client.subscriptions.clear();
  }

  sendToClient(client.ws, {
    type: 'unsubscribe:success',
    data: { walletAddress, message: 'Unsubscribed' }
  });
}

/**
 * Send message to a specific client
 */
function sendToClient(ws, message) {
  if (ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast to all connected clients
 */
export function broadcast(event, data) {
  const message = { type: event, data, timestamp: new Date().toISOString() };
  const payload = JSON.stringify(message);
  
  let sent = 0;
  for (const client of clients.values()) {
    if (client.ws.readyState === 1) {
      client.ws.send(payload);
      sent++;
    }
  }
  
  logger.debug({ event, clientsReached: sent }, 'Broadcast sent');
  return sent;
}

/**
 * Emit event to clients subscribed to a specific wallet
 */
export function emitToWallet(walletAddress, event, data) {
  const message = { type: event, data, timestamp: new Date().toISOString() };
  const payload = JSON.stringify(message);
  const normalizedAddress = walletAddress.toLowerCase();
  
  let sent = 0;
  for (const client of clients.values()) {
    if (client.subscriptions.has(normalizedAddress) && client.ws.readyState === 1) {
      client.ws.send(payload);
      sent++;
    }
  }
  
  logger.debug({ event, walletAddress, clientsReached: sent }, 'Wallet event emitted');
  return sent;
}

/**
 * Emit event to clients by tenant ID
 */
export function emitToTenant(tenantId, event, data) {
  const message = { type: event, data, timestamp: new Date().toISOString() };
  const payload = JSON.stringify(message);
  
  let sent = 0;
  for (const client of clients.values()) {
    if (client.tenantId === tenantId && client.ws.readyState === 1) {
      client.ws.send(payload);
      sent++;
    }
  }
  
  logger.debug({ event, tenantId, clientsReached: sent }, 'Tenant event emitted');
  return sent;
}

// ============================================================
// HELPER FUNCTIONS FOR COMMON EVENTS
// ============================================================

/**
 * Emit transaction pending event
 */
export function emitTxPending(walletAddress, txData) {
  return emitToWallet(walletAddress, WSEvents.TX_PENDING, {
    walletAddress,
    ...txData
  });
}

/**
 * Emit transaction confirmed event
 */
export function emitTxConfirmed(walletAddress, txData) {
  return emitToWallet(walletAddress, WSEvents.TX_CONFIRMED, {
    walletAddress,
    ...txData
  });
}

/**
 * Emit transaction failed event
 */
export function emitTxFailed(walletAddress, txData) {
  return emitToWallet(walletAddress, WSEvents.TX_FAILED, {
    walletAddress,
    ...txData
  });
}

/**
 * Emit wallet balance update
 */
export function emitBalanceUpdate(walletAddress, balanceData) {
  return emitToWallet(walletAddress, WSEvents.WALLET_BALANCE_UPDATED, {
    walletAddress,
    ...balanceData
  });
}

/**
 * Emit approval required event (HITL)
 */
export function emitApprovalRequired(tenantId, approvalData) {
  return emitToTenant(tenantId, WSEvents.APPROVAL_REQUIRED, approvalData);
}

/**
 * Emit approval status change
 */
export function emitApprovalUpdate(tenantId, approvalId, status, data = {}) {
  return emitToTenant(tenantId, `approval:${status}`, {
    approvalId,
    status,
    ...data
  });
}

/**
 * Get WebSocket server stats
 */
export function getWsStats() {
  return {
    connectedClients: clients.size,
    clients: Array.from(clients.values()).map(c => ({
      id: c.id,
      connectedAt: c.connectedAt,
      subscriptions: c.subscriptions.size,
      authenticated: !!c.apiKey
    }))
  };
}

/**
 * Close WebSocket server gracefully
 */
export async function closeWebSocket() {
  if (!wss) return;

  // Notify all clients of shutdown
  broadcast('system:shutdown', { 
    message: 'Server shutting down',
    timestamp: new Date().toISOString()
  });

  // Close all connections
  for (const client of clients.values()) {
    client.ws.close(1001, 'Server shutting down');
  }
  clients.clear();

  // Close server
  return new Promise((resolve) => {
    wss.close(() => {
      logger.info('WebSocket server closed');
      resolve();
    });
  });
}

export default {
  initWebSocket,
  broadcast,
  emitToWallet,
  emitToTenant,
  emitTxPending,
  emitTxConfirmed,
  emitTxFailed,
  emitBalanceUpdate,
  emitApprovalRequired,
  emitApprovalUpdate,
  getWsStats,
  closeWebSocket,
  WSEvents
};
