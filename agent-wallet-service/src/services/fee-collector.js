/**
 * Fee Collection Service
 * 
 * Collects a small fee on each transaction
 */

// Treasury address (where fees go)
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || null;

// Fee percentage (0.5% = 50 basis points)
const FEE_BASIS_POINTS = parseInt(process.env.FEE_BASIS_POINTS || '50');

/**
 * Calculate fee for a transaction
 * @param {string} value - Amount in ETH
 * @returns {{ fee: string, netValue: string }}
 */
export function calculateFee(value) {
  const amount = parseFloat(value);
  const feeAmount = amount * (FEE_BASIS_POINTS / 10000);
  const netAmount = amount - feeAmount;
  
  return {
    fee: feeAmount.toFixed(8),
    netValue: netAmount.toFixed(8),
    feePercent: `${FEE_BASIS_POINTS / 100}%`,
    treasury: TREASURY_ADDRESS || 'Not configured'
  };
}

/**
 * Get fee configuration
 */
export function getFeeConfig() {
  return {
    feePercent: `${FEE_BASIS_POINTS / 100}%`,
    feeBasisPoints: FEE_BASIS_POINTS,
    treasuryAddress: TREASURY_ADDRESS || 'Not configured',
    minFee: '0.00001 ETH',
    enabled: TREASURY_ADDRESS !== null
  };
}
