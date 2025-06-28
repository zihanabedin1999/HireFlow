import { JobDescription, ScoredCandidate, OutreachMessage, JobProcessingResult } from '../types';
import linkedinSearchService from './linkedin-search';
import scoringService from './scoring';
import messageGeneratorService from './message-generator';
import databaseService from './database';
import logger from '../utils/logger';

export class SourcingAgent {
  async processJob(jobDescription: JobDescription): Promise<JobProcessingResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting job processing for: ${jobDescription.title} at ${jobDescription.company}`);

      // Save job to database
      await databaseService.saveJob(jobDescription);

      // Step 1: Search for candidates
      logger.info('Searching for candidates...');
      const searchResult = await linkedinSearchService.searchCandidates(
        jobDescription.description,
        jobDescription.location
      );

      if (searchResult.candidates.length === 0) {
        logger.warn('No candidates found for this job');
        return {
          jobId: jobDescription.id,
          candidates: [],
          messages: [],
          processingTime: Date.now() - startTime,
          status: 'failed',
          error: 'No candidates found',
        };
      }

      // Step 2: Score candidates
      logger.info(`Scoring ${searchResult.candidates.length} candidates...`);
      const scoredCandidates = await scoringService.scoreCandidates(
        searchResult.candidates,
        jobDescription
      );

      // Step 3: Get top candidates
      const topCandidates = await scoringService.getTopCandidates(scoredCandidates, 10);

      // Step 4: Generate outreach messages
      logger.info('Generating outreach messages...');
      const messages = await messageGeneratorService.generateOutreachMessages(
        topCandidates,
        jobDescription,
        5
      );

      const processingTime = Date.now() - startTime;
      logger.info(`Job processing completed in ${processingTime}ms`);

      return {
        jobId: jobDescription.id,
        candidates: scoredCandidates,
        messages,
        processingTime,
        status: 'completed',
      };
    } catch (error) {
      logger.error('Job processing failed:', error);
      return {
        jobId: jobDescription.id,
        candidates: [],
        messages: [],
        processingTime: Date.now() - startTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async processBatchJobs(jobDescriptions: JobDescription[]): Promise<JobProcessingResult[]> {
    logger.info(`Processing ${jobDescriptions.length} jobs in batch`);
    
    const results: JobProcessingResult[] = [];
    
    // Process jobs sequentially to avoid rate limiting
    for (const job of jobDescriptions) {
      try {
        const result = await this.processJob(job);
        results.push(result);
        
        // Add delay between jobs to respect rate limits
        await this.delay(2000);
      } catch (error) {
        logger.error(`Failed to process job ${job.id}:`, error);
        results.push({
          jobId: job.id,
          candidates: [],
          messages: [],
          processingTime: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async searchAndScoreOnly(jobDescription: JobDescription): Promise<ScoredCandidate[]> {
    logger.info(`Searching and scoring for: ${jobDescription.title}`);

    try {
      // Search for candidates
      const searchResult = await linkedinSearchService.searchCandidates(
        jobDescription.description,
        jobDescription.location
      );

      if (searchResult.candidates.length === 0) {
        return [];
      }

      // Score candidates
      const scoredCandidates = await scoringService.scoreCandidates(
        searchResult.candidates,
        jobDescription
      );

      return scoredCandidates;
    } catch (error) {
      logger.error('Search and score failed:', error);
      throw error;
    }
  }

  async generateMessagesOnly(
    candidates: ScoredCandidate[],
    jobDescription: JobDescription
  ): Promise<OutreachMessage[]> {
    logger.info(`Generating messages for ${candidates.length} candidates`);

    try {
      return await messageGeneratorService.generateOutreachMessages(
        candidates,
        jobDescription,
        5
      );
    } catch (error) {
      logger.error('Message generation failed:', error);
      throw error;
    }
  }

  async getJobStats(jobId: string): Promise<{
    totalCandidates: number;
    averageScore: number;
    topScore: number;
    messagesGenerated: number;
  }> {
    // This would typically query the database
    // For now, return mock stats
    return {
      totalCandidates: 15,
      averageScore: 7.2,
      topScore: 9.1,
      messagesGenerated: 5,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new SourcingAgent(); 