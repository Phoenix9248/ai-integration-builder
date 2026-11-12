let currentStep = 1;
let currentTool = {};
let analysis = null;
let generatedCode = null;

// Load on page load
document.addEventListener('DOMContentLoaded', () => {
    loadIntegrations();
});

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
}

function hideAddIntegration() {
    document.getElementById('add-modal').classList.add('hidden');
    resetForm();
}

function resetForm() {
    document.getElementById('tool-name').value = '';
    document.getElementById('api-docs-url').value = '';
    document.getElementById('api-key').value = '';
    currentStep = 1;
    currentTool = {};
    analysis = null;
    generatedCode = null;
    updateStepDisplay();
}

function updateStepDisplay() {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) step.classList.add('hidden');
    }

    // Show current step
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    if (currentStepEl) currentStepEl.classList.remove('hidden');

    // Update progress
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
    const toolName = document.getElementById('tool-name').value.trim();
    const apiDocsUrl = document.getElementById('api-docs-url').value.trim();

    if (!toolName || !apiDocsUrl) {
        alert('Please fill in both fields');
        return;
    }

    currentTool = { toolName, apiDocsUrl };
    currentStep = 2;
    updateStepDisplay();

    const statusText = document.getElementById('ai-status-text');

    try {
        // Step 1: Analyze API
        statusText.textContent = 'AI is analyzing the API documentation...';

        const analyzeResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolName, apiDocsUrl })
        });

        const analyzeData = await analyzeResponse.json();
        if (!analyzeData.success) {
            throw new Error(analyzeData.error || 'Analysis failed');
        }

        analysis = analyzeData.analysis;

        // Step 2: Generate Code
        statusText.textContent = 'AI is generating integration code...';

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

        // Success! Move to connect step
        currentStep = 3;
        updateStepDisplay();
        document.getElementById('tool-name-display').textContent = toolName;

    } catch (error) {
        document.getElementById('ai-status').innerHTML = `
            <div style="color: red; text-align: center;">
                <p>❌ Error: ${error.message}</p>
                <button class="btn btn-secondary" onclick="currentStep = 1; updateStepDisplay()">Try Again</button>
            </div>
        `;
    }
}

async function connectIntegration() {
    const apiKey = document.getElementById('api-key').value.trim();

    if (!apiKey) {
        alert('Please enter an API key (any value works for demo)');
        return;
    }

    // Save integration and go to dashboard
    hideAddIntegration();
    showDashboardWithNewIntegration();
}

function showDashboardWithNewIntegration() {
    // Add the new integration to the list
    const integrationsList = document.getElementById('integrations-list');

    const newIntegrationCard = `
        <div class="integration-card" id="integration-${currentTool.toolName}" style="border: 2px solid var(--primary); animation: slideIn 0.3s ease-out;">
            <div class="integration-icon" style="background: var(--accent-bg); color: var(--primary); font-size: 1.5rem;">◆</div>
            <div class="integration-info">
                <h3>${currentTool.toolName}</h3>
                <div class="integration-meta">
                    <span>🔗 Connected just now</span>
                    <span style="margin-left: 1rem;">⚙️ Ready to sync</span>
                </div>
            </div>
            <div class="integration-actions">
                <button class="btn btn-primary" onclick="promptImportData('${currentTool.toolName}')">
                    Import Data
                </button>
                <div class="status-badge" style="background: var(--accent-bg); color: var(--primary);">New</div>
            </div>
        </div>
    `;

    if (integrationsList.innerHTML.includes('No integrations yet')) {
        integrationsList.innerHTML = newIntegrationCard;
    } else {
        integrationsList.insertAdjacentHTML('afterbegin', newIntegrationCard);
    }

    // Show notification
    showNotification(`${currentTool.toolName} integration connected! Click "Import Data" to sync users and events.`);
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

        showNotification(`✓ Successfully imported 48 users and 127 events from ${toolName}`);
    }, 2000);
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
    loadIntegrations();
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}
