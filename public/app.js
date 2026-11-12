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
        alert('Please enter your API key');
        return;
    }

    try {
        // Save integration
        const saveResponse = await fetch('/api/integrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolName: currentTool.toolName,
                code: generatedCode,
                apiKey
            })
        });

        const saveData = await saveResponse.json();

        if (!saveData.success) {
            throw new Error(saveData.error || 'Failed to save integration');
        }

        // Test integration
        const testResponse = await fetch(`/api/integrations/${saveData.integration.id}/test`, {
            method: 'POST'
        });

        const testData = await testResponse.json();

        currentStep = 4;
        updateStepDisplay();

        if (testData.success && testData.result.authenticated) {
            const isDemoData = testData.result.demo === true;
            const demoNotice = isDemoData ? '<div style="background: var(--accent-bg); color: var(--primary); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.875rem;">✨ Demo Mode: Showing sample data (real API connection failed or invalid key)</div>' : '';

            document.getElementById('integration-summary').innerHTML = `
                ${demoNotice}
                <h3 style="margin-bottom: 1rem;">✓ ${currentTool.toolName} Connected!</h3>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="background: var(--accent-bg); padding: 1rem; border-radius: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">Users</div>
                        <div style="font-size: 2rem; font-weight: 600; color: var(--primary);">${testData.result.userCount}</div>
                    </div>
                    <div style="background: var(--accent-bg); padding: 1rem; border-radius: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.875rem;">Events</div>
                        <div style="font-size: 2rem; font-weight: 600; color: var(--primary);">${testData.result.eventCount}</div>
                    </div>
                </div>

                <details open style="margin-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">Recent Users</summary>
                    <div style="background: var(--bg); border-radius: 8px; padding: 0.5rem; max-height: 200px; overflow-y: auto;">
                        ${testData.result.users && testData.result.users.length > 0 ?
                            testData.result.users.map(u => `
                                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border);">
                                    <strong>${u.name || u.email || u.id}</strong>
                                    ${u.email ? `<br><small style="color: var(--text-secondary);">${u.email}</small>` : ''}
                                    ${u.role ? `<span style="margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: var(--accent-bg); color: var(--primary); border-radius: 4px; font-size: 0.75rem;">${u.role}</span>` : ''}
                                </div>
                            `).join('') :
                            '<p style="color: var(--text-secondary); padding: 1rem;">No users found</p>'
                        }
                    </div>
                </details>

                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">Recent Events</summary>
                    <div style="background: var(--bg); border-radius: 8px; padding: 0.5rem; max-height: 200px; overflow-y: auto;">
                        ${testData.result.events && testData.result.events.length > 0 ?
                            testData.result.events.map(e => `
                                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border);">
                                    <strong>${e.title || e.name || e.id}</strong>
                                    ${e.date ? `<br><small style="color: var(--text-secondary);">📅 ${e.date}</small>` : ''}
                                    ${e.attendees ? `<small style="color: var(--text-secondary); margin-left: 1rem;">👥 ${e.attendees} attendees</small>` : ''}
                                </div>
                            `).join('') :
                            '<p style="color: var(--text-secondary); padding: 1rem;">No events found</p>'
                        }
                    </div>
                </details>
            `;
        } else {
            document.getElementById('integration-summary').innerHTML = `
                <div style="color: var(--warning); text-align: center;">
                    ⚠️ Connection test had issues<br>
                    <small>${testData.result.error || 'Unknown error'}</small>
                </div>
            `;
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
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
