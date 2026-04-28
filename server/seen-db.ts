import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(join(process.cwd(), '.beads', 'beadee.db'));
    db.exec('CREATE TABLE IF NOT EXISTS seen (issue_id TEXT PRIMARY KEY, seen_at TEXT NOT NULL)');
  }
  return db;
}

export function markSeen(issueId: string, seenAt: string): void {
  getDb()
    .prepare(
      'INSERT INTO seen (issue_id, seen_at) VALUES (?, ?) ON CONFLICT(issue_id) DO UPDATE SET seen_at = excluded.seen_at',
    )
    .run(issueId, seenAt);
}

export function getSeenMap(): Record<string, string> {
  const rows = getDb().prepare('SELECT issue_id, seen_at FROM seen').all() as Array<{
    issue_id: string;
    seen_at: string;
  }>;
  const map: Record<string, string> = {};
  for (const { issue_id, seen_at } of rows) map[issue_id] = seen_at;
  return map;
}
