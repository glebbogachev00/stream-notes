const express = require('express');

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
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
