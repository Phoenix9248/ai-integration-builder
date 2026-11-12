const fs = require('fs');
const path = require('path');

// In-memory store for integrations
let integrations = [];
let nextId = 1;

function saveIntegration(toolName, code, apiKey) {
  const integration = {
    id: nextId++,
    toolName,
    code,
    apiKey,
    createdAt: new Date().toISOString(),
    status: 'connected'
  };

  integrations.push(integration);

  // Save code to a file for execution
  const integrationsDir = path.join(__dirname, 'generated');
  if (!fs.existsSync(integrationsDir)) {
    fs.mkdirSync(integrationsDir, { recursive: true });
  }

  const filename = `${toolName.toLowerCase()}-integration.js`;
  fs.writeFileSync(
    path.join(integrationsDir, filename),
    code
  );

  integration.filename = filename;

  return integration;
}

function getIntegrations() {
  return integrations.map(int => ({
    id: int.id,
    toolName: int.toolName,
    createdAt: int.createdAt,
    status: int.status
  }));
}

async function testIntegration(id) {
  const integration = integrations.find(i => i.id === parseInt(id));
  if (!integration) {
    throw new Error('Integration not found');
  }

  try {
    // Load the generated integration class
    const IntegrationClass = require(`./generated/${integration.filename}`);
    const instance = new IntegrationClass(integration.apiKey);

    // Try to authenticate
    await instance.authenticate();

    // Try to fetch data
    let users = [];
    let events = [];

    try {
      if (typeof instance.getUsers === 'function') {
        users = await instance.getUsers();
      }
    } catch (e) {
      console.log('Could not fetch users:', e.message);
    }

    try {
      if (typeof instance.getEvents === 'function') {
        events = await instance.getEvents();
      }
    } catch (e) {
      console.log('Could not fetch events:', e.message);
    }

    return {
      authenticated: true,
      users: Array.isArray(users) ? users.slice(0, 10) : [],
      events: Array.isArray(events) ? events.slice(0, 10) : [],
      userCount: Array.isArray(users) ? users.length : 0,
      eventCount: Array.isArray(events) ? events.length : 0
    };
  } catch (error) {
    console.error('Test integration error:', error);
    return {
      authenticated: false,
      error: error.message
    };
  }
}

module.exports = {
  saveIntegration,
  getIntegrations,
  testIntegration
};
