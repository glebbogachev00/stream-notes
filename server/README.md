# stream-sync server

Simple key/value sync service for the [stream] client. Designed for the smallest possible deployment footprint.

## Local development

```bash
npm install
npm run dev
```

The service will listen on `http://localhost:4000` and create a SQLite database (`stream-sync.db`).

## Environment variables

| Name              | Description                                    | Default                |
|-------------------|------------------------------------------------|------------------------|
| `PORT`            | Port to listen on                              | `4000`                 |
| `STREAM_SYNC_DB`  | Path to SQLite database file                   | `stream-sync.db`       |

## Deploying to Railway

1. Push this folder to its own GitHub repository (only the contents of `server/`).
2. In Railway: **New Project → Deploy from GitHub** and select the repo.
3. Add a volume (1GB is enough) and mount it at `/data`.
4. Add environment variables:
   - `PORT=4000`
   - `STREAM_SYNC_DB=/data/stream-sync.db`
5. Trigger a deploy. Railway installs dependencies and starts the app automatically.
6. Copy the public URL Railway gives you and use it as `REACT_APP_SYNC_URL` in the front end.

## API

- `POST /sync/pull` → `{ userId, since }`
- `POST /sync/push` → `{ userId, items: [{ key, value, updatedAt, deletedAt }] }`
- `GET /health`

Responses include timestamps so clients can track `lastSyncedAt`.
