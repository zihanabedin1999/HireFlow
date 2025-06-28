"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcingAgent = void 0;
const linkedin_search_1 = __importDefault(require("./linkedin-search"));
const scoring_1 = __importDefault(require("./scoring"));
const message_generator_1 = __importDefault(require("./message-generator"));
const database_1 = __importDefault(require("./database"));
const logger_1 = __importDefault(require("../utils/logger"));
class SourcingAgent {
    async processJob(jobDescription) {
        const startTime = Date.now();
        try {
            logger_1.default.info(`Starting job processing for: ${jobDescription.title} at ${jobDescription.company}`);
            await database_1.default.saveJob(jobDescription);
            logger_1.default.info('Searching for candidates...');
            const searchResult = await linkedin_search_1.default.searchCandidates(jobDescription.description, jobDescription.location);
            if (searchResult.candidates.length === 0) {
                logger_1.default.warn('No candidates found for this job');
                return {
                    jobId: jobDescription.id,
                    candidates: [],
                    messages: [],
                    processingTime: Date.now() - startTime,
                    status: 'failed',
                    error: 'No candidates found',
                };
            }
            logger_1.default.info(`Scoring ${searchResult.candidates.length} candidates...`);
            const scoredCandidates = await scoring_1.default.scoreCandidates(searchResult.candidates, jobDescription);
            const topCandidates = await scoring_1.default.getTopCandidates(scoredCandidates, 10);
            logger_1.default.info('Generating outreach messages...');
            const messages = await message_generator_1.default.generateOutreachMessages(topCandidates, jobDescription, 5);
            const processingTime = Date.now() - startTime;
            logger_1.default.info(`Job processing completed in ${processingTime}ms`);
            return {
                jobId: jobDescription.id,
                candidates: scoredCandidates,
                messages,
                processingTime,
                status: 'completed',
            };
        }
        catch (error) {
            logger_1.default.error('Job processing failed:', error);
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
    async processBatchJobs(jobDescriptions) {
        logger_1.default.info(`Processing ${jobDescriptions.length} jobs in batch`);
        const results = [];
        for (const job of jobDescriptions) {
            try {
                const result = await this.processJob(job);
                results.push(result);
                await this.delay(2000);
            }
            catch (error) {
                logger_1.default.error(`Failed to process job ${job.id}:`, error);
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
    async searchAndScoreOnly(jobDescription) {
        logger_1.default.info(`Searching and scoring for: ${jobDescription.title}`);
        try {
            const searchResult = await linkedin_search_1.default.searchCandidates(jobDescription.description, jobDescription.location);
            if (searchResult.candidates.length === 0) {
                return [];
            }
            const scoredCandidates = await scoring_1.default.scoreCandidates(searchResult.candidates, jobDescription);
            return scoredCandidates;
        }
        catch (error) {
            logger_1.default.error('Search and score failed:', error);
            throw error;
        }
    }
    async generateMessagesOnly(candidates, jobDescription) {
        logger_1.default.info(`Generating messages for ${candidates.length} candidates`);
        try {
            return await message_generator_1.default.generateOutreachMessages(candidates, jobDescription, 5);
        }
        catch (error) {
            logger_1.default.error('Message generation failed:', error);
            throw error;
        }
    }
    async getJobStats(jobId) {
        return {
            totalCandidates: 15,
            averageScore: 7.2,
            topScore: 9.1,
            messagesGenerated: 5,
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.SourcingAgent = SourcingAgent;
exports.default = new SourcingAgent();
//# sourceMappingURL=sourcing-agent.js.map