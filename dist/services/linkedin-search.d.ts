import { Candidate, SearchResult } from '../types';
export declare class LinkedInSearchService {
    private readonly baseUrl;
    private readonly userAgent;
    searchCandidates(jobDescription: string, location?: string): Promise<SearchResult>;
    private searchCustomDatabase;
    private calculateMatchScore;
    private calculateTitleMatch;
    private calculateSkillsMatch;
    private areSimilarSkills;
    private calculateLocationMatch;
    private calculateExperienceMatch;
    getCandidateDetails(linkedinUrl: string): Promise<Candidate | null>;
}
declare const _default: LinkedInSearchService;
export default _default;
//# sourceMappingURL=linkedin-search.d.ts.map