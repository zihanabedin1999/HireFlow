import { Candidate, JobDescription } from '../types';
export declare class CustomDatabaseService {
    private candidates;
    constructor();
    private initializeSampleData;
    searchCandidates(jobDescription: JobDescription): Promise<Candidate[]>;
    private calculateMatchScore;
    getAllCandidates(): Promise<Candidate[]>;
    getCandidateById(id: string): Promise<Candidate | null>;
    addCandidate(candidate: Candidate): Promise<void>;
    getDatabaseStats(): Promise<{
        totalCandidates: number;
        lastUpdated: Date;
    }>;
}
declare const _default: CustomDatabaseService;
export default _default;
//# sourceMappingURL=custom-database.d.ts.map