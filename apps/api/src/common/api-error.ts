import { Response } from 'express';
import { getTenantContext } from './tenant-context.js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function sendSuccessResponse<T>(res: Response, data: T, statusCode = 200) {
  const context = getTenantContext();
  const requestId = context?.requestId || `req_${Date.now()}`;
  res.setHeader('X-Request-ID', requestId);
  return res.status(statusCode).json({
    data,
    requestId,
  });
}

export function sendErrorResponse(res: Response, error: any) {
  const context = getTenantContext();
  const requestId = context?.requestId || `req_${Date.now()}`;
  res.setHeader('X-Request-ID', requestId);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        fields: error.fields,
        requestId,
      },
    });
  }

  console.error('Unhandled Server Error:', error);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
      requestId,
    },
  });
}
