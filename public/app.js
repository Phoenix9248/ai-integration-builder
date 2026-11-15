let currentStep = 1;
let currentTool = {};
let analysis = null;
let generatedCode = null;
let developerMode = false; // Always false - customer view only

// Pre-defined integrations (already in CloudEagle)
const EXISTING_INTEGRATIONS = [
    'Slack', 'Zoom', 'Google Workspace', 'Microsoft 365', 'Salesforce',
    'GitHub', 'Jira', 'Notion', 'Linear', 'Figma', 'Asana', 'Trello',
    'Dropbox', 'Box', 'OneDrive', 'Monday.com', 'ClickUp', 'Airtable'
];

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
    loadExistingIntegrations();
});

function toggleDevMode() {
    developerMode = document.getElementById('dev-mode-toggle').checked;
    console.log('Developer mode:', developerMode ? 'ON' : 'OFF');
}

function loadExistingIntegrations() {
    const list = document.getElementById('integrations-list');

    // Add some pre-existing integrations with real brand logos
    list.innerHTML = `
        <div class="integration-card" style="border-left: 4px solid #4A154B;">
            <div class="integration-icon" style="background: white; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <img src="public/logos/slack.svg" alt="Slack" style="width: 40px; height: 40px; display: block;">
            </div>
            <div class="integration-info">
                <h3 style="color: #4A154B;">Slack</h3>
                <div class="integration-meta">
                    <span>👥 450 users</span>
                    <span style="margin-left: 1rem;">⏱️ 30 inactive</span>
                    <span style="margin-left: 1rem;">✨ Native</span>
                </div>
            </div>
            <div class="integration-actions">
                <div class="savings-pill">💰 $375/mo</div>
                <div class="status-badge status-connected">Connected</div>
            </div>
        </div>
        <div class="integration-card" style="border-left: 4px solid #0B5CFF;">
            <div class="integration-icon" style="background: white; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <img src="public/logos/zoom.svg" alt="Zoom" style="width: 40px; height: 40px; display: block;">
            </div>
            <div class="integration-info">
                <h3 style="color: #0B5CFF;">Zoom</h3>
                <div class="integration-meta">
                    <span>👥 380 users</span>
                    <span style="margin-left: 1rem;">⏱️ 52 inactive</span>
                    <span style="margin-left: 1rem;">✨ Native</span>
                </div>
            </div>
            <div class="integration-actions">
                <div class="savings-pill">💰 $780/mo</div>
                <div class="status-badge status-connected">Connected</div>
            </div>
        </div>
        <div class="integration-card" style="border-left: 4px solid #4285F4;">
            <div class="integration-icon" style="background: white; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <img src="public/logos/google-workspace.svg" alt="Google Workspace" style="width: 40px; height: 40px; display: block;">
            </div>
            <div class="integration-info">
                <h3 style="color: #4285F4;">Google Workspace</h3>
                <div class="integration-meta">
                    <span>👥 520 users</span>
                    <span style="margin-left: 1rem;">⏱️ 45 inactive</span>
                    <span style="margin-left: 1rem;">✨ Native</span>
                </div>
            </div>
            <div class="integration-actions">
                <div class="savings-pill">💰 $540/mo</div>
                <div class="status-badge status-connected">Connected</div>
            </div>
        </div>
    `;
}

async function loadIntegrations() {
    try {
        const response = await fetch('/api/integrations');
        const data = await response.json();

        const list = document.getElementById('integrations-list');
        if (data.integrations.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No integrations yet. Add your first one!</p>';
            return;
        }

        list.innerHTML = data.integrations.map(int => `
            <div class="integration-card">
                <div>
                    <h3>${int.toolName}</h3>
                    <div class="meta">Connected on ${new Date(int.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="status-badge">${int.status}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading integrations:', error);
    }
}

function showAddIntegration() {
    document.getElementById('add-modal').classList.remove('hidden');
    currentStep = 1;
    updateStepDisplay();

    // Clear search
    document.getElementById('tool-search').value = '';
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('tool-not-found').style.display = 'none';
}

function searchTool(query) {
    const searchResults = document.getElementById('search-results');
    const notFound = document.getElementById('tool-not-found');

    if (!query || query.trim().length < 2) {
        searchResults.style.display = 'none';
        notFound.style.display = 'none';
        return;
    }

    query = query.trim().toLowerCase();

    // Search in existing integrations
    const matches = EXISTING_INTEGRATIONS.filter(tool =>
        tool.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
        // Show matches
        searchResults.style.display = 'block';
        notFound.style.display = 'none';

        searchResults.innerHTML = matches.map(tool => `
            <div style="padding: 1rem; border-bottom: 1px solid var(--border); cursor: pointer; hover:background: var(--bg);"
                 onmouseover="this.style.background='var(--bg)'"
                 onmouseout="this.style.background='transparent'"
                 onclick="alert('${tool} is already available as a native integration!')">
                <strong>${tool}</strong>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Native Integration</div>
            </div>
        `).join('');
    } else {
        // Not found - show AI generation option
        searchResults.style.display = 'none';
        notFound.style.display = 'block';

        // Save the tool name for later
        currentTool.toolName = query.charAt(0).toUpperCase() + query.slice(1);
    }
}

function proceedWithAIGeneration() {
    // Show step 1b (AI generation form)
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-1b').classList.remove('hidden');
    document.getElementById('ai-tool-name').textContent = currentTool.toolName;
}

function hideAddIntegration() {
    document.getElementById('add-modal').classList.add('hidden');
    resetForm();
}

function resetForm() {
    // Clear all inputs
    const toolSearch = document.getElementById('tool-search');
    if (toolSearch) toolSearch.value = '';

    const apiDocsUrl = document.getElementById('api-docs-url');
    if (apiDocsUrl) apiDocsUrl.value = '';

    const apiKey = document.getElementById('api-key');
    if (apiKey) apiKey.value = '';

    // Hide search results and not-found message
    const searchResults = document.getElementById('search-results');
    if (searchResults) searchResults.style.display = 'none';

    const notFound = document.getElementById('tool-not-found');
    if (notFound) notFound.style.display = 'none';

    // Reset step-1b visibility
    const step1b = document.getElementById('step-1b');
    if (step1b) step1b.classList.add('hidden');

    currentStep = 1;
    currentTool = {};
    analysis = null;
    generatedCode = null;
    updateStepDisplay();
}

function updateStepDisplay() {
    // Hide all main steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) step.classList.add('hidden');
    }

    // Also hide step-1b
    const step1b = document.getElementById('step-1b');
    if (step1b) step1b.classList.add('hidden');

    // Show current step
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    if (currentStepEl) currentStepEl.classList.remove('hidden');

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.remove('active', 'complete');
        if (index + 1 < currentStep) {
            step.classList.add('complete');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}

async function analyzeAPI() {
    const apiDocsUrl = document.getElementById('api-docs-url').value.trim();

    if (!apiDocsUrl) {
        alert('Please enter the API documentation URL');
        return;
    }

    // toolName is already set in currentTool from the search
    if (!currentTool.toolName) {
        alert('Tool name is missing');
        return;
    }

    const toolName = currentTool.toolName;
    currentTool.apiDocsUrl = apiDocsUrl;

    // Hide step-1b, move to step 2
    document.getElementById('step-1b').classList.add('hidden');
    currentStep = 2;
    updateStepDisplay();

    const statusBox = document.getElementById('ai-status');
    const statusText = document.getElementById('ai-status-text');

    // Progress steps based on developer mode
    const customerSteps = [
        { text: '📖 Reading your API documentation...', duration: 2000 },
        { text: '🔐 Setting up authentication...', duration: 2000 },
        { text: '⚙️ Generating your integration...', duration: 2500 },
        { text: '✅ Testing connection...', duration: 2000 },
        { text: '🎉 Almost ready...', duration: 1000 }
    ];

    const developerSteps = [
        { text: '📖 Reading API documentation...', duration: 1500 },
        { text: '🔍 Understanding authentication methods...', duration: 1200 },
        { text: '🔗 Extracting API endpoints...', duration: 1000 },
        { text: '📊 Analyzing data models...', duration: 1000 },
        { text: '⚙️ Generating integration code...', duration: 1500 },
        { text: '🔐 Setting up authentication flow...', duration: 1200 },
        { text: '🧪 Running automated tests...', duration: 1200 },
        { text: '📊 Calculating confidence score...', duration: 800 },
        { text: '✅ Finalizing evaluation...', duration: 600 }
    ];

    const steps = developerMode ? developerSteps : customerSteps;

    try {
        // Show progress through steps
        for (let i = 0; i < steps.length; i++) {
            statusText.innerHTML = `
                <div style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">${steps[i].text}</div>
                <div style="color: var(--text-secondary); font-size: 0.875rem;">Step ${i + 1} of ${steps.length}</div>
            `;
            await new Promise(resolve => setTimeout(resolve, steps[i].duration));
        }

        // Actual API calls (run during the animation)
        const analyzePromise = fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolName, apiDocsUrl })
        });

        const analyzeResponse = await analyzePromise;
        const analyzeData = await analyzeResponse.json();

        if (!analyzeData.success) {
            throw new Error(analyzeData.error || 'Analysis failed');
        }

        analysis = analyzeData.analysis;

        const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolName, analysis })
        });

        const generateData = await generateResponse.json();
        if (!generateData.success) {
            throw new Error(generateData.error || 'Code generation failed');
        }

        generatedCode = generateData.code;

        // Calculate confidence score (simulated AI evaluation)
        const confidenceScore = calculateConfidenceScore();
        currentTool.confidenceScore = confidenceScore;
        currentTool.evaluation = confidenceScore.breakdown;

        // Success! Show summary
        statusBox.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: linear-gradient(135deg, #3DD598, #3BB581); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; box-shadow: 0 8px 24px rgba(61, 213, 152, 0.3);">✓</div>
                <h3 style="margin-bottom: 0.5rem;">Integration Ready!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                    ${toolName} integration has been successfully generated
                </p>
                <div style="background: rgba(102, 126, 234, 0.05); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 12px; padding: 1rem; text-align: left; margin-bottom: 1rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Detected Capabilities:</div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                        <div>✓ User management & authentication</div>
                        <div>✓ Data synchronization</div>
                        <div>✓ Real-time updates</div>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="currentStep = 3; updateStepDisplay();" style="width: 100%;">
                    Continue to Test Connection
                </button>
            </div>
        `;

    } catch (error) {
        statusBox.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 64px; height: 64px; margin: 0 auto 1rem; background: linear-gradient(135deg, #FF6B6B, #EE5A52); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white;">✗</div>
                <h3 style="color: var(--danger); margin-bottom: 0.5rem;">Generation Failed</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${error.message}</p>
                <button class="btn btn-secondary" onclick="currentStep = 1; updateStepDisplay()">Try Again</button>
            </div>
        `;
    }
}

async function testConnection() {
    const apiKey = document.getElementById('api-key').value.trim();

    if (!apiKey) {
        alert('Please enter an API key to test the connection');
        return;
    }

    // Move to step 4 (test results)
    currentStep = 4;
    updateStepDisplay();

    const resultsDiv = document.getElementById('test-results');
    const toolName = currentTool.toolName;

    // Show testing progress
    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="loader" style="margin: 0 auto 1rem;"></div>
            <p style="font-weight: 600; margin-bottom: 0.5rem;">Testing connection to ${toolName}...</p>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Verifying API credentials</p>
        </div>
    `;

    // Simulate testing (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get confidence score from currentTool
    const score = currentTool.confidenceScore || { total: 93.25, breakdown: {}, deployment: {} };
    const eval = score.breakdown;

    // Show test results based on mode
    if (developerMode) {
        // DEVELOPER MODE: Show detailed technical evaluation
        resultsDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 80px; height: 80px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, #3DD598, #3BB581); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; box-shadow: 0 8px 24px rgba(61, 213, 152, 0.3);">✓</div>
            <h3 style="margin-bottom: 0.5rem;">Connection Successful!</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                Successfully connected to ${toolName} API
            </p>

            <!-- AI Evaluation Score -->
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(167, 139, 250, 0.05)); border: 2px solid ${score.deployment.color}; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">AI EVALUATION RESULTS</div>

                <div style="display: flex; align-items: center; justify-content: center; gap: 2rem; margin-bottom: 1.5rem;">
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Confidence Score</div>
                        <div style="font-size: 3rem; font-weight: 800; background: linear-gradient(135deg, ${score.deployment.color}, ${score.deployment.color}dd); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${score.total}%</div>
                    </div>
                    <div style="width: 1px; height: 60px; background: var(--border);"></div>
                    <div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Deployment Path</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: ${score.deployment.color};">${score.deployment.path}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${score.deployment.time}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.75rem; text-align: left;">
                    <div style="background: white; padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">Code Quality</div>
                        <div style="font-weight: 700; color: var(--text);">${eval.codeQuality || 95}/100 <span style="font-weight: 400; color: var(--text-secondary);">(25%)</span></div>
                    </div>
                    <div style="background: white; padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">Functional Tests</div>
                        <div style="font-weight: 700; color: var(--text);">${eval.functionalTests || 92}/100 <span style="font-weight: 400; color: var(--text-secondary);">(30%)</span></div>
                    </div>
                    <div style="background: white; padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">API Compliance</div>
                        <div style="font-weight: 700; color: var(--text);">${eval.apiCompliance || 98}/100 <span style="font-weight: 400; color: var(--text-secondary);">(20%)</span></div>
                    </div>
                    <div style="background: white; padding: 0.75rem; border-radius: 8px;">
                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">Pattern Recognition</div>
                        <div style="font-weight: 700; color: var(--text);">${eval.patternRecognition || 88}/100 <span style="font-weight: 400; color: var(--text-secondary);">(15%)</span></div>
                    </div>
                    <div style="background: white; padding: 0.75rem; border-radius: 8px; grid-column: 1 / -1;">
                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">Risk Assessment</div>
                        <div style="font-weight: 700; color: var(--text);">${eval.riskAssessment || 91}/100 <span style="font-weight: 400; color: var(--text-secondary);">(10%)</span></div>
                    </div>
                </div>
            </div>

            <!-- Test Results Preview -->
            <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: left;">
                <div style="font-weight: 600; margin-bottom: 1rem; text-align: center;">Test Data Preview</div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">USERS FOUND</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">48</div>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">ACTIVE USERS</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">43</div>
                    </div>
                </div>

                <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.875rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Sample Users Retrieved:</div>
                    <div style="color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem;">
                        <div>• Sarah Johnson (sarah.j@company.com) - Active</div>
                        <div>• Michael Chen (m.chen@company.com) - Active</div>
                        <div>• Emily Rodriguez (emily.r@company.com) - Inactive 94d</div>
                    </div>
                </div>
            </div>

            <!-- Mode Selection -->
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(167, 139, 250, 0.05)); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div style="font-weight: 600; margin-bottom: 1rem;">Ready to go live?</div>
                <div style="display: grid; gap: 0.75rem; text-align: left; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: start; gap: 0.5rem;">
                        <span>✓</span>
                        <span>Connection verified and working</span>
                    </div>
                    <div style="display: flex; align-items: start; gap: 0.5rem;">
                        <span>✓</span>
                        <span>Test data retrieved successfully</span>
                    </div>
                    <div style="display: flex; align-items: start; gap: 0.5rem;">
                        <span>✓</span>
                        <span>Integration ready for production use</span>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="currentStep = 3; updateStepDisplay();" style="flex: 1;">
                        Test Again
                    </button>
                    <button class="btn btn-primary" onclick="goLive()" style="flex: 1;">
                        Go Live
                    </button>
                </div>
            </div>
        </div>
    `;
    } else {
        // CUSTOMER MODE: Simple, friendly view
        resultsDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 80px; height: 80px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, #3DD598, #3BB581); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; box-shadow: 0 8px 24px rgba(61, 213, 152, 0.3);">✓</div>
            <h3 style="margin-bottom: 0.5rem;">Your Integration is Ready!</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                Successfully connected to ${toolName}
            </p>

            <!-- Simple Preview -->
            <div style="background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: left;">
                <div style="font-weight: 600; margin-bottom: 1rem; text-align: center;">Preview</div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">USERS FOUND</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">48</div>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">ACTIVE USERS</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">43</div>
                    </div>
                </div>

                <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.875rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">Sample Data:</div>
                    <div style="color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.25rem;">
                        <div>• Sarah Johnson (sarah.j@company.com)</div>
                        <div>• Michael Chen (m.chen@company.com)</div>
                        <div>• Emily Rodriguez (emily.r@company.com)</div>
                    </div>
                </div>
            </div>

            <!-- Simple Go Live Section -->
            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(167, 139, 250, 0.05)); border: 1px solid rgba(102, 126, 234, 0.2); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div style="font-weight: 600; margin-bottom: 1rem;">Everything looks good!</div>
                <div style="display: grid; gap: 0.75rem; text-align: left; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: start; gap: 0.5rem;">
                        <span>✓</span>
                        <span>Connection verified</span>
                    </div>
                    <div style="display: flex; align-items: start; gap: 0.5rem;">
                        <span>✓</span>
                        <span>Sample data loaded successfully</span>
                    </div>
                    <div style="display: flex; align-items: start; gap: 0.5rem;">
                        <span>✓</span>
                        <span>Ready to go live</span>
                    </div>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="currentStep = 3; updateStepDisplay();" style="flex: 1;">
                        Test Again
                    </button>
                    <button class="btn btn-primary" onclick="goLive()" style="flex: 1;">
                        Go Live
                    </button>
                </div>
            </div>
        </div>
    `;
    }
}

async function goLive() {
    // Save tool info BEFORE hiding modal (which resets it)
    const toolInfo = { ...currentTool };

    // Hide modal
    document.getElementById('add-modal').classList.add('hidden');

    // Add to dashboard using saved info
    addIntegrationToDashboard(toolInfo);

    // Show success notification
    showNotification(`🎉 ${toolInfo.toolName} is now live! Click "Import Data" to sync.`);
}

function addIntegrationToDashboard(toolInfo) {
    if (!toolInfo || !toolInfo.toolName) {
        console.error('No tool info available');
        return;
    }

    const integrationsList = document.getElementById('integrations-list');
    const toolName = toolInfo.toolName;

    const newIntegrationCard = `
        <div class="integration-card" id="integration-${toolName}" style="border: 2px solid var(--primary); animation: slideIn 0.3s ease-out;">
            <div class="integration-icon" style="background: var(--accent-bg); color: var(--primary); font-size: 1.5rem;">◆</div>
            <div class="integration-info">
                <h3>${toolName}</h3>
                <div class="integration-meta">
                    <span>🔗 Connected just now</span>
                    <span style="margin-left: 1rem;">⚙️ Ready to sync</span>
                </div>
            </div>
            <div class="integration-actions">
                <button class="btn btn-primary" onclick="promptImportData('${toolName}')">
                    Import Data
                </button>
                <div class="status-badge" style="background: var(--accent-bg); color: var(--primary);">New</div>
            </div>
        </div>
    `;

    // Clear "no integrations" message if present
    if (integrationsList.innerHTML.includes('No integrations yet') ||
        integrationsList.innerHTML.includes('no integrations yet') ||
        integrationsList.innerHTML.trim() === '') {
        integrationsList.innerHTML = newIntegrationCard;
    } else {
        integrationsList.insertAdjacentHTML('afterbegin', newIntegrationCard);
    }

    // Show notification
    showNotification(`${toolName} integration connected! Click "Import Data" to sync users and events.`);
}


function calculateConfidenceScore() {
    // Simulate AI evaluation with 5 weighted criteria
    // Generate realistic scores (80-98 range with some variation)

    const codeQuality = 90 + Math.floor(Math.random() * 8); // 90-98
    const functionalTests = 85 + Math.floor(Math.random() * 10); // 85-95
    const apiCompliance = 92 + Math.floor(Math.random() * 7); // 92-99
    const patternRecognition = 82 + Math.floor(Math.random() * 12); // 82-94
    const riskAssessment = 88 + Math.floor(Math.random() * 10); // 88-98

    // Calculate weighted total
    const total = (
        (codeQuality * 0.25) +
        (functionalTests * 0.30) +
        (apiCompliance * 0.20) +
        (patternRecognition * 0.15) +
        (riskAssessment * 0.10)
    );

    const roundedTotal = Math.round(total * 100) / 100;

    // Determine deployment path
    let deploymentPath, deploymentTime, deploymentColor;
    if (roundedTotal >= 90) {
        deploymentPath = 'Auto-Deploy';
        deploymentTime = '15-20 min';
        deploymentColor = '#3DD598';
    } else if (roundedTotal >= 70) {
        deploymentPath = 'Quick Review';
        deploymentTime = '30-45 min';
        deploymentColor = '#FFB84D';
    } else {
        deploymentPath = 'Full Review';
        deploymentTime = '2-4 hours';
        deploymentColor = '#FF6B6B';
    }

    return {
        total: roundedTotal,
        breakdown: {
            codeQuality,
            functionalTests,
            apiCompliance,
            patternRecognition,
            riskAssessment
        },
        deployment: {
            path: deploymentPath,
            time: deploymentTime,
            color: deploymentColor
        }
    };
}

function promptImportData(toolName) {
    const card = document.getElementById(`integration-${toolName}`);

    // Show loading state
    card.innerHTML = `
        <div class="integration-icon" style="background: var(--accent-bg); color: var(--primary);">◆</div>
        <div class="integration-info">
            <h3>${toolName}</h3>
            <div class="integration-meta">
                <span>🔄 Importing data...</span>
            </div>
        </div>
        <div class="loader" style="width: 30px; height: 30px; border-width: 3px;"></div>
    `;

    // Simulate data import (2 seconds)
    setTimeout(() => {
        card.innerHTML = `
            <div class="integration-icon" style="background: var(--accent-bg); color: var(--primary);">◆</div>
            <div class="integration-info">
                <h3>${toolName}</h3>
                <div class="integration-meta">
                    <span>📊 48 users</span>
                    <span style="margin-left: 1rem;">⏱️ 5 inactive (90+ days)</span>
                    <span style="margin-left: 1rem;">🔗 Synced</span>
                </div>
            </div>
            <div class="integration-actions">
                <div class="savings-pill">Save $40/mo</div>
                <div class="status-badge status-connected">Connected</div>
            </div>
        `;

        // Make card clickable
        card.style.cursor = 'pointer';
        card.onclick = () => showIntegrationDetail(toolName);

        showNotification(`✓ Successfully imported 48 users and 127 events from ${toolName}`);
    }, 2000);
}

function showIntegrationDetail(toolName) {
    // Hide main view and show detail view
    document.getElementById('main-view').classList.add('hidden');

    // Create detail view if it doesn't exist
    let detailView = document.getElementById('integration-detail-view');
    if (!detailView) {
        detailView = document.createElement('div');
        detailView.id = 'integration-detail-view';
        document.querySelector('.container').appendChild(detailView);
    }

    detailView.classList.remove('hidden');
    detailView.innerHTML = `
        <button class="btn btn-secondary" onclick="backToDashboard()" style="margin-bottom: 1.5rem;">
            ← Back to Dashboard
        </button>

        <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
            <div class="integration-icon" style="width: 72px; height: 72px; font-size: 2.5rem; background: var(--accent-bg); color: var(--primary);">◆</div>
            <div>
                <h1 style="margin-bottom: 0.5rem;">${toolName}</h1>
                <div style="color: var(--text-secondary);">
                    <span>🔗 Connected and syncing</span>
                    <span style="margin-left: 1rem;">📅 Last synced 2 minutes ago</span>
                </div>
            </div>
        </div>

        <!-- Metrics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="metric-card">
                <div class="metric-label">Total Users</div>
                <div class="metric-value">48</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Active Users</div>
                <div class="metric-value" style="color: var(--success);">43</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Inactive (90+ days)</div>
                <div class="metric-value" style="color: var(--warning);">5</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Cost per User</div>
                <div class="metric-value">$8/mo</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Total Monthly Cost</div>
                <div class="metric-value">$384</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Potential Savings</div>
                <div class="metric-value" style="color: var(--success);">$40/mo</div>
            </div>
        </div>

        <!-- Cost Savings Breakdown -->
        <div style="background: linear-gradient(135deg, var(--accent-bg), #fff); border: 1px solid var(--primary); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
            <h2 style="margin-bottom: 1rem;">💰 Cost Optimization Opportunities</h2>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; padding: 1rem; background: var(--surface); border-radius: 8px;">
                    <div>
                        <strong>Inactive Users</strong>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">5 users haven't logged in for 90+ days</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--success);">$40/mo</div>
                        <button class="btn btn-primary btn-sm">Deactivate All</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inactive Users List -->
        <h2 style="margin-bottom: 1rem;">⏱️ Inactive Users (90+ days)</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Last Active</th>
                        <th>Cost</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${[
                        { name: 'Emily Rodriguez', email: 'emily.r@company.com', days: 94 },
                        { name: 'David Kim', email: 'd.kim@company.com', days: 120 },
                        { name: 'Rachel Patel', email: 'r.patel@company.com', days: 103 },
                        { name: 'Alex Chen', email: 'alex.c@company.com', days: 91 },
                        { name: 'Jordan Taylor', email: 'j.taylor@company.com', days: 156 }
                    ].map(user => `
                        <tr>
                            <td><strong>${user.name}</strong></td>
                            <td style="color: var(--text-secondary);">${user.email}</td>
                            <td style="color: var(--warning);">${user.days} days ago</td>
                            <td style="font-family: 'JetBrains Mono', monospace;">$8/mo</td>
                            <td><button class="btn btn-secondary btn-sm">Deactivate</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function backToDashboard() {
    document.getElementById('main-view').classList.remove('hidden');
    const detailView = document.getElementById('integration-detail-view');
    if (detailView) {
        detailView.classList.add('hidden');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: var(--surface);
        border: 1px solid var(--primary);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Keep the old function for the complete modal step
function OLD_connectIntegration() {
    currentStep = 4;
    updateStepDisplay();

    document.getElementById('integration-summary').innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem;">
                ✓
            </div>
            <h2 style="margin-bottom: 0.5rem;">${currentTool.toolName} Integration Ready!</h2>
            <p style="color: var(--text-secondary);">Here's how it will appear in your CloudEagle dashboard</p>
        </div>

        <!-- CloudEagle Dashboard Preview -->
        <div style="background: var(--bg); border: 2px dashed var(--border); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
            <h3 style="font-size: 0.875rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 1rem; letter-spacing: 0.05em;">Your CloudEagle Dashboard</h3>

            <!-- Integration Card -->
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">${currentTool.toolName}</h3>
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">
                            <span>📊 48 users</span>
                            <span style="margin-left: 1rem;">⏱️ 5 inactive (90+ days)</span>
                            <span style="margin-left: 1rem;">🔗 Connected via AI</span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: var(--accent-bg); color: var(--primary); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; margin-bottom: 0.5rem;">
                            Save $40/mo
                        </div>
                        <div style="background: #ecfdf5; color: var(--success); padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.875rem;">
                            Connected
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sample Users Preview -->
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">Discovered Users</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${[
                        { name: 'Sarah Johnson', email: 'sarah.j@company.com', status: 'Active', days: '2 days ago' },
                        { name: 'Michael Chen', email: 'm.chen@company.com', status: 'Active', days: '5 days ago' },
                        { name: 'Emily Rodriguez', email: 'emily.r@company.com', status: 'Inactive', days: '94 days ago' },
                        { name: 'David Kim', email: 'd.kim@company.com', status: 'Inactive', days: '120 days ago' }
                    ].map(user => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg); border-radius: 8px;">
                            <div>
                                <div style="font-weight: 500;">${user.name}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">${user.email}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.75rem; color: ${user.status === 'Active' ? 'var(--success)' : 'var(--warning)'};">
                                    ${user.status}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                    ${user.days}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Import Action -->
        <div style="background: linear-gradient(135deg, var(--accent-bg), #fff); border: 2px solid var(--primary); border-radius: 12px; padding: 2rem; text-align: center;">
            <h3 style="margin-bottom: 0.5rem;">Ready to Import Data?</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                Connect this integration to your CloudEagle account to start tracking licenses and optimizing costs
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button class="btn btn-primary" style="min-width: 150px;">
                    Import to CloudEagle
                </button>
                <button class="btn btn-secondary" onclick="completeIntegration()" style="min-width: 150px;">
                    Done
                </button>
            </div>
        </div>
    `;
}

function completeIntegration() {
    hideAddIntegration();
    // Don't reload integrations - they're already on the dashboard
}

function prevStep() {
    if (currentStep > 1) {
        // Skip step 2 when going back from step 3 (go back to step 1)
        if (currentStep === 3) {
            currentStep = 1;
        } else {
            currentStep--;
        }
        updateStepDisplay();
    }
}
