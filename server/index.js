require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { analyzeAPI, generateIntegrationCode } = require('./llm');
const { saveIntegration, getIntegrations, testIntegration } = require('./integrations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.post('/api/analyze', async (req, res) => {
  try {
    const { toolName, apiDocsUrl } = req.body;
    const apiKey = req.headers['x-hf-token'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Hugging Face token is required. Please provide it in the X-HF-Token header.'
      });
    }

    console.log(`Analyzing ${toolName} API docs...`);
    const analysis = await analyzeAPI(toolName, apiDocsUrl, apiKey);

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { toolName, analysis } = req.body;
    const apiKey = req.headers['x-hf-token'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Hugging Face token is required. Please provide it in the X-HF-Token header.'
      });
    }

    console.log(`Generating integration code for ${toolName}...`);
    const code = await generateIntegrationCode(toolName, analysis, apiKey);

    res.json({ success: true, code });
  } catch (error) {
    console.error('Code generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/integrations', async (req, res) => {
  try {
    const { toolName, code, apiKey } = req.body;

    const integration = await saveIntegration(toolName, code, apiKey);

    res.json({ success: true, integration });
  } catch (error) {
    console.error('Save integration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/integrations', (req, res) => {
  const integrations = getIntegrations();
  res.json({ success: true, integrations });
});

app.post('/api/integrations/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await testIntegration(id);

    res.json({ success: true, result });
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Integration Builder running on http://localhost:${PORT}`);
});
