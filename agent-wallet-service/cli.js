#!/usr/bin/env node

/**
 * Agent Wallet CLI
 * 
 * Complete CLI for wallet + identity management
 */

const API = 'http://localhost:3000';

// ============================================================
// WALLET COMMANDS
// ============================================================

async function createWallet(name, chain = 'base-sepolia') {
  const res = await fetch(`${API}/wallet/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentName: name, chain })
  });
  return res.json();
}

async function importWallet(privateKey, name, chain) {
  const res = await fetch(`${API}/wallet/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privateKey, agentName: name, chain })
  });
  return res.json();
}

async function getBalance(address, chain) {
  const url = chain 
    ? `${API}/wallet/${address}/balance?chain=${chain}`
    : `${API}/wallet/${address}/balance`;
  const res = await fetch(url);
  return res.json();
}

async function getAllBalances(address) {
  const res = await fetch(`${API}/wallet/${address}/balance/all`);
  return res.json();
}

async function sendTransaction(from, to, value, chain) {
  const res = await fetch(`${API}/wallet/${from}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, value, chain })
  });
  return res.json();
}

async function listWallets() {
  const res = await fetch(`${API}/wallet/list`);
  return res.json();
}

async function sweepWallet(from, to, chain) {
  const res = await fetch(`${API}/wallet/${from}/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, chain })
  });
  return res.json();
}

async function estimateGas(from, to, value, chain) {
  const res = await fetch(`${API}/wallet/estimate-gas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, value, chain })
  });
  return res.json();
}

async function listChains() {
  const res = await fetch(`${API}/wallet/chains`);
  return res.json();
}

async function getTxStatus(hash, chain) {
  const res = await fetch(`${API}/wallet/tx/${hash}?chain=${chain || 'base-sepolia'}`);
  return res.json();
}


async function exportHistory({ format = 'csv', from, to, wallet, agent, chain }) {
  const params = new URLSearchParams({ format });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (wallet) params.set('wallet', wallet);
  if (agent) params.set('agent', agent);
  if (chain) params.set('chain', chain);

  const res = await fetch(`${API}/wallet/history/export?${params.toString()}`);
  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();

  if (!res.ok) {
    let error = body;
    try {
      error = JSON.parse(body).error || error;
    } catch {}
    throw new Error(error);
  }

  return { contentType, body };
}

function parseFlagArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
    out[key] = value;
  }
  return out;
}

// ============================================================
// IDENTITY COMMANDS
// ============================================================

async function createIdentity(walletAddress, name, type = 'assistant') {
  const res = await fetch(`${API}/identity/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      walletAddress, 
      agentName: name, 
      agentType: type,
      capabilities: ['wallet', 'messaging']
    })
  });
  return res.json();
}

async function listIdentities() {
  const res = await fetch(`${API}/identity/list`);
  return res.json();
}

async function getIdentity(agentId) {
  const res = await fetch(`${API}/identity/${agentId}`);
  return res.json();
}

async function getIdentitiesByWallet(address) {
  const res = await fetch(`${API}/identity/wallet/${address}`);
  return res.json();
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
      const result = await createWallet(name, chain);
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
      const result = await importWallet(privateKey, name, chain);
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
      const result = await getBalance(address, chain);
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
      const result = await getAllBalances(address);
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
      const result = await sendTransaction(from, to, value, chain);
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
      const result = await sweepWallet(from, to, chain);
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
      const result = await estimateGas(from, to, value, chain);
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
      const result = await getTxStatus(hash, chain);
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
      const result = await listWallets();
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
      const result = await listChains();
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
          const result = await createIdentity(address, name, type);
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
          const result = await listIdentities();
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
          const result = await getIdentity(agentId);
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
          const result = await getIdentitiesByWallet(address);
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
    

    case 'export': {
      const [subCmd, ...subArgs] = args;
      if (subCmd !== 'history') {
        console.log('Usage: cli.js export history --format csv|jsonl --from <ISO> --to <ISO> [--wallet <address>] [--agent <name>] [--chain <chain>]');
        break;
      }

      const flags = parseFlagArgs(subArgs);
      const format = flags.format || 'csv';
      if (!['csv', 'jsonl'].includes(format)) {
        console.log('❌ Error: --format must be csv or jsonl');
        break;
      }

      try {
        const result = await exportHistory({
          format,
          from: flags.from,
          to: flags.to,
          wallet: flags.wallet,
          agent: flags.agent,
          chain: flags.chain
        });
        console.log(result.body);
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
      break;
    }

    case 'demo': {
      console.log('🎬 Running full demo...\n');
      
      // 1. List chains
      console.log('1️⃣ Supported Chains:');
      const chains = await listChains();
      console.log(`   ${chains.count} chains available\n`);
      
      // 2. Create wallet
      console.log('2️⃣ Creating wallet...');
      const wallet = await createWallet('DemoBot', 'base-sepolia');
      console.log(`   ✅ ${wallet.wallet?.address}\n`);
      
      // 3. Check balance
      console.log('3️⃣ Checking balance...');
      const bal = await getBalance(wallet.wallet?.address);
      console.log(`   Balance: ${bal.balance?.eth || 0} ETH\n`);
      
      // 4. Create identity
      console.log('4️⃣ Creating ERC-8004 identity...');
      const identity = await createIdentity(wallet.wallet?.address, 'DemoBot', 'assistant');
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
      console.log('  export history --format ... Export tx history as csv/jsonl');
      console.log('');
      console.log('  IDENTITY (ERC-8004)');
      console.log('  identity create <wallet> <name> [type]  Create agent identity');
      console.log('  identity list                           List all identities');
      console.log('  identity get <agentId>                  Get identity details');
      console.log('  identity wallet <address>               Identities by wallet');
      console.log('');
      console.log('  OTHER');
      console.log('  demo                        Run interactive demo');
  }
}

main().catch(console.error);
