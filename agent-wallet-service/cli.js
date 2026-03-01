#!/usr/bin/env node

/**
 * Agent Wallet CLI
 * 
 * Complete CLI for wallet + identity management
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const API = process.env.AGENT_WALLET_API || 'http://localhost:3000';
const CLI_API_KEY = process.env.AGENT_WALLET_API_KEY || process.env.API_KEY || '';

// ============================================================
// SHARED REQUEST HELPER
// ============================================================

function getCliApiKey() {
  return process.env.AGENT_WALLET_API_KEY || process.env.API_KEY || '';
}

async function cliRequest(path, { method = 'GET', body, auth = 'required', apiKey } = {}) {
  const headers = {};
  const resolvedApiKey = apiKey ?? getCliApiKey();

  if (auth !== 'none') {
    if (resolvedApiKey) {
      headers['X-API-Key'] = resolvedApiKey;
    } else if (auth === 'required') {
      return {
        ok: false,
        status: 401,
        data: {
          error: 'Missing API key. Set AGENT_WALLET_API_KEY (or API_KEY), or run: node cli.js setup --init'
        }
      };
    }
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let data;
    try {
      data = await res.json();
    } catch {
      return {
        ok: false,
        status: res.status,
        data: {
          error: `Unexpected non-JSON response from ${method} ${path} (HTTP ${res.status})`
        }
      };
    }

    if (!res.ok && !data?.error) {
      data.error = `Request failed (HTTP ${res.status})`;
    }

    if (!res.ok && res.status === 401) {
      const hint = 'Missing API key. Set AGENT_WALLET_API_KEY (or API_KEY), or run: node cli.js setup --init';
      data.error = data?.error ? `${data.error}. ${hint}` : hint;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: {
        error: `Could not reach ${API}. Start the service with: npm start`
      }
    };
  }
}

// ============================================================
// WALLET COMMANDS
// ============================================================

async function createWallet(name, chain = 'base-sepolia') {
  return cliRequest('/wallet/create', {
    method: 'POST',
    body: { agentName: name, chain }
  });
}

async function importWallet(privateKey, name, chain) {
  return cliRequest('/wallet/import', {
    method: 'POST',
    body: { privateKey, agentName: name, chain }
  });
}

async function getBalance(address, chain) {
  const path = chain
    ? `/wallet/${address}/balance?chain=${chain}`
    : `/wallet/${address}/balance`;
  return cliRequest(path);
}

async function getAllBalances(address) {
  return cliRequest(`/wallet/${address}/balance/all`);
}

async function sendTransaction(from, to, value, chain) {
  return cliRequest(`/wallet/${from}/send`, {
    method: 'POST',
    body: { to, value, chain }
  });
}

async function listWallets() {
  return cliRequest('/wallet/list');
}

async function sweepWallet(from, to, chain) {
  return cliRequest(`/wallet/${from}/sweep`, {
    method: 'POST',
    body: { to, chain }
  });
}

async function estimateGas(from, to, value, chain) {
  return cliRequest('/wallet/estimate-gas', {
    method: 'POST',
    body: { from, to, value, chain }
  });
}

async function listChains() {
  return cliRequest('/wallet/chains');
}

async function getTxStatus(hash, chain) {
  return cliRequest(`/wallet/tx/${hash}?chain=${chain || 'base-sepolia'}`);
}

// ============================================================
// IDENTITY COMMANDS
// ============================================================

async function createIdentity(walletAddress, name, type = 'assistant') {
  return cliRequest('/identity/create', {
    method: 'POST',
    body: {
      walletAddress,
      agentName: name,
      agentType: type,
      capabilities: ['wallet', 'messaging']
    }
  });
}

async function listIdentities() {
  return cliRequest('/identity/list');
}

async function getIdentity(agentId) {
  return cliRequest(`/identity/${agentId}`);
}

async function getIdentitiesByWallet(address) {
  return cliRequest(`/identity/wallet/${address}`);
}

// ============================================================
// ENS COMMANDS
// ============================================================

async function listEnsNames() {
  return cliRequest('/ens/list');
}

async function getEnsName(name) {
  return cliRequest(`/ens/${name}`);
}

async function checkEnsName(name) {
  return cliRequest(`/ens/check/${name}`);
}

async function getOnboarding() {
  return cliRequest('/onboarding', { auth: 'none' });
}

async function getHealth() {
  return cliRequest('/health', { auth: 'none' });
}

async function checkAuthStatus(apiKey = CLI_API_KEY) {
  return cliRequest('/wallet/list', { auth: 'optional', apiKey });
}

function readBootstrapAdminKey() {
  const apiKeysPath = join(process.cwd(), 'api-keys.json');
  if (!existsSync(apiKeysPath)) return null;

  try {
    const keys = JSON.parse(readFileSync(apiKeysPath, 'utf8'));
    return Array.isArray(keys) && keys.length > 0 ? keys[0].key : null;
  } catch {
    return null;
  }
}

async function createScopedApiKey(adminApiKey, name = 'cli-init', permissions = ['read', 'write']) {
  return cliRequest('/api-keys', {
    method: 'POST',
    apiKey: adminApiKey,
    body: { name, permissions }
  });
}

function writeEnvLocalTemplate(apiKey) {
  const envPath = join(process.cwd(), '.env.local');
  const lines = [
    `AGENT_WALLET_API=${API}`,
    `AGENT_WALLET_API_KEY=${apiKey || '<paste-api-key>'}`
  ];

  writeFileSync(envPath, `${lines.join('\n')}\n`, 'utf8');
  return envPath;
}

// ============================================================
// MAIN CLI
// ============================================================

async function main() {
  const [,, cmd, ...args] = process.argv;
  
  console.log('🦞 Agent Wallet CLI v0.3.0\n');
  
  switch (cmd) {
    // ============ WALLET COMMANDS ============
    case 'create': {
      const [name, chain] = args;
      if (!name) {
        console.log('Usage: cli.js create <name> [chain]');
        console.log('Chains: base-sepolia, ethereum, polygon, optimism, arbitrum...');
        break;
      }
      console.log(`Creating wallet for ${name} on ${chain || 'base-sepolia'}...`);
      const { data: result } = await createWallet(name, chain);
      if (result.success) {
        console.log(`✅ Wallet created!`);
        console.log(`   Address: ${result.wallet.address}`);
        console.log(`   ID: ${result.wallet.id}`);
        console.log(`   Chain: ${result.wallet.chain}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'import': {
      const [privateKey, name, chain] = args;
      if (!privateKey || !name) {
        console.log('Usage: cli.js import <privateKey> <name> [chain]');
        break;
      }
      console.log(`Importing wallet...`);
      const { data: result } = await importWallet(privateKey, name, chain);
      if (result.success) {
        console.log(`✅ Wallet imported!`);
        console.log(`   Address: ${result.wallet.address}`);
        console.log(`   Imported: ${result.wallet.imported}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'balance': {
      const [address, chain] = args;
      if (!address) {
        console.log('Usage: cli.js balance <address> [chain]');
        break;
      }
      const { data: result } = await getBalance(address, chain);
      if (result.balance) {
        console.log(`Balance: ${result.balance.eth} ETH`);
        console.log(`Chain: ${result.balance.chain}`);
        console.log(`RPC: ${result.balance.rpc}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'balances': {
      const [address] = args;
      if (!address) {
        console.log('Usage: cli.js balances <address>');
        break;
      }
      console.log(`Checking balances across all chains...\n`);
      const { data: result } = await getAllBalances(address);
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        break;
      }
      result.balances.forEach(b => {
        const status = b.status === 'ok' ? '✅' : '❌';
        console.log(`${status} ${b.chain}: ${b.eth} ETH`);
      });
      break;
    }
    
    case 'send': {
      const [from, to, value, chain] = args;
      if (!from || !to || !value) {
        console.log('Usage: cli.js send <from> <to> <value> [chain]');
        break;
      }
      console.log(`Sending ${value} ETH...`);
      const { data: result } = await sendTransaction(from, to, value, chain);
      if (result.success) {
        console.log(`✅ Transaction sent!`);
        console.log(`   Hash: ${result.transaction.hash}`);
        console.log(`   Chain: ${result.transaction.chain}`);
        console.log(`   View: ${result.transaction.explorer}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'sweep': {
      const [from, to, chain] = args;
      if (!from || !to) {
        console.log('Usage: cli.js sweep <from> <to> [chain]');
        break;
      }
      console.log(`Sweeping all funds from ${from} to ${to}...`);
      const { data: result } = await sweepWallet(from, to, chain);
      if (result.success) {
        console.log(`✅ Sweep complete!`);
        console.log(`   Sent: ${result.sweep.amountSent} ETH`);
        console.log(`   Gas: ${result.sweep.gasCost} ETH`);
        console.log(`   Hash: ${result.sweep.hash}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'estimate': {
      const [from, to, value, chain] = args;
      if (!from || !to) {
        console.log('Usage: cli.js estimate <from> <to> [value] [chain]');
        break;
      }
      const { data: result } = await estimateGas(from, to, value, chain);
      if (result.estimatedCost) {
        console.log(`Gas Estimate:`);
        console.log(`   Gas Units: ${result.gasUnits}`);
        console.log(`   Gas Price: ${result.gasPrice}`);
        console.log(`   Total Cost: ${result.estimatedCost}`);
        console.log(`   Chain: ${result.chain}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'tx': {
      const [hash, chain] = args;
      if (!hash) {
        console.log('Usage: cli.js tx <hash> [chain]');
        break;
      }
      const { data: result } = await getTxStatus(hash, chain);
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        break;
      }
      console.log(`Transaction: ${result.hash}`);
      console.log(`   Status: ${result.status}`);
      if (result.blockNumber) {
        console.log(`   Block: ${result.blockNumber}`);
        console.log(`   Gas Used: ${result.gasUsed}`);
      }
      if (result.explorer) {
        console.log(`   View: ${result.explorer}`);
      }
      break;
    }
    
    case 'list': {
      const { data: result } = await listWallets();
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        break;
      }
      if (result.wallets?.length > 0) {
        console.log(`Found ${result.count} wallet(s):`);
        result.wallets.forEach(w => {
          console.log(`   - ${w.agentName}: ${w.address} (${w.chain})`);
        });
      } else {
        console.log('No wallets found.');
      }
      break;
    }
    
    case 'chains': {
      const { data: result } = await listChains();
      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
        break;
      }
      console.log(`Supported Chains (${result.count}):\n`);
      console.log('Testnets:');
      result.chains.filter(c => c.testnet).forEach(c => {
        console.log(`   - ${c.id}: ${c.name} (${c.nativeCurrency.symbol})`);
      });
      console.log('\nMainnets:');
      result.chains.filter(c => !c.testnet).forEach(c => {
        console.log(`   - ${c.id}: ${c.name} (${c.nativeCurrency.symbol})`);
      });
      break;
    }
    
    // ============ IDENTITY COMMANDS ============
    case 'identity': {
      const subCmd = args[0];
      const subArgs = args.slice(1);
      
      switch (subCmd) {
        case 'create': {
          const [address, name, type] = subArgs;
          if (!address || !name) {
            console.log('Usage: cli.js identity create <walletAddress> <name> [type]');
            console.log('Types: assistant, autonomous, hybrid');
            break;
          }
          console.log(`Creating ERC-8004 identity for ${name}...`);
          const { data: result } = await createIdentity(address, name, type);
          if (result.success) {
            console.log(`✅ Identity created!`);
            console.log(`   ID: ${result.identity.id}`);
            console.log(`   Name: ${result.identity.name}`);
            console.log(`   Type: ${result.identity.type}`);
            console.log(`   Wallet: ${result.identity.wallet}`);
          } else {
            console.log(`❌ Error: ${result.error}`);
          }
          break;
        }
        
        case 'list': {
          const { data: result } = await listIdentities();
          if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            break;
          }
          if (result.identities?.length > 0) {
            console.log(`Found ${result.count} identit(y/ies):`);
            result.identities.forEach(id => {
              console.log(`   - ${id.id}: ${id.name} (${id.type})`);
            });
          } else {
            console.log('No identities found.');
          }
          break;
        }
        
        case 'get': {
          const [agentId] = subArgs;
          if (!agentId) {
            console.log('Usage: cli.js identity get <agentId>');
            break;
          }
          const { data: result } = await getIdentity(agentId);
          if (result.error) {
            console.log(`❌ ${result.error}`);
          } else {
            console.log(`Identity: ${result.name}`);
            console.log(`   ID: ${result.id}`);
            console.log(`   Type: ${result.type}`);
            console.log(`   Wallet: ${result.wallet}`);
            console.log(`   Capabilities: ${result.capabilities.map(c => c.type).join(', ')}`);
          }
          break;
        }
        
        case 'wallet': {
          const [address] = subArgs;
          if (!address) {
            console.log('Usage: cli.js identity wallet <address>');
            break;
          }
          const { data: result } = await getIdentitiesByWallet(address);
          if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            break;
          }
          console.log(`Identities for ${address}:`);
          result.identities.forEach(id => {
            console.log(`   - ${id.id}: ${id.name}`);
          });
          break;
        }
        
        default:
          console.log('Identity Commands:');
          console.log('  identity create <wallet> <name> [type]  Create ERC-8004 identity');
          console.log('  identity list                           List all identities');
          console.log('  identity get <agentId>                  Get identity details');
          console.log('  identity wallet <address>               Get identities by wallet');
      }
      break;
    }
    

    case 'ens': {
      const subCmd = args[0];
      const subArgs = args.slice(1);

      switch (subCmd) {
        case 'list': {
          const { data: result } = await listEnsNames();
          if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            break;
          }
          console.log(`ENS records (${result.count || 0}):`);
          (result.records || []).forEach(record => {
            console.log(`   - ${record.name} -> ${record.address}`);
          });
          break;
        }
        case 'get': {
          const [name] = subArgs;
          if (!name) {
            console.log('Usage: cli.js ens get <name>');
            break;
          }
          const { data: result } = await getEnsName(name);
          if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            break;
          }
          console.log(`${result.name} -> ${result.address}`);
          break;
        }
        case 'check': {
          const [name] = subArgs;
          if (!name) {
            console.log('Usage: cli.js ens check <name>');
            break;
          }
          const { data: result } = await checkEnsName(name);
          if (result.error) {
            console.log(`❌ Error: ${result.error}`);
            break;
          }
          console.log(`Name: ${name}`);
          console.log(`   Available: ${result.available ? 'yes' : 'no'}`);
          if (result.price) {
            console.log(`   Price: ${result.price}`);
          }
          break;
        }
        default:
          console.log('ENS Commands:');
          console.log('  ens list                               List registered ENS records');
          console.log('  ens get <name>                         Resolve ENS record');
          console.log('  ens check <name>                       Check ENS availability');
      }
      break;
    }

    case 'setup': {
      const hasInitFlag = args.includes('--init');
      console.log(`Checking server at ${API}...`);
      const healthRes = await getHealth();
      if (!healthRes.ok) {
        if (healthRes.status === 0) {
          console.log(`❌ ${healthRes.data.error}`);
          break;
        }
        console.log(`❌ Server reachable but unhealthy (HTTP ${healthRes.status})`);
        break;
      }
      const health = healthRes.data;
      console.log(`✅ Server online: ${health.service} v${health.version}`);

      const onboarding = await getOnboarding();
      if (onboarding.ok) {
        console.log(`✅ Onboarding endpoint available (${onboarding.status})`);
        console.log(`   API keys configured: ${onboarding.data.apiKeyCount}`);
        if (onboarding.data.keyPreview) {
          console.log(`   First key prefix: ${onboarding.data.keyPreview}...`);
        }
      } else {
        console.log(`⚠️  Onboarding endpoint returned HTTP ${onboarding.status}`);
      }

      const auth = await checkAuthStatus();
      if (auth.ok) {
        console.log('✅ Auth check passed (wallet/list accessible).');
      } else if (auth.status === 401) {
        console.log('⚠️  Auth required: set AGENT_WALLET_API_KEY and re-run setup.');
        console.log(`   Hint: GET ${API}/onboarding`);
      } else if (auth.status === 403) {
        console.log('⚠️  Provided API key is invalid or lacks permissions.');
      } else {
        console.log(`⚠️  Auth check returned HTTP ${auth.status}`);
      }

      if (!hasInitFlag) {
        break;
      }

      console.log('\n🚀 Running one-command onboarding (--init)...');
      const adminKey = process.env.AGENT_WALLET_ADMIN_KEY || process.env.ADMIN_API_KEY || CLI_API_KEY || readBootstrapAdminKey();

      if (!adminKey) {
        const envPath = writeEnvLocalTemplate('');
        console.log('⚠️  Missing admin API key; cannot create scoped API key automatically.');
        console.log('   Provide one of: AGENT_WALLET_ADMIN_KEY, ADMIN_API_KEY, or AGENT_WALLET_API_KEY');
        console.log('   If local bootstrap exists, read it from api-keys.json (first key entry).');
        console.log(`   Wrote template: ${envPath}`);
        console.log('\n📌 Next steps:');
        console.log('   1. Export admin key from api-keys.json or service startup logs');
        console.log('   2. Re-run: node cli.js setup --init');
        break;
      }

      const keyName = `cli-init-${Date.now()}`;
      const created = await createScopedApiKey(adminKey, keyName, ['read', 'write']);

      if (created.ok && created.data?.key?.key) {
        const scopedKey = created.data.key.key;
        const envPath = writeEnvLocalTemplate(scopedKey);
        console.log('✅ Created scoped API key with read/write permissions.');
        console.log(`   Key name: ${created.data.key.name}`);
        console.log(`   Key preview: ${scopedKey.slice(0, 12)}...`);
        console.log(`   Saved env template: ${envPath}`);
        console.log('\n📌 Next steps:');
        console.log('   1. Load env vars: export $(cat .env.local | xargs)');
        console.log('   2. Verify auth: node cli.js setup');
        console.log('   3. Create wallet: node cli.js create MyBot base-sepolia');
        break;
      }

      const envPath = writeEnvLocalTemplate('');
      console.log(`⚠️  Could not create scoped key (HTTP ${created.status}).`);
      if (created.status === 403) {
        console.log('   Provided secret is not an admin key.');
      } else if (created.status === 401) {
        console.log('   Missing or invalid admin key.');
      }
      if (created.data?.error) {
        console.log(`   Server message: ${created.data.error}`);
      }
      console.log(`   Wrote template: ${envPath}`);
      console.log('\n📌 Next steps:');
      console.log('   1. Find the bootstrap admin key in api-keys.json or startup logs');
      console.log('   2. Set AGENT_WALLET_ADMIN_KEY=<bootstrap-or-admin-key>');
      console.log('   3. Re-run: node cli.js setup --init');
      break;
    }

    case 'demo': {
      console.log('🎬 Running full demo...\n');
      
      // 1. List chains
      console.log('1️⃣ Supported Chains:');
      const { data: chains } = await listChains();
      if (chains.error) {
        console.log(`   ❌ ${chains.error}`);
        break;
      }
      console.log(`   ${chains.count} chains available\n`);
      
      // 2. Create wallet
      console.log('2️⃣ Creating wallet...');
      const { data: wallet } = await createWallet('DemoBot', 'base-sepolia');
      console.log(`   ✅ ${wallet.wallet?.address}\n`);
      
      // 3. Check balance
      console.log('3️⃣ Checking balance...');
      const { data: bal } = await getBalance(wallet.wallet?.address);
      console.log(`   Balance: ${bal.balance?.eth || 0} ETH\n`);
      
      // 4. Create identity
      console.log('4️⃣ Creating ERC-8004 identity...');
      const { data: identity } = await createIdentity(wallet.wallet?.address, 'DemoBot', 'assistant');
      console.log(`   ✅ ${identity.identity?.id}\n`);
      
      console.log('✅ Demo complete!');
      console.log('\n📌 Next steps:');
      console.log(`   1. Fund wallet: https://faucet.circle.com/`);
      console.log(`   2. Address: ${wallet.wallet?.address}`);
      console.log(`   3. Send: node cli.js send ${wallet.wallet?.address} <to> 0.001`);
      break;
    }
    
    default:
      console.log('Commands:\n');
      console.log('  WALLET');
      console.log('  create <name> [chain]       Create a new wallet');
      console.log('  import <key> <name> [chain] Import wallet from private key');
      console.log('  balance <address> [chain]   Check wallet balance');
      console.log('  balances <address>          Balance across all chains');
      console.log('  send <from> <to> <value>    Send ETH');
      console.log('  sweep <from> <to>           Send all funds');
      console.log('  estimate <from> <to> [val]  Estimate gas cost');
      console.log('  tx <hash> [chain]           Get transaction status');
      console.log('  list                        List all wallets');
      console.log('  chains                      List supported chains');
      console.log('');
      console.log('  IDENTITY (ERC-8004)');
      console.log('  identity create <wallet> <name> [type]  Create agent identity');
      console.log('  identity list                           List all identities');
      console.log('  identity get <agentId>                  Get identity details');
      console.log('  identity wallet <address>               Identities by wallet');
      console.log('');
      console.log('  ENS');
      console.log('  ens list                    List ENS records');
      console.log('  ens get <name>              Resolve ENS record');
      console.log('  ens check <name>            Check ENS availability');
      console.log('');
      console.log('  OTHER');
      console.log('  setup [--init]              Check server; --init creates scoped key + .env.local');
      console.log('  demo                        Run interactive demo');
  }
}

main().catch(console.error);
