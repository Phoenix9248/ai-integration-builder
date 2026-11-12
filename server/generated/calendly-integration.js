class CalendlyIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.calendly.com/v2';
  }

  async authenticate() {
    const axios = require('axios');
    try {
      const response = await axios.get(this.baseUrl + '/auth', {
        headers: { 'Authorization': 'Bearer ' + this.apiKey }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUsers() {
    const axios = require('axios');
    try {
      const response = await axios.get(this.baseUrl + '/users', {
        headers: { 'Authorization': 'Bearer ' + this.apiKey }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getEvents() {
    const axios = require('axios');
    try {
      const response = await axios.get(this.baseUrl + '/events', {
        headers: { 'Authorization': 'Bearer ' + this.apiKey }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = CalendlyIntegration;