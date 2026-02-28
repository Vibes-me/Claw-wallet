export class HttpError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendError(res, { status = 400, code = 'bad_request', message = 'Bad request', details = null }) {
  const requestId = res.locals.requestId;
  return res.status(status).json({
    error: { code, message, details },
    requestId
  });
}

export function validateRequired(body, fields = []) {
  const missing = fields.filter((f) => body?.[f] == null || body?.[f] === '');
  if (missing.length) {
    throw new HttpError(400, 'validation_error', `Missing required fields: ${missing.join(', ')}`, { missing });
  }
}
