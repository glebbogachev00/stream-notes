const express = require('express');

const fetchImpl = typeof fetch === 'function'
  ? fetch
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = function(app) {
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/groq-proxy', async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    try {
      const response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
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
