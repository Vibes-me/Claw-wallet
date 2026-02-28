import express from 'express';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.js';
import identityRoutes from './routes/identity.js';
import ensRoutes from './routes/ens.js';
import { requireAuth, createApiKey, listApiKeys, revokeApiKey, getOnboardingState } from './middleware/auth.js';
import pkg from '../package.json' with { type: 'json' };
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.set('X-Request-Id', requestId);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'agent-wallet-service',
    version: pkg.version,
    features: ['multi-chain', 'erc-8004', 'api-keys', 'ens', 'policy-engine'],
    chains: {
      testnets: ['base-sepolia', 'ethereum-sepolia', 'optimism-sepolia', 'arbitrum-sepolia'],
      mainnets: ['base', 'ethereum', 'polygon', 'optimism', 'arbitrum']
    },
    endpoints: {
      wallet: [
        'POST /wallet/create',
        'POST /wallet/import',
        'GET /wallet/list',
        'GET /wallet/chains',
        'GET /wallet/policy/:address',
        'PUT /wallet/policy/:address',
        'POST /wallet/policy/:address/evaluate',
        'GET /wallet/fees',
        'GET /wallet/history',
        'GET /wallet/tx/:hash',
        'POST /wallet/estimate-gas',
        'GET /wallet/:address',
        'GET /wallet/:address/balance',
        'GET /wallet/:address/balance/all',
        'GET /wallet/:address/history',
        'POST /wallet/:address/preflight',
        'POST /wallet/:address/send',
        'POST /wallet/:address/sweep'
      ],
      identity: [
        'POST /identity/create',
        'GET /identity/list',
        'GET /identity/types',
        'GET /identity/capabilities',
        'GET /identity/wallet/:address',
        'GET /identity/:agentId',
        'PATCH /identity/:agentId/capability',
        'POST /identity/:agentId/revoke',
        'GET /identity/:agentId/credential'
      ],
      ens: [
        'GET /ens/check/:name',
        'GET /ens/price/:name',
        'POST /ens/register',
        'GET /ens/list',
        'GET /ens/:name'
      ]
    }
  });
});

// Public routes (no auth required)
app.get('/', (req, res) => {
  res.json({
    name: 'Agent Wallet Service',
    version: pkg.version,
    docs: 'https://github.com/agent-wallet-service',
    auth: 'API key required for most endpoints. Use X-API-Key header.'
  });
});


app.get('/onboarding', (req, res) => {
  const state = getOnboardingState();
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    service: 'agent-wallet-service',
    hasApiKeys: state.hasApiKeys,
    apiKeyCount: state.apiKeyCount,
    keyPreview: state.firstKeyPrefix,
    docs: state.docsPath,
    nextSteps: state.hasApiKeys
      ? [
          'Use your existing API key with header: X-API-Key: sk_...',
          'Create a wallet with POST /wallet/create',
          'Check balances with GET /wallet/:address/balance'
        ]
      : [
          'Start the service once to bootstrap an admin API key',
          'Set SHOW_BOOTSTRAP_SECRET=true to print full bootstrap key if needed',
          'Use POST /api-keys to create scoped keys for apps/bots'
        ],
    examples: {
      createApiKey: {
        description: 'Create a new API key (admin auth required)',
        curl: `curl -X POST ${baseUrl}/api-keys \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <ADMIN_API_KEY>" \
  -d '{"name":"my-bot","permissions":["read","write"]}'`
      },
      createWallet: {
        description: 'Create a wallet on Base Sepolia',
        curl: `curl -X POST ${baseUrl}/wallet/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <API_KEY>" \
  -d '{"agentName":"MyBot","chain":"base-sepolia"}'`
      },
      checkBalance: {
        description: 'Check wallet balance',
        curl: `curl ${baseUrl}/wallet/<ADDRESS>/balance \
  -H "X-API-Key: <API_KEY>"`
      }
    }
  });
});

// API Key management (admin only)
app.post('/api-keys', requireAuth('admin'), (req, res) => {
  const { name, permissions } = req.body;
  const key = createApiKey(name, permissions);
  res.json({ success: true, key });
});

app.get('/api-keys', requireAuth('admin'), (req, res) => {
  res.json({ keys: listApiKeys() });
});

app.delete('/api-keys/:prefix', requireAuth('admin'), (req, res) => {
  const revoked = revokeApiKey(req.params.prefix);
  res.json({ success: revoked });
});

// Protected routes (auth required)
app.use('/wallet', requireAuth('read'), walletRoutes);
app.use('/identity', requireAuth('read'), identityRoutes);
app.use('/ens', requireAuth('read'), ensRoutes);

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'internal_error';
  const message = err.message || 'Internal server error';
  const details = err.details || null;

  console.error(`[${req.requestId}]`, err);
  res.status(status).json({
    error: { code, message, details },
    requestId: req.requestId
  });
});

app.listen(PORT, () => {
  console.log(`🦞 Agent Wallet Service running on port ${PORT}`);
  console.log(`   Features: multi-chain, erc-8004, api-keys`);
});
