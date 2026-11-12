const Groq = require('groq-sdk');
const axios = require('axios');

function getGroqClient(apiKey) {
  return new Groq({
    apiKey: apiKey || process.env.GROQ_API_KEY
  });
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

  const groq = getGroqClient(apiKey);

  let apiDocContent;
  try {
    apiDocContent = await fetchAPIDoc(apiDocsUrl);
  } catch (error) {
    // If fetching fails, use Groq to help find the right documentation
    apiDocContent = `API documentation URL: ${apiDocsUrl}`;
  }

  const prompt = `You are an API integration expert. Analyze the following API documentation for ${toolName} and extract key information needed to build an integration.

API Documentation:
${typeof apiDocContent === 'string' ? apiDocContent.substring(0, 8000) : JSON.stringify(apiDocContent).substring(0, 8000)}

Extract and return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "authMethod": "API_KEY or OAUTH2 or BEARER",
  "baseUrl": "the API base URL",
  "endpoints": {
    "users": {
      "method": "GET",
      "path": "/users or /api/users",
      "description": "Get list of users"
    },
    "events": {
      "method": "GET",
      "path": "/events or similar",
      "description": "Get events/bookings/items"
    }
  },
  "authHeader": "Authorization: Bearer TOKEN or X-API-Key: TOKEN",
  "rateLimit": "rate limit info if available",
  "webhooks": "webhook endpoint if available"
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 2000
  });

  const responseText = completion.choices[0].message.content.trim();

  // Try to extract JSON from the response
  let jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse API analysis response');
  }

  const analysis = JSON.parse(jsonMatch[0]);
  console.log('API Analysis complete:', analysis);

  return analysis;
}

async function generateIntegrationCode(toolName, analysis, apiKey) {
  const groq = getGroqClient(apiKey);

  const prompt = `Generate a complete, working JavaScript integration class for ${toolName} based on this API analysis:

${JSON.stringify(analysis, null, 2)}

Generate ONLY the JavaScript code (no markdown, no explanation). The class should:
1. Have an authenticate() method
2. Have methods to fetch data from the main endpoints
3. Handle errors properly
4. Return promises
5. Include JSDoc comments

Example structure:
class ${toolName}Integration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = '${analysis.baseUrl}';
  }

  async authenticate() {
    // test auth
  }

  async getUsers() {
    // fetch users
  }

  async getEvents() {
    // fetch events
  }
}

module.exports = ${toolName}Integration;`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 3000
  });

  let code = completion.choices[0].message.content.trim();

  // Remove markdown code blocks if present
  code = code.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');

  console.log('Code generation complete');
  return code;
}

module.exports = {
  analyzeAPI,
  generateIntegrationCode
};
