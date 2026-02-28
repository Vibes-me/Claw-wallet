import { z } from 'zod';
import { AppError } from '../errors.js';

const formatZodIssues = (issues) => issues.map((issue) => ({
  path: issue.path.join('.'),
  message: issue.message
}));

export function validateRequest({ body, query, params }) {
  return (req, _res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }

      if (query) {
        req.query = query.parse(req.query);
      }

      if (params) {
        req.params = params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError({
          status: 400,
          code: 'INVALID_INPUT',
          message: 'Invalid request input',
          details: formatZodIssues(error.issues)
        }));
      }

      return next(error);
    }
  };
}

export const commonSchemas = {
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM address'),
  chain: z.string().min(1)
};
