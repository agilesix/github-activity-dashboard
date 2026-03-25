import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { DashboardData, QueryParams } from '$lib/types';
import {
	dashboard,
	loading,
	loadError,
	fromCache,
	errors,
	rateLimitInfo,
	selectedTypes,
	fetchDashboard,
	resetDashboard
} from './dashboard-store';

const mockParams: QueryParams = {
	user: 'octocat',
	repos: ['org/repo'],
	from: '2025-01-01',
	to: '2025-03-20',
	types: ['issues_opened']
};

const mockDashboardData: DashboardData = {
	query: mockParams,
	items: [
		{
			id: '1',
			type: 'issues_opened',
			title: 'Test',
			repo: 'org/repo',
			date: '2025-02-01T00:00:00Z',
			url: 'https://github.com'
		}
	],
	fetchedAt: '2025-03-20T12:00:00Z'
};

describe('dashboard-store', () => {
	let storage: Map<string, string>;

	beforeEach(() => {
		resetDashboard();
		storage = new Map();
		vi.stubGlobal('sessionStorage', {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
			removeItem: (key: string) => storage.delete(key),
			clear: () => storage.clear(),
			get length() {
				return storage.size;
			},
			key: (index: number) => [...storage.keys()][index] ?? null
		});
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve({
					json: () =>
						Promise.resolve({
							dashboard: mockDashboardData,
							fromCache: false,
							errors: [],
							rateLimitInfo: { remaining: 50, limit: 60, resetAt: '2025-03-20T13:00:00Z' }
						})
				})
			)
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('starts in loading state after reset', () => {
		expect(loading.get()).toBe(true);
		expect(dashboard.get()).toBeNull();
		expect(loadError.get()).toBeNull();
	});

	it('fetches data and updates atoms', async () => {
		await fetchDashboard(mockParams);

		expect(loading.get()).toBe(false);
		expect(dashboard.get()).toEqual(mockDashboardData);
		expect(fromCache.get()).toBe(false);
		expect(errors.get()).toEqual([]);
		expect(rateLimitInfo.get()).toEqual({
			remaining: 50,
			limit: 60,
			resetAt: '2025-03-20T13:00:00Z'
		});
	});

	it('sets loadError on API error response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() =>
				Promise.resolve({
					json: () => Promise.resolve({ error: 'Rate limited' })
				})
			)
		);

		await fetchDashboard(mockParams);

		expect(loading.get()).toBe(false);
		expect(loadError.get()).toBe('Rate limited');
		expect(dashboard.get()).toBeNull();
	});

	it('sets loadError on fetch failure', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.reject(new Error('Network error')))
		);

		await fetchDashboard(mockParams);

		expect(loading.get()).toBe(false);
		expect(loadError.get()).toBe('Network error');
	});

	it('reads from session cache on second call', async () => {
		await fetchDashboard(mockParams);
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

		// Reset state but keep cache
		resetDashboard();

		await fetchDashboard(mockParams);
		// Should not call fetch again — cache hit
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
		expect(dashboard.get()).toEqual(mockDashboardData);
		expect(fromCache.get()).toBe(true);
	});

	it('bypasses cache when refresh is true', async () => {
		await fetchDashboard(mockParams);
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

		resetDashboard();

		const result = await fetchDashboard(mockParams, { refresh: true });
		expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
		expect(result.refreshed).toBe(true);
	});

	it('writes to session cache after fetch', async () => {
		await fetchDashboard(mockParams);
		// Verify cache was written
		const keys = [...storage.keys()];
		expect(keys.some((k) => k.startsWith('dashboard:'))).toBe(true);
	});

	it('resetDashboard clears all state', async () => {
		await fetchDashboard(mockParams);
		expect(dashboard.get()).not.toBeNull();

		resetDashboard();

		expect(dashboard.get()).toBeNull();
		expect(loading.get()).toBe(true);
		expect(loadError.get()).toBeNull();
		expect(fromCache.get()).toBe(false);
		expect(errors.get()).toEqual([]);
		expect(rateLimitInfo.get()).toBeUndefined();
		expect(selectedTypes.get()).toEqual([]);
	});
});
