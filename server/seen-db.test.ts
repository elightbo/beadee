// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'beadee-test-'));
  mkdirSync(join(tmpDir, '.beads'));
  vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('markSeen / getSeenMap', () => {
  it('returns an empty map when nothing has been seen', async () => {
    const { getSeenMap } = await import('./seen-db.js');
    expect(getSeenMap()).toEqual({});
  });

  it('records a seen entry', async () => {
    const { markSeen, getSeenMap } = await import('./seen-db.js');
    markSeen('abc-123', '2026-04-28T10:00:00Z');
    expect(getSeenMap()).toEqual({ 'abc-123': '2026-04-28T10:00:00Z' });
  });

  it('updates seen_at when the same issue is marked seen again', async () => {
    const { markSeen, getSeenMap } = await import('./seen-db.js');
    markSeen('abc-123', '2026-04-28T10:00:00Z');
    markSeen('abc-123', '2026-04-28T11:00:00Z');
    expect(getSeenMap()).toEqual({ 'abc-123': '2026-04-28T11:00:00Z' });
  });

  it('tracks multiple issues independently', async () => {
    const { markSeen, getSeenMap } = await import('./seen-db.js');
    markSeen('abc-123', '2026-04-28T10:00:00Z');
    markSeen('def-456', '2026-04-28T09:00:00Z');
    expect(getSeenMap()).toEqual({
      'abc-123': '2026-04-28T10:00:00Z',
      'def-456': '2026-04-28T09:00:00Z',
    });
  });
});
