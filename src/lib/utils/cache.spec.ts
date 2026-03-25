import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { QueryParams } from '$lib/types';
import { buildCacheKey, readSessionCache, writeSessionCache } from './cache';

describe('buildCacheKey', () => {
	it('prefixes with "dashboard:" and uses canonical query string', () => {
		const params: QueryParams = {
			user: 'octocat',
			repos: ['b/repo', 'a/repo'],
			from: '2025-01-01',
			to: '2025-03-20',
			types: ['prs_opened', 'issues_opened']
		};
		const key = buildCacheKey(params);
		expect(key).toMatch(/^dashboard:/);
		// Should produce same key regardless of array order
		const params2: QueryParams = {
			...params,
			repos: ['a/repo', 'b/repo'],
			types: ['issues_opened', 'prs_opened']
		};
		expect(buildCacheKey(params2)).toBe(key);
	});
});

describe('readSessionCache / writeSessionCache', () => {
	let storage: Map<string, string>;

	beforeEach(() => {
		storage = new Map();
		const mock = {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.delete(key),
			clear: () => storage.clear(),
			get length() {
				return storage.size;
			},
			key: (index: number) => [...storage.keys()][index] ?? null
		};
		vi.stubGlobal('sessionStorage', mock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('round-trips data through session storage', () => {
		const data = { foo: 'bar', count: 42 };
		writeSessionCache('test-key', data);
		const result = readSessionCache<typeof data>('test-key');
		expect(result).toEqual(data);
	});

	it('returns null for missing key', () => {
		expect(readSessionCache('nonexistent')).toBeNull();
	});

	it('returns null for invalid JSON', () => {
		storage.set('bad-json', '{invalid');
		expect(readSessionCache('bad-json')).toBeNull();
	});

	it('handles sessionStorage full gracefully', () => {
		vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
			throw new DOMException('QuotaExceededError');
		});
		expect(() => writeSessionCache('key', { data: 'x' })).not.toThrow();
	});
});

describe('SSR guard (sessionStorage undefined)', () => {
	beforeEach(() => {
		vi.stubGlobal('sessionStorage', undefined);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('readSessionCache returns null when sessionStorage is undefined', () => {
		expect(readSessionCache('any-key')).toBeNull();
	});

	it('writeSessionCache is a no-op when sessionStorage is undefined', () => {
		expect(() => writeSessionCache('key', { data: 'x' })).not.toThrow();
	});
});
