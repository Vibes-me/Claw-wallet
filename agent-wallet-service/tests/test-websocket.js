/**
 * WebSocket Test Script for Claw Wallet
 * 
 * Tests real-time WebSocket functionality
 * 
 * Usage: node tests/test-websocket.js
 */

import { WebSocket } from 'ws';
import { readFileSync } from 'fs';
import { join } from 'path';

const API_URL = process.env.API_URL || 'http://127.0.0.1:3000';
const WS_URL = API_URL.replace('http', 'ws') + '/ws';

function resolveApiKey() {
  if (process.env.TEST_API_KEY) return process.env.TEST_API_KEY;
  const keysPath = join(process.cwd(), 'api-keys.json');
  try {
    const keys = JSON.parse(readFileSync(keysPath, 'utf-8'));
    return keys?.[0]?.key;
  } catch {
    return null;
  }
}

const API_KEY = resolveApiKey();

if (!API_KEY) {
  throw new Error('No API key available. Set TEST_API_KEY or create api-keys.json.');
}

let testsPassed = 0;
let testsFailed = 0;

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    log('🔌', 'Testing WebSocket connection...');
    
    const ws = new WebSocket(WS_URL);
    let receivedConnectionAck = false;

    ws.on('open', () => {
      log('✅', 'WebSocket connected');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection:established') {
          receivedConnectionAck = true;
          log('✅', `Connection acknowledged - Client ID: ${message.data.clientId}`);
          ws.close();
        }
      } catch (e) {
        log('❌', `Failed to parse message: ${e.message}`);
      }
    });

    ws.on('close', () => {
      if (receivedConnectionAck) {
        testsPassed++;
        log('✅', 'WebSocket connection test PASSED');
        resolve();
      } else {
        testsFailed++;
        log('❌', 'WebSocket connection test FAILED - no ack received');
        reject(new Error('No connection acknowledgment'));
      }
    });

    ws.on('error', (error) => {
      testsFailed++;
      log('❌', `WebSocket error: ${error.message}`);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!receivedConnectionAck) {
        ws.close();
        testsFailed++;
        log('❌', 'WebSocket connection test FAILED - timeout');
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
}

async function testAuthentication() {
  return new Promise((resolve, reject) => {
    log('🔐', 'Testing WebSocket authentication...');
    
    const ws = new WebSocket(WS_URL);
    let authenticated = false;

    ws.on('open', () => {
      // Send auth message
      ws.send(JSON.stringify({
        type: 'auth',
        data: { apiKey: API_KEY }
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth:success') {
          authenticated = true;
          log('✅', 'Authentication successful');
          ws.close();
        }
      } catch (e) {
        log('❌', `Failed to parse message: ${e.message}`);
      }
    });

    ws.on('close', () => {
      if (authenticated) {
        testsPassed++;
        log('✅', 'Authentication test PASSED');
        resolve();
      } else {
        testsFailed++;
        log('❌', 'Authentication test FAILED');
        reject(new Error('Authentication failed'));
      }
    });

    ws.on('error', (error) => {
      testsFailed++;
      log('❌', `Auth test error: ${error.message}`);
      reject(error);
    });

    setTimeout(() => {
      if (!authenticated) {
        ws.close();
        testsFailed++;
        log('❌', 'Authentication test FAILED - timeout');
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
}

async function testSubscription() {
  return new Promise((resolve, reject) => {
    log('📡', 'Testing wallet subscription...');
    
    const ws = new WebSocket(WS_URL);
    let subscribed = false;
    const testAddress = '0x1234567890123456789012345678901234567890';

    ws.on('open', () => {
      // Auth first
      ws.send(JSON.stringify({
        type: 'auth',
        data: { apiKey: API_KEY }
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth:success') {
          // Subscribe to wallet
          ws.send(JSON.stringify({
            type: 'subscribe',
            data: { walletAddress: testAddress }
          }));
        }
        
        if (message.type === 'subscribe:success') {
          subscribed = true;
          log('✅', `Subscribed to wallet: ${message.data.walletAddress}`);
          ws.close();
        }
      } catch (e) {
        log('❌', `Failed to parse message: ${e.message}`);
      }
    });

    ws.on('close', () => {
      if (subscribed) {
        testsPassed++;
        log('✅', 'Subscription test PASSED');
        resolve();
      } else {
        testsFailed++;
        log('❌', 'Subscription test FAILED');
        reject(new Error('Subscription failed'));
      }
    });

    ws.on('error', (error) => {
      testsFailed++;
      log('❌', `Subscription test error: ${error.message}`);
      reject(error);
    });

    setTimeout(() => {
      if (!subscribed) {
        ws.close();
        testsFailed++;
        log('❌', 'Subscription test FAILED - timeout');
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
}

async function testPingPong() {
  return new Promise((resolve, reject) => {
    log('🏓', 'Testing ping/pong...');
    
    const ws = new WebSocket(WS_URL);
    let pongReceived = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'pong') {
          pongReceived = true;
          log('✅', `Pong received - latency: ${Date.now() - message.data.timestamp}ms`);
          ws.close();
        }
      } catch (e) {
        log('❌', `Failed to parse message: ${e.message}`);
      }
    });

    ws.on('close', () => {
      if (pongReceived) {
        testsPassed++;
        log('✅', 'Ping/pong test PASSED');
        resolve();
      } else {
        testsFailed++;
        log('❌', 'Ping/pong test FAILED');
        reject(new Error('No pong received'));
      }
    });

    ws.on('error', (error) => {
      testsFailed++;
      log('❌', `Ping/pong test error: ${error.message}`);
      reject(error);
    });

    setTimeout(() => {
      if (!pongReceived) {
        ws.close();
        testsFailed++;
        log('❌', 'Ping/pong test FAILED - timeout');
        reject(new Error('Timeout'));
      }
    }, 5000);
  });
}

async function testWsEndpoint() {
  log('📊', 'Testing /ws HTTP endpoint...');
  
  try {
    const response = await fetch(`${API_URL}/ws`);
    const data = await response.json();
    
    if (data.status && data.events && data.usage) {
      testsPassed++;
      log('✅', 'WS endpoint test PASSED');
      log('📋', `Events available: ${data.events.length}`);
      return true;
    } else {
      testsFailed++;
      log('❌', 'WS endpoint test FAILED - missing fields');
      return false;
    }
  } catch (error) {
    testsFailed++;
    log('❌', `WS endpoint test FAILED: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  console.log('\n🦞 Claw Wallet WebSocket Tests');
  console.log('================================\n');
  console.log(`WebSocket URL: ${WS_URL}`);
  console.log(`API Key: ${API_KEY.slice(0, 12)}...\n`);

  const tests = [
    { name: 'WS Endpoint', fn: testWsEndpoint },
    { name: 'Connection', fn: testWebSocketConnection },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Subscription', fn: testSubscription },
    { name: 'Ping/Pong', fn: testPingPong }
  ];

  for (const test of tests) {
    try {
      await test.fn();
      await sleep(500); // Small delay between tests
    } catch (error) {
      log('❌', `${test.name} test failed: ${error.message}`);
    }
  }

  console.log('\n================================');
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All WebSocket tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check logs above.\n');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
