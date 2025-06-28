import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { JobDescription, ScoredCandidate, OutreachMessage } from '../types';
import sourcingAgent from '../services/sourcing-agent';
import databaseService from '../services/database';
import config from '../config';
import logger from '../utils/logger';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../../public')));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.requestsPerMinute,
  duration: 60,
});

app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (error) {
    res.status(429).json({ error: 'Too many requests' });
  }
});

// Dashboard route
app.get('/', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process a single job
app.post('/api/jobs/process', async (req: express.Request, res: express.Response) => {
  try {
    const jobData = req.body;
    
    // Validate job data
    if (!jobData.title || !jobData.company || !jobData.description) {
      return res.status(400).json({ error: 'Missing required job fields' });
    }

    const jobDescription: JobDescription = {
      id: jobData.id || `job_${Date.now()}`,
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      requirements: jobData.requirements || [],
      location: jobData.location || 'Remote',
      salary: jobData.salary,
      createdAt: new Date(),
    };

    const result = await sourcingAgent.processJob(jobDescription);
    return res.json(result);
  } catch (error) {
    logger.error('Job processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Process multiple jobs
app.post('/api/jobs/batch', async (req: express.Request, res: express.Response) => {
  try {
    const jobsData = req.body.jobs;
    
    if (!Array.isArray(jobsData)) {
      return res.status(400).json({ error: 'Jobs must be an array' });
    }

    const jobDescriptions: JobDescription[] = jobsData.map((jobData, index) => ({
      id: jobData.id || `job_${Date.now()}_${index}`,
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      requirements: jobData.requirements || [],
      location: jobData.location || 'Remote',
      salary: jobData.salary,
      createdAt: new Date(),
    }));

    const results = await sourcingAgent.processBatchJobs(jobDescriptions);
    return res.json({ results });
  } catch (error) {
    logger.error('Batch job processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Search and score candidates only
app.post('/api/candidates/search', async (req: express.Request, res: express.Response) => {
  try {
    const { jobDescription } = req.body;
    
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    const candidates = await sourcingAgent.searchAndScoreOnly(jobDescription);
    return res.json({ candidates });
  } catch (error) {
    logger.error('Candidate search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate messages for existing candidates
app.post('/api/messages/generate', async (req: express.Request, res: express.Response) => {
  try {
    const { candidates, jobDescription } = req.body;
    
    if (!candidates || !jobDescription) {
      return res.status(400).json({ error: 'Candidates and job description are required' });
    }

    const messages = await sourcingAgent.generateMessagesOnly(candidates, jobDescription);
    return res.json({ messages });
  } catch (error) {
    logger.error('Message generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job statistics
app.get('/api/jobs/:jobId/stats', async (req: express.Request, res: express.Response) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    const stats = await sourcingAgent.getJobStats(jobId);
    return res.json(stats);
  } catch (error) {
    logger.error('Stats retrieval error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

export async function startServer(): Promise<void> {
  try {
    // Initialize database
    await databaseService.initialize();
    
    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Dashboard available at: http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

export default app; 