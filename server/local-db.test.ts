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
    const { getSeenMap } = await import('./local-db.js');
    expect(getSeenMap()).toEqual({});
  });

  it('records a seen entry', async () => {
    const { markSeen, getSeenMap } = await import('./local-db.js');
    markSeen('abc-123', '2026-04-28T10:00:00Z');
    expect(getSeenMap()).toEqual({ 'abc-123': '2026-04-28T10:00:00Z' });
  });

  it('updates seen_at when the same issue is marked seen again', async () => {
    const { markSeen, getSeenMap } = await import('./local-db.js');
    markSeen('abc-123', '2026-04-28T10:00:00Z');
    markSeen('abc-123', '2026-04-28T11:00:00Z');
    expect(getSeenMap()).toEqual({ 'abc-123': '2026-04-28T11:00:00Z' });
  });

  it('tracks multiple issues independently', async () => {
    const { markSeen, getSeenMap } = await import('./local-db.js');
    markSeen('abc-123', '2026-04-28T10:00:00Z');
    markSeen('def-456', '2026-04-28T09:00:00Z');
    expect(getSeenMap()).toEqual({
      'abc-123': '2026-04-28T10:00:00Z',
      'def-456': '2026-04-28T09:00:00Z',
    });
  });
});

describe('setPref / getPrefs', () => {
  it('returns an empty map when no prefs have been set', async () => {
    const { getPrefs } = await import('./local-db.js');
    expect(getPrefs()).toEqual({});
  });

  it('stores and retrieves a pref', async () => {
    const { setPref, getPrefs } = await import('./local-db.js');
    setPref('beadee-list-panel-width', '400');
    expect(getPrefs()).toEqual({ 'beadee-list-panel-width': '400' });
  });

  it('updates a pref when set again', async () => {
    const { setPref, getPrefs } = await import('./local-db.js');
    setPref('beadee-list-panel-width', '320');
    setPref('beadee-list-panel-width', '500');
    expect(getPrefs()).toEqual({ 'beadee-list-panel-width': '500' });
  });

  it('tracks multiple prefs independently', async () => {
    const { setPref, getPrefs } = await import('./local-db.js');
    setPref('beadee-list-panel-width', '400');
    setPref('beadee-theme', 'dark');
    expect(getPrefs()).toEqual({ 'beadee-list-panel-width': '400', 'beadee-theme': 'dark' });
  });
});
