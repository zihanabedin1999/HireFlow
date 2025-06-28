class Dashboard {
    constructor() {
        this.initializeEventListeners();
        this.checkConnection();
    }

    initializeEventListeners() {
        const form = document.getElementById('job-form');
        form.addEventListener('submit', (e) => this.handleJobSubmit(e));
    }

    async checkConnection() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            if (data.status === 'ok') {
                this.updateStatusIndicator(true);
            }
        } catch (error) {
            this.updateStatusIndicator(false);
            console.error('Connection check failed:', error);
        }
    }

    updateStatusIndicator(connected) {
        const indicator = document.getElementById('status-indicator');
        const dot = indicator.querySelector('div');
        const text = indicator.querySelector('span');

        if (connected) {
            dot.className = 'w-2 h-2 bg-green-400 rounded-full mr-2';
            text.textContent = 'Connected';
        } else {
            dot.className = 'w-2 h-2 bg-red-400 rounded-full mr-2';
            text.textContent = 'Disconnected';
        }
    }

    async handleJobSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');
        const submitLoading = document.getElementById('submit-loading');

        // Show loading state
        submitBtn.disabled = true;
        submitText.textContent = 'Processing...';
        submitLoading.classList.remove('hidden');

        try {
            const formData = this.getFormData();
            const result = await this.processJob(formData);
            this.displayResults(result);
        } catch (error) {
            this.showError('Failed to process job: ' + error.message);
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            submitText.textContent = 'Find Candidates';
            submitLoading.classList.add('hidden');
        }
    }

    getFormData() {
        const title = document.getElementById('job-title').value;
        const company = document.getElementById('job-company').value;
        const location = document.getElementById('job-location').value || 'Remote';
        const description = document.getElementById('job-description').value;
        const requirements = document.getElementById('job-requirements').value
            .split(',')
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0);

        return {
            title,
            company,
            location,
            description,
            requirements
        };
    }

    async processJob(jobData) {
        const response = await fetch('/api/jobs/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to process job');
        }

        return await response.json();
    }

    displayResults(result) {
        // Update stats
        this.updateStats(result);

        // Show results section
        const resultsSection = document.getElementById('results-section');
        const candidatesSection = document.getElementById('candidates-section');
        
        resultsSection.classList.remove('hidden');
        candidatesSection.classList.remove('hidden');

        // Display results summary
        this.displayResultsSummary(result);

        // Display candidates
        this.displayCandidates(result.candidates || []);

        // Display messages
        this.displayMessages(result.messages || []);

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    updateStats(result) {
        const candidates = result.candidates || [];
        const messages = result.messages || [];
        
        // Update total candidates
        document.getElementById('total-candidates').textContent = candidates.length;

        // Update average score
        if (candidates.length > 0) {
            const avgScore = candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length;
            document.getElementById('avg-score').textContent = avgScore.toFixed(1);
        }

        // Update messages sent
        document.getElementById('messages-sent').textContent = messages.length;

        // Update processing time
        const processingTime = (result.processingTime / 1000).toFixed(1);
        document.getElementById('processing-time').textContent = `${processingTime}s`;
    }

    displayResultsSummary(result) {
        const resultsContent = document.getElementById('results-content');
        
        const summary = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 fade-in">
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-blue-600 text-xl mr-3"></i>
                    <div>
                        <h3 class="text-lg font-semibold text-blue-900">Job Processing Complete</h3>
                        <p class="text-blue-700">
                            Found ${result.candidates?.length || 0} candidates in ${(result.processingTime / 1000).toFixed(1)} seconds
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        resultsContent.innerHTML = summary;
    }

    displayCandidates(candidates) {
        const candidatesList = document.getElementById('candidates-list');
        
        if (candidates.length === 0) {
            candidatesList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-search text-4xl mb-4"></i>
                    <p>No candidates found for this job description.</p>
                </div>
            `;
            return;
        }

        const candidatesHTML = candidates.slice(0, 10).map((candidate, index) => `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow fade-in">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${candidate.name}</h3>
                        <p class="text-gray-600">${candidate.headline}</p>
                        <p class="text-sm text-gray-500">${candidate.location}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-blue-600">${candidate.score.toFixed(1)}</div>
                        <div class="text-sm text-gray-500">Score</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <span class="text-sm font-medium text-gray-700">Skills:</span>
                        <p class="text-sm text-gray-600">${(candidate.skills || []).join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-sm font-medium text-gray-700">Company:</span>
                        <p class="text-sm text-gray-600">${candidate.company || 'N/A'}</p>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <a href="${candidate.linkedinUrl}" target="_blank" 
                       class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <i class="fab fa-linkedin mr-1"></i>View Profile
                    </a>
                    <div class="text-xs text-gray-500">
                        Confidence: ${(candidate.confidence * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
        `).join('');

        candidatesList.innerHTML = candidatesHTML;
    }

    displayMessages(messages) {
        if (messages.length === 0) return;

        const resultsContent = document.getElementById('results-content');
        const messagesHTML = `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 fade-in">
                <h3 class="text-lg font-semibold text-green-900 mb-3">
                    <i class="fas fa-envelope mr-2"></i>Generated Outreach Messages (${messages.length})
                </h3>
                <div class="space-y-3">
                    ${messages.slice(0, 3).map((message, index) => `
                        <div class="bg-white border border-green-200 rounded p-3">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-medium text-green-800">${message.candidateName}</span>
                                <span class="text-xs text-gray-500">Message ${index + 1}</span>
                            </div>
                            <p class="text-sm text-gray-700">${message.message}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        resultsContent.innerHTML += messagesHTML;
    }

    showError(message) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        resultsSection.classList.remove('hidden');
        resultsContent.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 fade-in">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-circle text-red-600 text-xl mr-3"></i>
                    <div>
                        <h3 class="text-lg font-semibold text-red-900">Error</h3>
                        <p class="text-red-700">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
}); 