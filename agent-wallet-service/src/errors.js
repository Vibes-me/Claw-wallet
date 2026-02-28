export class AppError extends Error {
  constructor({ status = 500, code = 'INTERNAL_ERROR', message = 'Internal server error', details } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function classifyError(error) {
  if (error instanceof AppError) {
    return error;
  }

  const message = error?.message || 'Internal server error';

  if (message.toLowerCase().includes('not found')) {
    return new AppError({ status: 404, code: 'NOT_FOUND', message });
  }

  if (
    message.toLowerCase().includes('already exists') ||
    message.toLowerCase().includes('conflict')
  ) {
    return new AppError({ status: 409, code: 'CONFLICT', message });
  }

  return new AppError({ status: 500, code: 'INTERNAL_ERROR', message });
}
