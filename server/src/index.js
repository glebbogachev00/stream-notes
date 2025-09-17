import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { initDatabase, getItems, upsertItems } from './db.js';
import { pushPayloadSchema, pullPayloadSchema } from './validators.js';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

initDatabase();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/sync/pull', (req, res) => {
  try {
    const payload = pullPayloadSchema.parse(req.body ?? {});
    const { userId, since } = payload;

    const items = getItems(userId, since);

    res.json({
      items,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('pull error', error);
    res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: error.message
    });
  }
});

app.post('/sync/push', (req, res) => {
  try {
    const payload = pushPayloadSchema.parse(req.body ?? {});
    const { userId, items } = payload;

    upsertItems(userId, items);

    res.json({
      success: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('push error', error);
    res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

app.listen(PORT, () => {
  console.log(`[stream-sync] listening on port ${PORT}`);
});
