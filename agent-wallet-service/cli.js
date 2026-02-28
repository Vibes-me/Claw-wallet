#!/usr/bin/env node

/**
 * Agent Wallet CLI
 * 
 * Complete CLI for wallet + identity management
 */

const API = 'http://localhost:3000';


function getOption(args, name) {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function hasFlag(args, flag) {
  return args.includes(`--${flag}`);
}

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


async function preflightTransaction(payload) {
  const res = await fetch(`${API}/wallet/preflight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function sendTransaction(from, to, value, chain, options = {}) {
  const res = await fetch(`${API}/wallet/${from}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, value, chain, ...options })
  });
  return res.json();
}

async function listWallets() {
  const res = await fetch(`${API}/wallet/list`);
  return res.json();
}

async function sweepWallet(from, to, chain, options = {}) {
  const res = await fetch(`${API}/wallet/${from}/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, chain, ...options })
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
      const [from, to, value, chain, ...opts] = args;
      if (!from || !to || !value) {
        console.log('Usage: cli.js send <from> <to> <value> [chain] [--dry-run] [--allow-self-send] [--max-fee-cap=<eth>] [--gas-guard-bps=<bps>]');
        break;
      }

      const dryRun = hasFlag(opts, 'dry-run');
      const options = {
        dryRun,
        allowSelfSend: hasFlag(opts, 'allow-self-send'),
        maxFeeCap: getOption(opts, 'max-fee-cap'),
        gasGuardBps: getOption(opts, 'gas-guard-bps') ? parseInt(getOption(opts, 'gas-guard-bps'), 10) : undefined
      };

      console.log(dryRun ? `Simulating send of ${value} ETH...` : `Sending ${value} ETH...`);
      const result = await sendTransaction(from, to, value, chain, options);
      if (result.success && result.dryRun) {
        console.log('🧪 Dry run preflight:');
        console.log(`   Chain: ${result.preflight.chain}`);
        console.log(`   Estimated Fee: ${result.preflight.estimatedFee} ETH`);
        console.log(`   Total Impact: ${result.preflight.totalImpact} ETH`);
        console.log(`   Post Balance: ${result.preflight.projectedPostBalance} ETH`);
      } else if (result.success) {
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
      const [from, to, chain, ...opts] = args;
      if (!from || !to) {
        console.log('Usage: cli.js sweep <from> <to> [chain] [--dry-run] [--max-fee-cap=<eth>] [--gas-guard-bps=<bps>]');
        break;
      }
      const dryRun = hasFlag(opts, 'dry-run');
      const options = {
        dryRun,
        maxFeeCap: getOption(opts, 'max-fee-cap'),
        gasGuardBps: getOption(opts, 'gas-guard-bps') ? parseInt(getOption(opts, 'gas-guard-bps'), 10) : undefined
      };
      console.log(dryRun ? `Simulating sweep from ${from} to ${to}...` : `Sweeping all funds from ${from} to ${to}...`);
      const result = await sweepWallet(from, to, chain, options);
      if (result.success && result.dryRun) {
        console.log('🧪 Sweep dry run preflight:');
        console.log(`   Chain: ${result.preflight.chain}`);
        console.log(`   Estimated Fee: ${result.preflight.estimatedFee} ETH`);
        console.log(`   Projected Send: ${result.preflight.projectedSend} ETH`);
      } else if (result.success) {
        console.log(`✅ Sweep complete!`);
        console.log(`   Sent: ${result.sweep.amountSent} ETH`);
        console.log(`   Gas: ${result.sweep.gasCost} ETH`);
        console.log(`   Hash: ${result.sweep.hash}`);
      } else {
        console.log(`❌ Error: ${result.error}`);
      }
      break;
    }
    
    case 'preflight': {
      const [from, to, value, chain, ...opts] = args;
      if (!from || !to || !value) {
        console.log('Usage: cli.js preflight <from> <to> <value> [chain] [--max-fee-cap=<eth>] [--gas-guard-bps=<bps>]');
        break;
      }

      const result = await preflightTransaction({
        from,
        to,
        value,
        chain,
        maxFeeCap: getOption(opts, 'max-fee-cap'),
        gasGuardBps: getOption(opts, 'gas-guard-bps') ? parseInt(getOption(opts, 'gas-guard-bps'), 10) : undefined
      });

      if (result.success) {
        console.log('Preflight:');
        console.log(`   Chain: ${result.preflight.chain}`);
        console.log(`   Gas: ${result.preflight.estimatedGas}`);
        console.log(`   Fee: ${result.preflight.estimatedFee} ETH`);
        console.log(`   Impact: ${result.preflight.totalImpact} ETH`);
        console.log(`   Post Balance: ${result.preflight.projectedPostBalance} ETH`);
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
      console.log('  send <from> <to> <value>    Send ETH (supports --dry-run)');
      console.log('  sweep <from> <to>           Send all funds (supports --dry-run)');
      console.log('  estimate <from> <to> [val]  Estimate gas cost');
      console.log('  preflight <from> <to> <val> Preflight send projection');
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
      console.log('  OTHER');
      console.log('  demo                        Run interactive demo');
  }
}

main().catch(console.error);
