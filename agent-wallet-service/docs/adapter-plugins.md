# Adapter Plugin Development Guide

This service resolves chain operations through an adapter contract and registry.

## Adapter contract

Create adapters under `src/services/adapters/` and implement all required methods:

- `getBalance({ address, chain, provider })`
- `estimateGas({ from, to, value, data, chain, provider })`
- `sendTransaction({ from, to, value, data, chain, provider, account })`
- `getReceipt({ hash, chain, provider })`
- `supportsFeature(feature)`

The canonical contract lives in `src/services/adapters/types.js`.

## Minimal template adapter

```js
// src/services/adapters/my-adapter.js
const myAdapter = {
  id: 'my-adapter',

  async getBalance({ address, chain, provider }) {
    return { chain, provider, wei: '0', eth: '0' };
  },

  async estimateGas({ from, to, value = '0', data = '0x', chain, provider }) {
    return {
      chain,
      provider,
      gasUnits: '0',
      gasPrice: '0 ETH',
      estimatedCost: '0 ETH',
      estimatedCostWei: '0'
    };
  },

  async sendTransaction({ from, to, value = '0', data = '0x', chain, provider }) {
    return { hash: '0x', from, to, value, data, chain, provider };
  },

  async getReceipt({ hash, chain, provider }) {
    return { hash, status: 'pending', chain, provider };
  },

  supportsFeature(feature) {
    return ['getBalance', 'estimateGas', 'sendTransaction', 'getReceipt'].includes(feature);
  }
};

export default myAdapter;
```

## Registering an adapter

Use `registerAdapter` in `src/services/adapters/registry.js`:

```js
registerAdapter({ chain: 'base-sepolia', provider: 'public', adapter: myAdapter });
```

You can register by chain/provider or with `*` wildcards.

## Compatibility checklist

Before shipping a plugin:

- [ ] Adapter passes `assertAdapterContract` (all required methods exist).
- [ ] `sendTransaction` returns `hash`, `from`, `to`, `value`, `data`, `chain`, `provider`.
- [ ] `getReceipt` handles pending transactions gracefully.
- [ ] Adapter handles provider options: `alchemy`, `public`, `custom`.
- [ ] Network/RPC failures have clear error messages.
- [ ] Adapter sets deterministic explorer URLs (if supported).
- [ ] At least one end-to-end send + receipt flow tested on a testnet.
