import { JobDescription, ScoredCandidate, OutreachMessage, JobProcessingResult } from '../types';
export declare class SourcingAgent {
    processJob(jobDescription: JobDescription): Promise<JobProcessingResult>;
    processBatchJobs(jobDescriptions: JobDescription[]): Promise<JobProcessingResult[]>;
    searchAndScoreOnly(jobDescription: JobDescription): Promise<ScoredCandidate[]>;
    generateMessagesOnly(candidates: ScoredCandidate[], jobDescription: JobDescription): Promise<OutreachMessage[]>;
    getJobStats(jobId: string): Promise<{
        totalCandidates: number;
        averageScore: number;
        topScore: number;
        messagesGenerated: number;
    }>;
    private delay;
}
declare const _default: SourcingAgent;
export default _default;
//# sourceMappingURL=sourcing-agent.d.ts.map