import dotenv from 'dotenv';
import { AppConfig, RateLimitConfig, LLMConfig, DatabaseConfig } from '../types';

dotenv.config();

const validateRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  rateLimit: {
    requestsPerMinute: parseInt(process.env.REQUESTS_PER_MINUTE || '30', 10),
    searchDelay: parseInt(process.env.SEARCH_DELAY || '1000', 10),
    maxRetries: 3,
  },
  
  llm: {
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    apiKey: validateRequiredEnv('OPENAI_API_KEY'),
  },
  
  database: {
    path: process.env.DATABASE_PATH || './data/sourcing.db',
    enableWAL: true,
    timeout: 30000,
  },
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    enabled: process.env.CACHE_ENABLED === 'true',
  },
  
  search: {
    maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || '50', 10),
    maxCandidatesPerJob: parseInt(process.env.MAX_CANDIDATES_PER_JOB || '20', 10),
  },
};

export const SERPAPI_KEY = process.env.SERPAPI_KEY;
export const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

export default config; 