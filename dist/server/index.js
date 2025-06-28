"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const sourcing_agent_1 = __importDefault(require("../services/sourcing-agent"));
const database_1 = __importDefault(require("../services/database"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        },
    },
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
const rateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: config_1.default.rateLimit.requestsPerMinute,
    duration: 60,
});
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip || 'unknown');
        next();
    }
    catch (error) {
        res.status(429).json({ error: 'Too many requests' });
    }
});
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../public/index.html'));
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.post('/api/jobs/process', async (req, res) => {
    try {
        const jobData = req.body;
        if (!jobData.title || !jobData.company || !jobData.description) {
            return res.status(400).json({ error: 'Missing required job fields' });
        }
        const jobDescription = {
            id: jobData.id || `job_${Date.now()}`,
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            requirements: jobData.requirements || [],
            location: jobData.location || 'Remote',
            salary: jobData.salary,
            createdAt: new Date(),
        };
        const result = await sourcing_agent_1.default.processJob(jobDescription);
        return res.json(result);
    }
    catch (error) {
        logger_1.default.error('Job processing error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/jobs/batch', async (req, res) => {
    try {
        const jobsData = req.body.jobs;
        if (!Array.isArray(jobsData)) {
            return res.status(400).json({ error: 'Jobs must be an array' });
        }
        const jobDescriptions = jobsData.map((jobData, index) => ({
            id: jobData.id || `job_${Date.now()}_${index}`,
            title: jobData.title,
            company: jobData.company,
            description: jobData.description,
            requirements: jobData.requirements || [],
            location: jobData.location || 'Remote',
            salary: jobData.salary,
            createdAt: new Date(),
        }));
        const results = await sourcing_agent_1.default.processBatchJobs(jobDescriptions);
        return res.json({ results });
    }
    catch (error) {
        logger_1.default.error('Batch job processing error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/candidates/search', async (req, res) => {
    try {
        const { jobDescription } = req.body;
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }
        const candidates = await sourcing_agent_1.default.searchAndScoreOnly(jobDescription);
        return res.json({ candidates });
    }
    catch (error) {
        logger_1.default.error('Candidate search error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/messages/generate', async (req, res) => {
    try {
        const { candidates, jobDescription } = req.body;
        if (!candidates || !jobDescription) {
            return res.status(400).json({ error: 'Candidates and job description are required' });
        }
        const messages = await sourcing_agent_1.default.generateMessagesOnly(candidates, jobDescription);
        return res.json({ messages });
    }
    catch (error) {
        logger_1.default.error('Message generation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/jobs/:jobId/stats', async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }
        const stats = await sourcing_agent_1.default.getJobStats(jobId);
        return res.json(stats);
    }
    catch (error) {
        logger_1.default.error('Stats retrieval error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});
async function startServer() {
    try {
        await database_1.default.initialize();
        app.listen(config_1.default.port, () => {
            logger_1.default.info(`Server running on port ${config_1.default.port}`);
            logger_1.default.info(`Environment: ${config_1.default.nodeEnv}`);
            logger_1.default.info(`Dashboard available at: http://localhost:${config_1.default.port}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
exports.default = app;
//# sourceMappingURL=index.js.map