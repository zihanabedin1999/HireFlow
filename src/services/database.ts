import sqlite3 from 'sqlite3';
import { Candidate, ScoredCandidate, JobDescription, OutreachMessage } from '../types';
import config from '../config';
import logger from '../utils/logger';

export class DatabaseService {
  private db: sqlite3.Database | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          throw err;
        }
        logger.info('Database opened successfully');
      });

      await this.createTables();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT NOT NULL,
        location TEXT NOT NULL,
        salary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        linkedin_url TEXT UNIQUE NOT NULL,
        headline TEXT,
        location TEXT,
        company TEXT,
        experience TEXT,
        education TEXT,
        skills TEXT,
        profile_image TEXT,
        extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scored_candidates (
        candidate_id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        score REAL NOT NULL,
        confidence REAL NOT NULL,
        title_match REAL NOT NULL,
        skills_match REAL NOT NULL,
        experience_match REAL NOT NULL,
        location_match REAL NOT NULL,
        industry_match REAL NOT NULL,
        reasoning TEXT,
        scored_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS outreach_messages (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        job_id TEXT NOT NULL,
        message TEXT NOT NULL,
        subject TEXT,
        company_mention BOOLEAN DEFAULT FALSE,
        skill_mention BOOLEAN DEFAULT FALSE,
        experience_mention BOOLEAN DEFAULT FALSE,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at DATETIME NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_candidates_linkedin_url ON candidates (linkedin_url);
      CREATE INDEX IF NOT EXISTS idx_scored_candidates_job_id ON scored_candidates (job_id);
      CREATE INDEX IF NOT EXISTS idx_outreach_messages_candidate_id ON outreach_messages (candidate_id);
      CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache (expires_at);
    `;

    return new Promise((resolve, reject) => {
      this.db!.exec(createTablesSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async saveJob(job: JobDescription): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO jobs (id, title, company, description, requirements, location, salary)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [job.id, job.title, job.company, job.description, JSON.stringify(job.requirements), job.location, job.salary],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async saveCandidate(candidate: Candidate): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO candidates (id, name, linkedin_url, headline, location, company, experience, education, skills, profile_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          candidate.id,
          candidate.name,
          candidate.linkedinUrl,
          candidate.headline,
          candidate.location,
          candidate.company,
          candidate.experience,
          candidate.education,
          JSON.stringify(candidate.skills),
          candidate.profileImage,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async saveScoredCandidate(scoredCandidate: ScoredCandidate, jobId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO scored_candidates 
         (candidate_id, job_id, score, confidence, title_match, skills_match, experience_match, location_match, industry_match, reasoning)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scoredCandidate.id,
          jobId,
          scoredCandidate.score,
          scoredCandidate.confidence,
          scoredCandidate.breakdown.titleMatch,
          scoredCandidate.breakdown.skillsMatch,
          scoredCandidate.breakdown.experienceMatch,
          scoredCandidate.breakdown.locationMatch,
          scoredCandidate.breakdown.industryMatch,
          scoredCandidate.reasoning,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async saveOutreachMessage(message: OutreachMessage, jobId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO outreach_messages (id, candidate_id, job_id, message, subject, company_mention, skill_mention, experience_mention)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.candidateId,
          message.candidateId,
          jobId,
          message.message,
          message.subject,
          message.personalization.companyMention,
          message.personalization.skillMention,
          message.personalization.experienceMention,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT value FROM cache WHERE key = ? AND expires_at > datetime("now")',
        [key],
        (err, row: { value: string } | undefined) => {
          if (err) reject(err);
          else resolve(row ? JSON.parse(row.value) : null);
        }
      );
    });
  }

  async setCachedData(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    
    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), expiresAt],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }
}

export default new DatabaseService(); 