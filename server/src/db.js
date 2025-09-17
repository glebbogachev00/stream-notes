import Database from 'better-sqlite3';

const DB_PATH = process.env.STREAM_SYNC_DB || 'stream-sync.db';
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS storage_items (
      user_id TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      value TEXT,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER,
      PRIMARY KEY (user_id, storage_key)
    );
  `);
};

const getItems = (userId, since = 0) => {
  const statement = db.prepare(`
    SELECT storage_key as key, value, updated_at as updatedAt, deleted_at as deletedAt
    FROM storage_items
    WHERE user_id = ? AND updated_at > ?
  `);

  return statement.all(userId, since).map((row) => ({
    key: row.key,
    value: row.value,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null
  }));
};

const upsertItems = (userId, items = []) => {
  const statement = db.prepare(`
    INSERT INTO storage_items (user_id, storage_key, value, updated_at, deleted_at)
    VALUES (@userId, @key, @value, @updatedAt, @deletedAt)
    ON CONFLICT(user_id, storage_key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at
  `);

  const transaction = db.transaction((records) => {
    for (const record of records) {
      statement.run({
        userId,
        key: record.key,
        value: record.value ?? null,
        updatedAt: record.updatedAt,
        deletedAt: record.deletedAt ?? null
      });
    }
  });

  transaction(items);
};

export {
  initDatabase,
  getItems,
  upsertItems
};
