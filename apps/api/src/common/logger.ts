import { getTenantContext } from './tenant-context.js';

export class Logger {
  private static formatMessage(level: string, message: string, meta?: Record<string, any>) {
    const context = getTenantContext();
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      requestId: context?.requestId,
      dealerId: context?.dealerId,
      userId: context?.userId,
      ...meta,
    });
  }

  static info(message: string, meta?: Record<string, any>) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message: string, meta?: Record<string, any>) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message: string, error?: any, meta?: Record<string, any>) {
    console.error(
      this.formatMessage('ERROR', message, {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ...meta,
      })
    );
  }
}
