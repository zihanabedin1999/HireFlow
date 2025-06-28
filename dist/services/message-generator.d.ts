import { ScoredCandidate, OutreachMessage, JobDescription } from '../types';
export declare class MessageGeneratorService {
    private openai;
    constructor();
    generateOutreachMessages(candidates: ScoredCandidate[], jobDescription: JobDescription, maxMessages?: number): Promise<OutreachMessage[]>;
    private generateMessage;
    private buildMessagePrompt;
    private getTopMatchReason;
    private parseMessageResponse;
    private createDefaultMessage;
    private createDefaultMessageText;
    private delay;
    generateBatchMessages(jobDescriptions: JobDescription[], candidatesPerJob?: number): Promise<Map<string, OutreachMessage[]>>;
}
declare const _default: MessageGeneratorService;
export default _default;
//# sourceMappingURL=message-generator.d.ts.map