"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageGeneratorService = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const database_1 = __importDefault(require("./database"));
class MessageGeneratorService {
    openai;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: config_1.default.llm.apiKey,
        });
    }
    async generateOutreachMessages(candidates, jobDescription, maxMessages = 5) {
        const messages = [];
        const topCandidates = candidates.slice(0, maxMessages);
        for (const candidate of topCandidates) {
            try {
                const message = await this.generateMessage(candidate, jobDescription);
                messages.push(message);
                await database_1.default.saveOutreachMessage(message, jobDescription.id);
                await this.delay(1000);
            }
            catch (error) {
                logger_1.default.error(`Failed to generate message for ${candidate.id}:`, error);
            }
        }
        return messages;
    }
    async generateMessage(candidate, jobDescription) {
        const prompt = this.buildMessagePrompt(candidate, jobDescription);
        try {
            const response = await this.openai.chat.completions.create({
                model: config_1.default.llm.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional recruiter crafting personalized LinkedIn outreach messages. Be friendly, specific, and professional.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: config_1.default.llm.maxTokens,
                temperature: config_1.default.llm.temperature,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }
            return this.parseMessageResponse(candidate, content);
        }
        catch (error) {
            logger_1.default.error('OpenAI message generation failed:', error);
            return this.createDefaultMessage(candidate, jobDescription);
        }
    }
    buildMessagePrompt(candidate, jobDescription) {
        return `
Generate a personalized LinkedIn outreach message for this candidate. The message should be:

1. Professional and friendly
2. Specific to their background and the job
3. Under 300 characters (LinkedIn connection request limit)
4. Include a clear call-to-action

Provide the response in this JSON format:
{
  "message": "<the_message_text>",
  "personalization": {
    "companyMention": <boolean>,
    "skillMention": <boolean>,
    "experienceMention": <boolean>
  }
}

JOB DETAILS:
Title: ${jobDescription.title}
Company: ${jobDescription.company}
Location: ${jobDescription.location}
Key Requirements: ${jobDescription.requirements.slice(0, 3).join(', ')}

CANDIDATE PROFILE:
Name: ${candidate.name}
Headline: ${candidate.headline}
Current Company: ${candidate.company || 'N/A'}
Location: ${candidate.location}
Skills: ${candidate.skills?.slice(0, 3).join(', ') || 'N/A'}
Score: ${candidate.score}/10
Top Match: ${this.getTopMatchReason(candidate)}

Focus on their strongest match and make it relevant to the role.
`;
    }
    getTopMatchReason(candidate) {
        const breakdown = candidate.breakdown;
        const scores = [
            { key: 'titleMatch', value: breakdown.titleMatch, label: 'title match' },
            { key: 'skillsMatch', value: breakdown.skillsMatch, label: 'skills match' },
            { key: 'experienceMatch', value: breakdown.experienceMatch, label: 'experience match' },
            { key: 'locationMatch', value: breakdown.locationMatch, label: 'location match' },
            { key: 'industryMatch', value: breakdown.industryMatch, label: 'industry match' },
        ];
        const topScore = scores.reduce((max, current) => current.value > max.value ? current : max);
        return `${topScore.label} (${topScore.value}/10)`;
    }
    parseMessageResponse(candidate, response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                candidateId: candidate.id,
                candidateName: candidate.name,
                message: parsed.message || this.createDefaultMessageText(candidate),
                personalization: {
                    companyMention: parsed.personalization?.companyMention || false,
                    skillMention: parsed.personalization?.skillMention || false,
                    experienceMention: parsed.personalization?.experienceMention || false,
                },
                generatedAt: new Date(),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to parse message response:', error);
            return this.createDefaultMessage(candidate, {});
        }
    }
    createDefaultMessage(candidate, jobDescription) {
        return {
            candidateId: candidate.id,
            candidateName: candidate.name,
            message: this.createDefaultMessageText(candidate),
            personalization: {
                companyMention: false,
                skillMention: false,
                experienceMention: false,
            },
            generatedAt: new Date(),
        };
    }
    createDefaultMessageText(candidate) {
        return `Hi ${candidate.name.split(' ')[0]}, I came across your profile and was impressed by your background. Would you be interested in discussing a new opportunity?`;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async generateBatchMessages(jobDescriptions, candidatesPerJob = 5) {
        const results = new Map();
        for (const job of jobDescriptions) {
            try {
                const mockCandidates = Array.from({ length: candidatesPerJob }, (_, i) => ({
                    id: `candidate_${job.id}_${i}`,
                    name: `Candidate ${i + 1}`,
                    linkedinUrl: `https://linkedin.com/in/candidate${i}`,
                    headline: 'Software Engineer',
                    location: 'San Francisco, CA',
                    company: 'Tech Company',
                    experience: '5+ years',
                    education: 'Computer Science',
                    skills: ['JavaScript', 'Python', 'React'],
                    extractedAt: new Date(),
                    score: 8 - i * 0.5,
                    confidence: 0.8,
                    breakdown: {
                        titleMatch: 8,
                        skillsMatch: 7,
                        experienceMatch: 8,
                        locationMatch: 6,
                        industryMatch: 7,
                    },
                    reasoning: 'Good match for the position',
                }));
                const messages = await this.generateOutreachMessages(mockCandidates, job, candidatesPerJob);
                results.set(job.id, messages);
            }
            catch (error) {
                logger_1.default.error(`Failed to generate messages for job ${job.id}:`, error);
                results.set(job.id, []);
            }
        }
        return results;
    }
}
exports.MessageGeneratorService = MessageGeneratorService;
exports.default = new MessageGeneratorService();
//# sourceMappingURL=message-generator.js.map