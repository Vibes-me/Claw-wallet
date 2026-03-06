/**
 * Error Classes for Claw Wallet API
 * 
 * Provides standardized error handling with error codes across all routes.
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: this.message,
      error_code: this.errorCode,
      ...(this.details && { details: this.details }),
      timestamp: this.timestamp
    };
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Permission denied', requiredPermission = null) {
    super(message, 403, 'PERMISSION_DENIED', { requiredPermission });
    this.name = 'AuthorizationError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Resource', identifier = null) {
    super(`${resource} not found${identifier ? `: ${identifier}` : ''}`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends ApiError {
  constructor(retryAfter = 60, limit = 100, remaining = 0) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter, limit, remaining });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(service = 'Service', reason = null) {
    super(`${service} unavailable${reason ? `: ${reason}` : ''}`, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Wallet-specific Errors
 */
export class WalletNotFoundError extends NotFoundError {
  constructor(address) {
    super('Wallet', address);
    this.errorCode = 'WALLET_NOT_FOUND';
  }
}

export class WalletAlreadyExistsError extends ConflictError {
  constructor(address) {
    super(`Wallet already exists: ${address}`, { address });
    this.name = 'WalletAlreadyExistsError';
  }
}

export class InsufficientFundsError extends ApiError {
  constructor(required, available) {
    super('Insufficient funds', 400, 'INSUFFICIENT_FUNDS', { required, available });
    this.name = 'InsufficientFundsError';
  }
}

/**
 * Policy-specific Errors
 */
export class PolicyBlockedError extends ApiError {
  constructor(reason, policyContext = null) {
    super(`Transaction blocked by policy: ${reason}`, 402, 'POLICY_BLOCKED', { reason, policyContext });
    this.name = 'PolicyBlockedError';
  }
}

export class RequiresApprovalError extends ApiError {
  constructor(pendingApprovalId, expiresAt = null) {
    super('Transaction requires human approval', 202, 'REQUIRES_APPROVAL', { pendingApprovalId, expiresAt });
    this.name = 'RequiresApprovalError';
  }
}

/**
 * Chain-specific Errors
 */
export class UnsupportedChainError extends ValidationError {
  constructor(chain, supportedChains = []) {
    super(`Unsupported chain: ${chain}`, { supportedChains });
    this.errorCode = 'UNSUPPORTED_CHAIN';
  }
}

export class RpcUnavailableError extends ServiceUnavailableError {
  constructor(chain) {
    super('RPC', `All RPC endpoints failed for chain ${chain}`);
    this.errorCode = 'RPC_UNAVAILABLE';
  }
}

/**
 * Error Code Registry
 */
export const ErrorCodes = {
  // Authentication
  API_KEY_REQUIRED: 'API_KEY_REQUIRED',
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  
  // Authorization
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ADMIN_PERMISSION_REQUIRED: 'ADMIN_PERMISSION_REQUIRED',
  WRITE_PERMISSION_REQUIRED: 'WRITE_PERMISSION_REQUIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_CHAIN: 'INVALID_CHAIN',
  UNSUPPORTED_CHAIN: 'UNSUPPORTED_CHAIN',
  INVALID_RPC_URL: 'INVALID_RPC_URL',
  
  // Not Found
  NOT_FOUND: 'NOT_FOUND',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  IDENTITY_NOT_FOUND: 'IDENTITY_NOT_FOUND',
  API_KEY_NOT_FOUND: 'API_KEY_NOT_FOUND',
  PENDING_APPROVAL_NOT_FOUND: 'PENDING_APPROVAL_NOT_FOUND',
  
  // Conflict
  WALLET_EXISTS: 'WALLET_EXISTS',
  IDENTITY_EXISTS: 'IDENTITY_EXISTS',
  
  // Business Logic
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  POLICY_BLOCKED: 'POLICY_BLOCKED',
  REQUIRES_APPROVAL: 'REQUIRES_APPROVAL',
  DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
  PER_TX_LIMIT_EXCEEDED: 'PER_TX_LIMIT_EXCEEDED',
  RECIPIENT_BLOCKED: 'RECIPIENT_BLOCKED',
  RECIPIENT_NOT_ALLOWED: 'RECIPIENT_NOT_ALLOWED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Infrastructure
  RPC_UNAVAILABLE: 'RPC_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  
  // BYO RPC
  BYO_RPC_REQUIRED: 'BYO_RPC_REQUIRED',
  BYO_RPC_INVALID: 'BYO_RPC_INVALID',
  BYO_RPC_HOST_NOT_ALLOWED: 'BYO_RPC_HOST_NOT_ALLOWED'
};

/**
 * Error message templates for common scenarios
 */
export const ErrorMessages = {
  API_KEY_REQUIRED: 'API key required. Include X-API-Key header.',
  API_KEY_INVALID: 'Invalid API key. Ensure the key exists and has not been revoked.',
  
  BYO_RPC_REQUIRED: 'Free-tier API keys must provide a BYO RPC URL. Use X-RPC-URL header, ?rpcUrl query param, or rpcUrl in request body.',
  BYO_RPC_MULTI_CHAIN_NOT_SUPPORTED: 'BYO RPC does not support /balance/all. Use /wallet/:address/balance?chain=... instead.',
  
  UNSUPPORTED_CHAIN: (chain, supported) => `Unsupported chain: ${chain}. Supported: ${supported.join(', ')}`,
  
  WALLET_NOT_FOUND: (address) => `Wallet not found: ${address}`,
  IDENTITY_NOT_FOUND: (id) => `Identity not found: ${id}`,
  
  RATE_LIMIT_EXCEEDED: (retryAfter) => `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
  
  RPC_ALL_FAILED: (chain) => `All RPC endpoints failed for chain ${chain}. Please try again later.`
};

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(error, includeStack = false) {
  if (error instanceof ApiError) {
    return {
      ...error.toJSON(),
      ...(includeStack && { stack: error.stack })
    };
  }
  
  // Handle unknown errors
  return {
    error: error.message || 'Internal server error',
    error_code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(includeStack && { stack: error.stack })
  };
}

export default {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  WalletNotFoundError,
  WalletAlreadyExistsError,
  InsufficientFundsError,
  PolicyBlockedError,
  RequiresApprovalError,
  UnsupportedChainError,
  RpcUnavailableError,
  ErrorCodes,
  ErrorMessages,
  createErrorResponse
};
