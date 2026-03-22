import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient = null;

export async function initRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.on('connect', () => logger.info('Redis connected'));

  await redisClient.connect();
  return redisClient;
}

export function getRedis() {
  return redisClient;
}

export default redisClient;
