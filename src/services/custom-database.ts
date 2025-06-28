import { Candidate, ScoredCandidate, JobDescription } from '../types';
import logger from '../utils/logger';

export class CustomDatabaseService {
  private candidates: Candidate[] = [];

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Generate 1000 synthetic candidates
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Peyton', 'Quinn',
      'Cameron', 'Drew', 'Skyler', 'Reese', 'Rowan', 'Sawyer', 'Emerson', 'Finley', 'Harper', 'Logan',
      'Charlie', 'Dakota', 'Elliot', 'Hayden', 'Jesse', 'Kai', 'Lane', 'Micah', 'Parker', 'Remy',
      'Sage', 'Tatum', 'Blake', 'Corey', 'Devon', 'Eden', 'Frankie', 'Greer', 'Hollis', 'Indigo',
      'Jules', 'Kendall', 'Lennon', 'Marley', 'Nico', 'Oakley', 'Phoenix', 'Reagan', 'Shiloh', 'Teagan'
    ];
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
    ];
    const companies = [
      'Google', 'Microsoft', 'Amazon', 'Facebook', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Salesforce', 'Adobe',
      'Tesla', 'Coinbase', 'Twitter', 'Spotify', 'LinkedIn', 'Stripe', 'Square', 'Shopify', 'Slack', 'Zoom',
      'Oracle', 'SAP', 'Intel', 'Cisco', 'Nvidia', 'Dropbox', 'Atlassian', 'Reddit', 'Pinterest', 'Snap',
      'Palantir', 'Twilio', 'MongoDB', 'Cloudflare', 'Datadog', 'Okta', 'Snowflake', 'GitHub', 'GitLab', 'Asana'
    ];
    const locations = [
      'San Francisco, CA', 'Seattle, WA', 'New York, NY', 'Los Angeles, CA', 'Austin, TX', 'Boston, MA',
      'Chicago, IL', 'Denver, CO', 'Atlanta, GA', 'Portland, OR', 'San Jose, CA', 'Dallas, TX', 'San Diego, CA',
      'Washington, DC', 'Houston, TX', 'Miami, FL', 'Phoenix, AZ', 'Philadelphia, PA', 'Minneapolis, MN', 'Charlotte, NC'
    ];
    const titles = [
      'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer',
      'Data Scientist', 'Product Manager', 'QA Engineer', 'Cloud Architect', 'Security Engineer',
      'Machine Learning Engineer', 'Site Reliability Engineer', 'Mobile Developer', 'UX Designer', 'Blockchain Developer'
    ];
    const educations = [
      'Computer Science, Stanford University', 'Software Engineering, MIT', 'Computer Engineering, UC Berkeley',
      'Information Systems, Carnegie Mellon', 'Statistics, Harvard University', 'Electrical Engineering, Caltech',
      'Business Administration, Wharton', 'Design, Parsons School of Design', 'Cybersecurity, Georgia Tech',
      'Data Science, Columbia University'
    ];
    const skillsList = [
      ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
      ['Python', 'Django', 'Flask', 'Pandas', 'NumPy', 'TensorFlow'],
      ['Java', 'Spring Boot', 'Kubernetes', 'SQL', 'Redis', 'Kafka'],
      ['C#', '.NET', 'Azure', 'Angular', 'SQL Server', 'CI/CD'],
      ['Go', 'Microservices', 'gRPC', 'Kubernetes', 'Prometheus', 'Grafana'],
      ['Swift', 'iOS', 'Objective-C', 'Firebase', 'Git', 'Xcode'],
      ['Kotlin', 'Android', 'Java', 'Retrofit', 'Room', 'Dagger'],
      ['PHP', 'Laravel', 'MySQL', 'Vue.js', 'Nginx', 'Redis'],
      ['Ruby', 'Rails', 'PostgreSQL', 'Sidekiq', 'RSpec', 'Capybara'],
      ['Scala', 'Akka', 'Spark', 'Hadoop', 'Cassandra', 'Zookeeper'],
      ['HTML', 'CSS', 'Sass', 'Bootstrap', 'Webpack', 'Jest'],
      ['C++', 'Qt', 'OpenGL', 'Linux', 'CMake', 'GTest'],
      ['R', 'Shiny', 'ggplot2', 'dplyr', 'Tidyverse', 'Caret'],
      ['SQL', 'ETL', 'Data Warehousing', 'Tableau', 'PowerBI', 'Looker'],
      ['Machine Learning', 'Deep Learning', 'PyTorch', 'Scikit-learn', 'OpenCV', 'NLP'],
      ['Product Management', 'Agile', 'Scrum', 'Jira', 'Confluence', 'A/B Testing'],
      ['QA', 'Selenium', 'Cypress', 'Mocha', 'Chai', 'Jenkins'],
      ['Cloud', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible'],
      ['Security', 'Penetration Testing', 'SIEM', 'Incident Response', 'Linux', 'Python'],
      ['UI/UX Design', 'Figma', 'Sketch', 'Adobe XD', 'User Research', 'Prototyping']
    ];
    this.candidates = [];
    for (let i = 1; i <= 1000; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)] ?? '';
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)] ?? '';
      const name = `${firstName} ${lastName}`;
      const company = companies[Math.floor(Math.random() * companies.length)] ?? 'Unknown';
      const location = locations[Math.floor(Math.random() * locations.length)] ?? 'Unknown';
      const title = titles[Math.floor(Math.random() * titles.length)];
      const education = educations[Math.floor(Math.random() * educations.length)] ?? 'Unknown';
      const skills = skillsList[Math.floor(Math.random() * skillsList.length)] ?? [];
      const years = Math.floor(Math.random() * 11) + 1;
      const experience = `${years}+ years`;
      this.candidates.push({
        id: `candidate_${i}`,
        name,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}${i}`,
        headline: `${title} at ${company}`,
        location,
        company,
        experience,
        education,
        skills,
        extractedAt: new Date(),
      });
    }
    logger.info(`Initialized custom database with ${this.candidates.length} sample candidates`);
  }

  async searchCandidates(jobDescription: JobDescription): Promise<Candidate[]> {
    const matchingCandidates: Array<{ candidate: Candidate; matchScore: number }> = [];

    for (const candidate of this.candidates) {
      const matchScore = this.calculateMatchScore(candidate, jobDescription);
      
      // Return candidates with 20% or higher match
      if (matchScore >= 0.2) {
        matchingCandidates.push({ candidate, matchScore });
      }
    }

    // Sort by match score descending
    matchingCandidates.sort((a, b) => b.matchScore - a.matchScore);

    logger.info(`Found ${matchingCandidates.length} candidates with 20%+ match for job: ${jobDescription.title}`);

    return matchingCandidates.map(item => item.candidate);
  }

  private calculateMatchScore(candidate: Candidate, jobDescription: JobDescription): number {
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
    const jobLower = (jobDescription.title + ' ' + (jobDescription.requirements || []).join(' ')).toLowerCase();
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

  async getAllCandidates(): Promise<Candidate[]> {
    return this.candidates;
  }

  async getCandidateById(id: string): Promise<Candidate | null> {
    return this.candidates.find(c => c.id === id) || null;
  }

  async addCandidate(candidate: Candidate): Promise<void> {
    this.candidates.push(candidate);
    logger.info(`Added new candidate: ${candidate.name}`);
  }

  async getDatabaseStats(): Promise<{ totalCandidates: number; lastUpdated: Date }> {
    return {
      totalCandidates: this.candidates.length,
      lastUpdated: new Date()
    };
  }
}

export default new CustomDatabaseService(); 