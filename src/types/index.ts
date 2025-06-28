export interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location: string;
  salary?: string;
  createdAt: Date;
}

export interface Candidate {
  id: string;
  name: string;
  linkedinUrl: string;
  headline: string;
  location: string;
  company?: string;
  experience?: string;
  education?: string;
  skills?: string[];
  profileImage?: string;
  extractedAt: Date;
}

export interface ScoredCandidate extends Candidate {
  score: number;
  confidence: number;
  breakdown: {
    titleMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    locationMatch: number;
    industryMatch: number;
  };
  reasoning: string;
}

export interface OutreachMessage {
  candidateId: string;
  candidateName: string;
  message: string;
  subject?: string;
  personalization: {
    companyMention: boolean;
    skillMention: boolean;
    experienceMention: boolean;
  };
  generatedAt: Date;
}

export interface SearchResult {
  query: string;
  candidates: Candidate[];
  totalFound: number;
  searchTime: number;
  cached: boolean;
}

export interface JobProcessingResult {
  jobId: string;
  candidates: ScoredCandidate[];
  messages: OutreachMessage[];
  processingTime: number;
  status: 'completed' | 'failed' | 'partial';
  error?: string;
}

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  searchDelay: number;
  maxRetries: number;
}

export interface LLMConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  apiKey: string;
}

export interface DatabaseConfig {
  path: string;
  enableWAL: boolean;
  timeout: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;
  rateLimit: RateLimitConfig;
  llm: LLMConfig;
  database: DatabaseConfig;
  cache: {
    ttl: number;
    enabled: boolean;
  };
  search: {
    maxResults: number;
    maxCandidatesPerJob: number;
  };
} 