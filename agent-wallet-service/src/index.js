import express from 'express';
import dotenv from 'dotenv';
import walletRoutes from './routes/wallet.js';
import identityRoutes from './routes/identity.js';
import ensRoutes from './routes/ens.js';
import policyRoutes from './routes/policy.js';
import { requireAuth, createApiKey, listApiKeys, revokeApiKey } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'agent-wallet-service',
    version: '0.4.0',
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
        'GET /wallet/fees',
        'GET /wallet/history',
        'GET /wallet/tx/:hash',
        'POST /wallet/estimate-gas',
        'GET /wallet/:address',
        'GET /wallet/:address/balance',
        'GET /wallet/:address/balance/all',
        'GET /wallet/:address/history',
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
      ],
      policy: [
        'GET /policy/:walletAddress',
        'PUT /policy/:walletAddress',
        'POST /policy/:walletAddress/test'
      ]
    }
  });
});

// Public routes (no auth required)
app.get('/', (req, res) => {
  res.json({
    name: 'Agent Wallet Service',
    version: '0.3.0',
    docs: 'https://github.com/agent-wallet-service',
    auth: 'API key required for most endpoints. Use X-API-Key header.'
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
app.use('/policy', requireAuth('read'), policyRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🦞 Agent Wallet Service running on port ${PORT}`);
  console.log(`   Features: multi-chain, erc-8004, api-keys`);
});
