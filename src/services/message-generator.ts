import OpenAI from 'openai';
import { ScoredCandidate, OutreachMessage, JobDescription } from '../types';
import config from '../config';
import logger from '../utils/logger';
import databaseService from './database';

export class MessageGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.llm.apiKey,
    });
  }

  async generateOutreachMessages(
    candidates: ScoredCandidate[],
    jobDescription: JobDescription,
    maxMessages: number = 5
  ): Promise<OutreachMessage[]> {
    const messages: OutreachMessage[] = [];
    const topCandidates = candidates.slice(0, maxMessages);

    for (const candidate of topCandidates) {
      try {
        const message = await this.generateMessage(candidate, jobDescription);
        messages.push(message);
        
        // Save to database
        await databaseService.saveOutreachMessage(message, jobDescription.id);
        
        // Rate limiting
        await this.delay(1000);
      } catch (error) {
        logger.error(`Failed to generate message for ${candidate.id}:`, error);
        // Continue with other candidates
      }
    }

    return messages;
  }

  private async generateMessage(
    candidate: ScoredCandidate,
    jobDescription: JobDescription
  ): Promise<OutreachMessage> {
    const prompt = this.buildMessagePrompt(candidate, jobDescription);

    try {
      const response = await this.openai.chat.completions.create({
        model: config.llm.model,
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
        max_tokens: config.llm.maxTokens,
        temperature: config.llm.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return this.parseMessageResponse(candidate, content);
    } catch (error) {
      logger.error('OpenAI message generation failed:', error);
      return this.createDefaultMessage(candidate, jobDescription);
    }
  }

  private buildMessagePrompt(candidate: ScoredCandidate, jobDescription: JobDescription): string {
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

  private getTopMatchReason(candidate: ScoredCandidate): string {
    const breakdown = candidate.breakdown;
    const scores = [
      { key: 'titleMatch', value: breakdown.titleMatch, label: 'title match' },
      { key: 'skillsMatch', value: breakdown.skillsMatch, label: 'skills match' },
      { key: 'experienceMatch', value: breakdown.experienceMatch, label: 'experience match' },
      { key: 'locationMatch', value: breakdown.locationMatch, label: 'location match' },
      { key: 'industryMatch', value: breakdown.industryMatch, label: 'industry match' },
    ];

    const topScore = scores.reduce((max, current) => 
      current.value > max.value ? current : max
    );

    return `${topScore.label} (${topScore.value}/10)`;
  }

  private parseMessageResponse(candidate: ScoredCandidate, response: string): OutreachMessage {
    try {
      // Extract JSON from response
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
    } catch (error) {
      logger.error('Failed to parse message response:', error);
      return this.createDefaultMessage(candidate, {} as JobDescription);
    }
  }

  private createDefaultMessage(candidate: ScoredCandidate, jobDescription: JobDescription): OutreachMessage {
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

  private createDefaultMessageText(candidate: ScoredCandidate): string {
    return `Hi ${candidate.name.split(' ')[0]}, I came across your profile and was impressed by your background. Would you be interested in discussing a new opportunity?`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateBatchMessages(
    jobDescriptions: JobDescription[],
    candidatesPerJob: number = 5
  ): Promise<Map<string, OutreachMessage[]>> {
    const results = new Map<string, OutreachMessage[]>();

    for (const job of jobDescriptions) {
      try {
        // This would typically get candidates from the database
        // For now, we'll create mock candidates
        const mockCandidates: ScoredCandidate[] = Array.from({ length: candidatesPerJob }, (_, i) => ({
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
      } catch (error) {
        logger.error(`Failed to generate messages for job ${job.id}:`, error);
        results.set(job.id, []);
      }
    }

    return results;
  }
}

export default new MessageGeneratorService(); 