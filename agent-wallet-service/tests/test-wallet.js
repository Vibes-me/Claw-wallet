/**
 * Test script for Agent Wallet Service
 * Run: node tests/test-wallet.js
 */

const API_URL = 'http://localhost:3000';

import { readFileSync } from 'fs';

function getApiKey() {
  const keys = JSON.parse(readFileSync('api-keys.json', 'utf-8'));
  return keys[0]?.key;
}

const API_KEY = getApiKey();
const AUTH_HEADERS = API_KEY ? { 'X-API-Key': API_KEY } : {};

async function testHealth() {
  console.log('\n📊 Testing health endpoint...');
  const res = await fetch(`${API_URL}/health`);
  const data = await res.json();
  console.log('Health:', data);
  return res.ok;
}

async function testCreateWallet() {
  console.log('\n🔐 Testing wallet creation...');
  const res = await fetch(`${API_URL}/wallet/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADERS },
    body: JSON.stringify({
      agentName: 'TestAgent',
      chain: 'base-sepolia'
    })
  });
  const data = await res.json();
  console.log('Wallet created:', data);
  return data.wallet?.address;
}

async function testGetBalance(address) {
  console.log('\n💰 Testing balance check...');
  const res = await fetch(`${API_URL}/wallet/${address}/balance`, { headers: AUTH_HEADERS });
  const data = await res.json();
  console.log('Balance:', data);
}

async function testRegisterIdentity() {
  console.log('\n🆔 Testing identity registration...');
  const res = await fetch(`${API_URL}/identity/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...AUTH_HEADERS },
    body: JSON.stringify({
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      agentName: 'Test Agent',
      description: 'A test AI agent'

    })
  });
  const data = await res.json();
  console.log('Identity:', data);
}

async function runTests() {
  console.log('🦞 Agent Wallet Service Tests');
  console.log('==============================');

  try {
    const healthy = await testHealth();
    if (!healthy) {
      console.log('❌ Server not running. Start with: npm start');
      return;
    }

    const address = await testCreateWallet();
    if (address) {
      await testGetBalance(address);
    }

    await testRegisterIdentity();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
