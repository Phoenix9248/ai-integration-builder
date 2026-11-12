const axios = require('axios');

const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct';

async function callHuggingFace(prompt, apiKey) {
  const response = await axios.post(
    HF_API_URL,
    {
      inputs: prompt,
      parameters: {
        max_new_tokens: 2000,
        temperature: 0.3,
        return_full_text: false
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data && response.data[0] && response.data[0].generated_text) {
    return response.data[0].generated_text;
  }

  throw new Error('Invalid response from Hugging Face API');
}

async function fetchAPIDoc(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIIntegrationBuilder/1.0)'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching API docs:', error.message);
    throw new Error(`Could not fetch API documentation from ${url}`);
  }
}

async function analyzeAPI(toolName, apiDocsUrl, apiKey) {
  console.log(`Fetching API docs from: ${apiDocsUrl}`);

  let apiDocContent;
  try {
    apiDocContent = await fetchAPIDoc(apiDocsUrl);
  } catch (error) {
    apiDocContent = `API documentation URL: ${apiDocsUrl}`;
  }

  const prompt = `You are an API integration expert. Analyze the following API documentation for ${toolName} and extract key information.

API Documentation:
${typeof apiDocContent === 'string' ? apiDocContent.substring(0, 6000) : JSON.stringify(apiDocContent).substring(0, 6000)}

Extract and return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "authMethod": "API_KEY or OAUTH2 or BEARER",
  "baseUrl": "the API base URL",
  "endpoints": {
    "users": {"method": "GET", "path": "/users", "description": "Get users"},
    "events": {"method": "GET", "path": "/events", "description": "Get events"}
  },
  "authHeader": "Authorization: Bearer TOKEN or X-API-Key: TOKEN",
  "rateLimit": "rate limit if available"
}

Return only the JSON object, nothing else.`;

  const responseText = await callHuggingFace(prompt, apiKey);

  // Extract JSON from response
  let jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Try to find JSON more aggressively
    const lines = responseText.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        try {
          const analysis = JSON.parse(line.trim());
          console.log('API Analysis complete:', analysis);
          return analysis;
        } catch (e) {
          // Continue searching
        }
      }
    }
    throw new Error('Could not parse API analysis response');
  }

  const analysis = JSON.parse(jsonMatch[0]);
  console.log('API Analysis complete:', analysis);
  return analysis;
}

async function generateIntegrationCode(toolName, analysis, apiKey) {
  const prompt = `Generate a complete JavaScript integration class for ${toolName}.

API Analysis:
${JSON.stringify(analysis, null, 2)}

Requirements:
- Class name: ${toolName}Integration
- Constructor takes apiKey parameter
- Include authenticate(), getUsers(), getEvents() methods
- Use axios for HTTP requests
- Handle errors with try/catch
- Return promises
- No comments

Generate ONLY the JavaScript code, no markdown, no explanations.

Example structure:
class ${toolName}Integration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = '${analysis.baseUrl || 'https://api.example.com'}';
  }

  async authenticate() {
    const axios = require('axios');
    const response = await axios.get(this.baseUrl + '/auth', {
      headers: { '${analysis.authHeader?.split(':')[0] || 'Authorization'}': '${analysis.authMethod === 'BEARER' ? 'Bearer ' : ''}' + this.apiKey }
    });
    return response.data;
  }

  async getUsers() {
    const axios = require('axios');
    const response = await axios.get(this.baseUrl + '${analysis.endpoints?.users?.path || '/users'}', {
      headers: { '${analysis.authHeader?.split(':')[0] || 'Authorization'}': '${analysis.authMethod === 'BEARER' ? 'Bearer ' : ''}' + this.apiKey }
    });
    return response.data;
  }

  async getEvents() {
    const axios = require('axios');
    const response = await axios.get(this.baseUrl + '${analysis.endpoints?.events?.path || '/events'}', {
      headers: { '${analysis.authHeader?.split(':')[0] || 'Authorization'}': '${analysis.authMethod === 'BEARER' ? 'Bearer ' : ''}' + this.apiKey }
    });
    return response.data;
  }
}

module.exports = ${toolName}Integration;`;

  let code = await callHuggingFace(prompt, apiKey);

  // Clean up the code
  code = code.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');

  // Extract just the class code if there's extra text
  const classMatch = code.match(/class\s+\w+Integration\s*\{[\s\S]*?module\.exports[\s\S]*?;/);
  if (classMatch) {
    code = classMatch[0];
  }

  console.log('Code generation complete');
  return code;
}

module.exports = {
  analyzeAPI,
  generateIntegrationCode
};
