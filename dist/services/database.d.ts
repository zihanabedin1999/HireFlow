import { Candidate, ScoredCandidate, JobDescription, OutreachMessage } from '../types';
export declare class DatabaseService {
    private db;
    initialize(): Promise<void>;
    private createTables;
    saveJob(job: JobDescription): Promise<void>;
    saveCandidate(candidate: Candidate): Promise<void>;
    saveScoredCandidate(scoredCandidate: ScoredCandidate, jobId: string): Promise<void>;
    saveOutreachMessage(message: OutreachMessage, jobId: string): Promise<void>;
    getCachedData(key: string): Promise<any | null>;
    setCachedData(key: string, value: any, ttlSeconds: number): Promise<void>;
    close(): Promise<void>;
}
declare const _default: DatabaseService;
export default _default;
//# sourceMappingURL=database.d.ts.map