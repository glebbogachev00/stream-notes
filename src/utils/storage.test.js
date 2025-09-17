import StorageAdapter from './storage';

describe('StorageAdapter.mergeCollectionValue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes notes that were deleted remotely', () => {
    const note = { id: 'note-1', content: 'old', createdAt: 500 };
    localStorage.setItem('stream_notes', JSON.stringify([note]));

    const adapter = new StorageAdapter();
    adapter.metadata.lastSyncedAt = 1000;

    const result = adapter.mergeCollectionValue('stream_notes', JSON.stringify([]));

    expect(JSON.parse(result.mergedValue)).toEqual([]);
    expect(result.localChanged).toBe(true);
    expect(result.shouldPush).toBe(false);
    expect(JSON.parse(localStorage.getItem('stream_notes'))).toEqual([]);
  });

  it('keeps local notes created after the last sync', () => {
    const recentNote = { id: 'note-2', content: 'local', createdAt: 2000 };
    localStorage.setItem('stream_notes', JSON.stringify([recentNote]));

    const adapter = new StorageAdapter();
    adapter.metadata.lastSyncedAt = 1000;

    const result = adapter.mergeCollectionValue('stream_notes', JSON.stringify([]));

    expect(JSON.parse(result.mergedValue)).toEqual([recentNote]);
    expect(result.localChanged).toBe(false);
    expect(result.shouldPush).toBe(true);
    expect(JSON.parse(localStorage.getItem('stream_notes'))).toEqual([recentNote]);
  });
});
