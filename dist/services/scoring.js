"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
class ScoringService {
    openai;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: config_1.default.llm.apiKey,
        });
    }
    async scoreCandidates(candidates, jobDescription) {
        const scoredCandidates = [];
        const skillKeywords = [
            'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'node.js', 'python', 'java', 'c#',
            'aws', 'azure', 'docker', 'kubernetes', 'sql', 'mongodb', 'redis', 'machine learning',
            'ai', 'data science', 'devops', 'cybersecurity', 'product management', 'ui/ux', 'html', 'css',
            'sass', 'less', 'go', 'ruby', 'php', 'swift', 'objective-c', 'scala', 'spring', 'django', 'flask',
            'graphql', 'rest', 'api', 'microservices', 'jenkins', 'terraform', 'ansible', 'linux', 'git',
            'firebase', 'postgresql', 'mysql', 'nosql', 'pandas', 'numpy', 'scikit', 'tensorflow', 'pytorch',
            'docker', 'k8s', 'sre', 'qa', 'testing', 'automation', 'selenium', 'jira', 'figma', 'sketch',
            'adobe', 'photoshop', 'illustrator', 'tableau', 'powerbi', 'excel', 'r', 'matlab', 'c++', 'c',
            'bash', 'shell', 'unix', 'cloud', 'blockchain', 'solidity', 'web3', 'firebase', 'firebase', 'redux',
            'mobx', 'webpack', 'babel', 'eslint', 'prettier', 'storybook', 'jest', 'mocha', 'chai', 'cypress',
            'puppeteer', 'playwright', 'express', 'fastify', 'hapi', 'koa', 'nestjs', 'next.js', 'nuxt', 'svelte',
            'ember', 'backbone', 'd3', 'three.js', 'chart.js', 'highcharts', 'mapbox', 'leaflet', 'unity', 'unreal',
            'gamedev', 'vr', 'ar', 'iot', 'embedded', 'hardware', 'network', 'security', 'infosec', 'pentest',
            'incident response', 'compliance', 'gdpr', 'hipaa', 'pci', 'risk', 'governance', 'agile', 'scrum',
            'kanban', 'product owner', 'product manager', 'business analyst', 'crm', 'salesforce', 'hubspot',
            'marketing', 'seo', 'sem', 'content', 'copywriting', 'analytics', 'big data', 'etl', 'data pipeline',
            'data warehouse', 'hadoop', 'spark', 'hive', 'pig', 'kafka', 'rabbitmq', 'elasticsearch', 'splunk',
            'grafana', 'prometheus', 'monitoring', 'logging', 'observability', 'ci/cd', 'integration', 'deployment',
            'serverless', 'faas', 'paas', 'saas', 'iaas', 'crm', 'erp', 'sap', 'oracle', 'peoplesoft', 'workday',
            'netsuite', 'quickbooks', 'xero', 'zoho', 'freshbooks', 'wave', 'sage', 'intacct', 'adp', 'paychex',
            'gusto', 'bamboohr', 'namely', 'zenefits', 'trinet', 'justworks', 'rippling', 'greenhouse', 'lever',
            'icims', 'jobvite', 'smartrecruiters', 'workable', 'breezy', 'jazzhr', 'recruiterbox', 'bullhorn',
            'ceipal', 'crelate', 'avionte', 'jobadder', 'recruitee', 'manatal', 'vinch', 'hiretual', 'seekout',
            'gem', 'beamery', 'eightfold', 'hireez', 'entelo', 'x0pa', 'talentsoft', 'icims', 'jobvite', 'greenhouse'
        ];
        const jobLower = (jobDescription.title + ' ' + (jobDescription.requirements || []).join(' ') + ' ' + (jobDescription.description || '')).toLowerCase();
        const jobSkillKeywords = skillKeywords.filter(skill => jobLower.includes(skill));
        const totalSkillKeywords = jobSkillKeywords.length;
        for (const candidate of candidates) {
            const candidateSkillsLower = (candidate.skills || []).map(skill => skill.toLowerCase());
            let matched = 0;
            for (const skill of jobSkillKeywords) {
                if (candidateSkillsLower.some(cs => cs.includes(skill) || skill.includes(cs))) {
                    matched++;
                }
            }
            const rawScore = matched;
            const displayScore = totalSkillKeywords > 0 ? Math.round((matched / totalSkillKeywords) * 1000 * 10) / 10 : 0;
            scoredCandidates.push({
                ...candidate,
                score: displayScore,
                confidence: matched > 0 ? 1.0 : 0.0,
                breakdown: {
                    titleMatch: 0,
                    skillsMatch: displayScore,
                    experienceMatch: 0,
                    locationMatch: 0,
                    industryMatch: 0,
                },
                reasoning: `Matched ${matched} out of ${totalSkillKeywords} skill keywords.`,
            });
        }
        return scoredCandidates.sort((a, b) => b.score - a.score);
    }
    async scoreCandidate(candidate, jobDescription) {
        const prompt = this.buildScoringPrompt(candidate, jobDescription);
        try {
            const response = await this.openai.chat.completions.create({
                model: config_1.default.llm.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert recruiter evaluating candidate fit for job positions. Provide detailed scoring with reasoning.',
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
            return this.parseScoringResponse(candidate, content);
        }
        catch (error) {
            logger_1.default.error('OpenAI scoring failed:', error);
            return this.createDefaultScore(candidate);
        }
    }
    buildScoringPrompt(candidate, jobDescription) {
        return `
Please evaluate this candidate's fit for the job position. Provide a JSON response with the following structure:

{
  "score": <overall_score_1-10>,
  "confidence": <confidence_0-1>,
  "breakdown": {
    "titleMatch": <score_0-10>,
    "skillsMatch": <score_0-10>,
    "experienceMatch": <score_0-10>,
    "locationMatch": <score_0-10>,
    "industryMatch": <score_0-10>
  },
  "reasoning": "<detailed_explanation>"
}

JOB DESCRIPTION:
Title: ${jobDescription.title}
Company: ${jobDescription.company}
Location: ${jobDescription.location}
Requirements: ${jobDescription.requirements.join(', ')}
Description: ${jobDescription.description}

CANDIDATE PROFILE:
Name: ${candidate.name}
Headline: ${candidate.headline}
Location: ${candidate.location}
Company: ${candidate.company || 'N/A'}
Experience: ${candidate.experience || 'N/A'}
Skills: ${candidate.skills?.join(', ') || 'N/A'}
Education: ${candidate.education || 'N/A'}

Please be objective and thorough in your evaluation. Consider:
- Title relevance and seniority match
- Skills alignment with job requirements
- Experience level appropriateness
- Location compatibility
- Industry/company background relevance
`;
    }
    parseScoringResponse(candidate, response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                ...candidate,
                score: Math.min(10, Math.max(1, parsed.score || 5)),
                confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
                breakdown: {
                    titleMatch: Math.min(10, Math.max(0, parsed.breakdown?.titleMatch || 5)),
                    skillsMatch: Math.min(10, Math.max(0, parsed.breakdown?.skillsMatch || 5)),
                    experienceMatch: Math.min(10, Math.max(0, parsed.breakdown?.experienceMatch || 5)),
                    locationMatch: Math.min(10, Math.max(0, parsed.breakdown?.locationMatch || 5)),
                    industryMatch: Math.min(10, Math.max(0, parsed.breakdown?.industryMatch || 5)),
                },
                reasoning: parsed.reasoning || 'No reasoning provided',
            };
        }
        catch (error) {
            logger_1.default.error('Failed to parse scoring response:', error);
            return this.createDefaultScore(candidate);
        }
    }
    createDefaultScore(candidate) {
        return {
            ...candidate,
            score: 5,
            confidence: 0.3,
            breakdown: {
                titleMatch: 5,
                skillsMatch: 5,
                experienceMatch: 5,
                locationMatch: 5,
                industryMatch: 5,
            },
            reasoning: 'Default score due to scoring failure',
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getTopCandidates(candidates, limit = 100) {
        return candidates
            .filter(c => c.score >= 6 && c.confidence >= 0.5)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}
exports.ScoringService = ScoringService;
exports.default = new ScoringService();
//# sourceMappingURL=scoring.js.map