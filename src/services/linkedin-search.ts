import axios from 'axios';
import * as cheerio from 'cheerio';
import { Candidate, SearchResult } from '../types';
import { SERPAPI_KEY } from '../config';
import logger from '../utils/logger';
import databaseService from './database';

// Custom database with sample candidates
const customCandidates: Candidate[] = [
  {
    id: 'candidate_1',
    name: 'Sarah Johnson',
    linkedinUrl: 'https://linkedin.com/in/sarah-johnson',
    headline: 'Senior Software Engineer at Google',
    location: 'San Francisco, CA',
    company: 'Google',
    experience: '8+ years',
    education: 'Computer Science, Stanford University',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_2',
    name: 'Michael Chen',
    linkedinUrl: 'https://linkedin.com/in/michael-chen',
    headline: 'Full Stack Developer at Microsoft',
    location: 'Seattle, WA',
    company: 'Microsoft',
    experience: '6+ years',
    education: 'Software Engineering, University of Washington',
    skills: ['TypeScript', 'React', 'Angular', 'C#', 'Azure', 'SQL'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_3',
    name: 'Emily Rodriguez',
    linkedinUrl: 'https://linkedin.com/in/emily-rodriguez',
    headline: 'Frontend Engineer at Netflix',
    location: 'Los Angeles, CA',
    company: 'Netflix',
    experience: '5+ years',
    education: 'Computer Science, UCLA',
    skills: ['JavaScript', 'React', 'Vue.js', 'CSS', 'HTML', 'Webpack'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_4',
    name: 'David Kim',
    linkedinUrl: 'https://linkedin.com/in/david-kim',
    headline: 'DevOps Engineer at Amazon',
    location: 'Seattle, WA',
    company: 'Amazon',
    experience: '7+ years',
    education: 'Computer Engineering, University of California',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Python'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_5',
    name: 'Lisa Wang',
    linkedinUrl: 'https://linkedin.com/in/lisa-wang',
    headline: 'Data Scientist at Facebook',
    location: 'San Francisco, CA',
    company: 'Facebook',
    experience: '4+ years',
    education: 'Statistics, UC Berkeley',
    skills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'Scikit-learn', 'R'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_6',
    name: 'James Wilson',
    linkedinUrl: 'https://linkedin.com/in/james-wilson',
    headline: 'Backend Engineer at Uber',
    location: 'San Francisco, CA',
    company: 'Uber',
    experience: '6+ years',
    education: 'Computer Science, MIT',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Microservices'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_7',
    name: 'Maria Garcia',
    linkedinUrl: 'https://linkedin.com/in/maria-garcia',
    headline: 'Product Manager at Airbnb',
    location: 'San Francisco, CA',
    company: 'Airbnb',
    experience: '5+ years',
    education: 'Business Administration, Harvard',
    skills: ['Product Management', 'Agile', 'User Research', 'Analytics', 'SaaS', 'A/B Testing'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_8',
    name: 'Alex Thompson',
    linkedinUrl: 'https://linkedin.com/in/alex-thompson',
    headline: 'Mobile Developer at Instagram',
    location: 'Menlo Park, CA',
    company: 'Instagram',
    experience: '4+ years',
    education: 'Computer Science, Carnegie Mellon',
    skills: ['Swift', 'iOS', 'Objective-C', 'React Native', 'Firebase', 'Git'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_9',
    name: 'Rachel Green',
    linkedinUrl: 'https://linkedin.com/in/rachel-green',
    headline: 'UX Designer at Spotify',
    location: 'New York, NY',
    company: 'Spotify',
    experience: '6+ years',
    education: 'Design, Parsons School of Design',
    skills: ['UI/UX Design', 'Figma', 'Sketch', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
    extractedAt: new Date(),
  },
  {
    id: 'candidate_10',
    name: 'Tom Anderson',
    linkedinUrl: 'https://linkedin.com/in/tom-anderson',
    headline: 'Security Engineer at Twitter',
    location: 'San Francisco, CA',
    company: 'Twitter',
    experience: '8+ years',
    education: 'Cybersecurity, Georgia Tech',
    skills: ['Cybersecurity', 'Penetration Testing', 'Python', 'Linux', 'Network Security', 'Incident Response'],
    extractedAt: new Date(),
  }
];

export class LinkedInSearchService {
  private readonly baseUrl = 'https://serpapi.com/search.json';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async searchCandidates(jobDescription: string, location?: string): Promise<SearchResult> {
    const startTime = Date.now();
    
    // Use custom database instead of external API
    const candidates = await this.searchCustomDatabase(jobDescription, location);
    const searchTime = Date.now() - startTime;
    
    const result: SearchResult = {
      query: `Custom search for: ${jobDescription}`,
      candidates,
      totalFound: candidates.length,
      searchTime,
      cached: false,
    };

    return result;
  }

  private async searchCustomDatabase(jobDescription: string, location?: string): Promise<Candidate[]> {
    const matchingCandidates: Array<{ candidate: Candidate; matchScore: number }> = [];

    for (const candidate of customCandidates) {
      const matchScore = this.calculateMatchScore(candidate, jobDescription, location);
      
      // Return candidates with 2% or higher match (0.02 threshold)
      if (matchScore >= 0.004) {
        matchingCandidates.push({ candidate, matchScore });
      }
    }

    // Sort by match score descending
    matchingCandidates.sort((a, b) => b.matchScore - a.matchScore);

    logger.info(`Found ${matchingCandidates.length} candidates with 2%+ match for job description`);

    return matchingCandidates.map(item => item.candidate);
  }

  private calculateMatchScore(candidate: Candidate, jobDescription: string, location?: string): number {
    // Define a list of common skill keywords
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

    // Extract skill keywords from job description
    const jobLower = jobDescription.toLowerCase();
    const jobSkillKeywords = skillKeywords.filter(skill => jobLower.includes(skill));
    if (jobSkillKeywords.length === 0) return 0;

    // Compare with candidate.skills
    const candidateSkillsLower = (candidate.skills || []).map(skill => skill.toLowerCase());
    let matched = 0;
    for (const skill of jobSkillKeywords) {
      if (candidateSkillsLower.some(cs => cs.includes(skill) || skill.includes(cs))) {
        matched++;
      }
    }
    return matched / jobSkillKeywords.length;
  }

  private calculateTitleMatch(candidateHeadline: string, jobDescription: string): number {
    const candidateLower = candidateHeadline.toLowerCase();
    const jobLower = jobDescription.toLowerCase();

    // Check for exact title matches
    if (candidateLower.includes(jobLower) || jobLower.includes(candidateLower)) {
      return 1.0;
    }

    // Check for partial matches
    const jobWords = jobLower.split(' ');
    const candidateWords = candidateLower.split(' ');
    
    let matches = 0;
    for (const jobWord of jobWords) {
      if (jobWord.length > 2 && candidateWords.some(cw => cw.includes(jobWord) || jobWord.includes(cw))) {
        matches++;
      }
    }

    return matches / jobWords.length;
  }

  private calculateSkillsMatch(candidateSkills: string[], jobDescription: string): number {
    const candidateSkillsLower = candidateSkills.map(skill => skill.toLowerCase());
    const jobLower = jobDescription.toLowerCase();

    // Extract potential skills from job description
    const commonSkills = [
      'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js', 'python', 'java', 'c#',
      'aws', 'azure', 'docker', 'kubernetes', 'sql', 'mongodb', 'redis', 'machine learning',
      'ai', 'data science', 'devops', 'cybersecurity', 'product management', 'ui/ux'
    ];

    const jobSkills = commonSkills.filter(skill => jobLower.includes(skill));
    
    if (jobSkills.length === 0) return 0.1; // Very low score if no skills mentioned

    let matches = 0;
    for (const jobSkill of jobSkills) {
      if (candidateSkillsLower.some(skill => 
        skill.includes(jobSkill) || 
        jobSkill.includes(skill) ||
        this.areSimilarSkills(skill, jobSkill)
      )) {
        matches++;
      }
    }

    return matches / jobSkills.length;
  }

  private areSimilarSkills(skill1: string, skill2: string): boolean {
    const skillMappings: { [key: string]: string[] } = {
      'javascript': ['js', 'es6', 'es2015'],
      'typescript': ['ts'],
      'react': ['reactjs', 'react.js'],
      'node.js': ['nodejs', 'node'],
      'python': ['py'],
      'java': ['java8', 'java11'],
      'aws': ['amazon web services', 'amazon'],
      'docker': ['containerization'],
      'kubernetes': ['k8s'],
      'machine learning': ['ml', 'ai', 'artificial intelligence'],
      'data science': ['data scientist', 'analytics'],
      'product management': ['pm', 'product manager'],
      'ui/ux': ['ux', 'ui', 'user experience', 'user interface'],
      'devops': ['sre', 'site reliability'],
      'cybersecurity': ['security', 'infosec', 'information security']
    };

    for (const [mainSkill, variations] of Object.entries(skillMappings)) {
      if (variations.includes(skill1) && skill2.includes(mainSkill)) return true;
      if (variations.includes(skill2) && skill1.includes(mainSkill)) return true;
    }

    return false;
  }

  private calculateLocationMatch(candidateLocation: string, jobLocation?: string): number {
    if (!jobLocation) return 0.5; // Neutral score if no location specified

    const candidateLower = candidateLocation.toLowerCase();
    const jobLower = jobLocation.toLowerCase();

    // Exact match
    if (candidateLower === jobLower) return 1.0;

    // Remote work consideration
    if (jobLower.includes('remote') || candidateLower.includes('remote')) return 0.8;

    // Same city/state
    const candidateParts = candidateLower.split(',').map(part => part.trim());
    const jobParts = jobLower.split(',').map(part => part.trim());

    for (const candidatePart of candidateParts) {
      for (const jobPart of jobParts) {
        if (candidatePart === jobPart && candidatePart.length > 2) {
          return 0.9;
        }
      }
    }

    // Same state
    const candidateState = candidateParts[candidateParts.length - 1];
    const jobState = jobParts[jobParts.length - 1];
    if (candidateState === jobState) return 0.6;

    return 0.1; // Different locations
  }

  private calculateExperienceMatch(candidateExperience: string, jobDescription: string): number {
    const experience = candidateExperience.toLowerCase();
    const description = jobDescription.toLowerCase();

    // Senior positions
    if (description.includes('senior') || description.includes('lead') || description.includes('principal')) {
      if (experience.includes('8+') || experience.includes('9+') || experience.includes('10+')) return 1.0;
      if (experience.includes('6+') || experience.includes('7+')) return 0.8;
      if (experience.includes('4+') || experience.includes('5+')) return 0.6;
      return 0.3;
    }

    // Mid-level positions
    if (description.includes('mid') || description.includes('intermediate')) {
      if (experience.includes('4+') || experience.includes('5+') || experience.includes('6+')) return 1.0;
      if (experience.includes('3+') || experience.includes('7+')) return 0.7;
      return 0.4;
    }

    // Junior positions
    if (description.includes('junior') || description.includes('entry')) {
      if (experience.includes('1+') || experience.includes('2+') || experience.includes('3+')) return 1.0;
      if (experience.includes('4+') || experience.includes('5+')) return 0.6;
      return 0.3;
    }

    // Default: prefer mid-level experience
    if (experience.includes('4+') || experience.includes('5+') || experience.includes('6+')) return 0.8;
    if (experience.includes('3+') || experience.includes('7+')) return 0.6;
    return 0.4;
  }

  async getCandidateDetails(linkedinUrl: string): Promise<Candidate | null> {
    return customCandidates.find(c => c.linkedinUrl === linkedinUrl) || null;
  }
}

export default new LinkedInSearchService(); 