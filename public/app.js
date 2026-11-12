let currentStep = 1;
let currentTool = {};
let analysis = null;
let generatedCode = null;

// Load integrations on page load
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
    for (let i = 1; i <= 5; i++) {
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

    document.getElementById('analysis-status').classList.remove('hidden');
    document.getElementById('analysis-result').classList.add('hidden');

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toolName, apiDocsUrl })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Analysis failed');
        }

        analysis = data.analysis;

        document.getElementById('analysis-status').classList.add('hidden');
        document.getElementById('analysis-result').classList.remove('hidden');
        document.getElementById('analysis-result').innerHTML = `
            <div class="result-box">
                <h3>✓ Analysis Complete</h3>
                <p><strong>Auth Method:</strong> ${analysis.authMethod}</p>
                <p><strong>Base URL:</strong> ${analysis.baseUrl}</p>
                <p><strong>Endpoints Found:</strong> ${Object.keys(analysis.endpoints || {}).length}</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="generateCode()">Generate Integration Code</button>
            </div>
        `;
    } catch (error) {
        document.getElementById('analysis-status').innerHTML = `
            <div style="color: red;">
                <p>❌ Error: ${error.message}</p>
                <button class="btn btn-secondary" onclick="currentStep = 1; updateStepDisplay()">Try Again</button>
            </div>
        `;
    }
}

async function generateCode() {
    currentStep = 3;
    updateStepDisplay();

    document.getElementById('generation-status').classList.remove('hidden');
    document.getElementById('generation-result').classList.add('hidden');

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolName: currentTool.toolName,
                analysis
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Code generation failed');
        }

        generatedCode = data.code;

        document.getElementById('generation-status').classList.add('hidden');
        document.getElementById('generation-result').classList.remove('hidden');
        document.getElementById('generation-result').innerHTML = `
            <div class="result-box">
                <h3>✓ Integration Code Generated</h3>
                <p>Successfully generated integration class for ${currentTool.toolName}</p>
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: 500;">View Generated Code</summary>
                    <pre style="margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 4px; overflow-x: auto; font-size: 0.75rem;">${generatedCode}</pre>
                </details>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="currentStep = 4; updateStepDisplay(); document.getElementById('tool-name-display').textContent = currentTool.toolName;">Connect with API Key</button>
            </div>
        `;
    } catch (error) {
        document.getElementById('generation-status').innerHTML = `
            <div style="color: red;">
                <p>❌ Error: ${error.message}</p>
                <button class="btn btn-secondary" onclick="currentStep = 2; updateStepDisplay()">Try Again</button>
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

        currentStep = 5;
        updateStepDisplay();

        if (testData.success && testData.result.authenticated) {
            document.getElementById('integration-summary').innerHTML = `
                Successfully connected to ${currentTool.toolName}!<br>
                Found ${testData.result.userCount} users and ${testData.result.eventCount} events.
            `;
        } else {
            document.getElementById('integration-summary').innerHTML = `
                Integration saved, but connection test had issues:<br>
                ${testData.result.error || 'Unknown error'}
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
