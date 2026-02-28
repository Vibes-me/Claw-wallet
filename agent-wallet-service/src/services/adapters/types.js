/**
 * Adapter contract for chain integrations.
 *
 * Implementations must provide:
 * - getBalance({ address, chain, provider })
 * - estimateGas({ from, to, value, data, chain, provider })
 * - sendTransaction({ from, to, value, data, chain, provider, privateKey })
 * - getReceipt({ hash, chain, provider })
 * - supportsFeature(feature)
 */

export const ADAPTER_METHODS = [
  'getBalance',
  'estimateGas',
  'sendTransaction',
  'getReceipt',
  'supportsFeature'
];

export function assertAdapterContract(adapter, adapterName = 'unknown') {
  for (const method of ADAPTER_METHODS) {
    if (typeof adapter?.[method] !== 'function') {
      throw new Error(
        `Adapter "${adapterName}" is missing required method: ${method}`
      );
    }
  }

  return adapter;
}
