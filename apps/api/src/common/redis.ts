import { Redis } from 'ioredis';
import { Logger } from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisClient.on('error', (err) => {
  Logger.error('Redis connection error:', err);
});
