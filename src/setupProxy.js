const express = require('express');
const https = require('https');

const callGroq = (payload, apiKey) => {
  const body = JSON.stringify(payload);

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Bearer ${apiKey}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

module.exports = function(app) {
  app.use('/api/groq-proxy', express.json({ limit: '1mb' }), async (req, res) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    try {
      const { status, data } = await callGroq(req.body, apiKey);

      if (status < 200 || status >= 300) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[setupProxy] groq responded with error', {
            status,
            message: data?.error?.message,
            raw: data
          });
        }
        return res.status(status).json({
          error: data?.error?.message || 'Groq request failed'
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('[setupProxy] groq error', error);
      return res.status(500).json({ error: 'Unexpected error calling Groq' });
    }
  });
};
