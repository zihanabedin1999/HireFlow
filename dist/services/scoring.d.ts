import { Candidate, ScoredCandidate, JobDescription } from '../types';
export declare class ScoringService {
    private openai;
    constructor();
    scoreCandidates(candidates: Candidate[], jobDescription: JobDescription): Promise<ScoredCandidate[]>;
    private scoreCandidate;
    private buildScoringPrompt;
    private parseScoringResponse;
    private createDefaultScore;
    private delay;
    getTopCandidates(candidates: ScoredCandidate[], limit?: number): Promise<ScoredCandidate[]>;
}
declare const _default: ScoringService;
export default _default;
//# sourceMappingURL=scoring.d.ts.map