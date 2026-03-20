import { describe, it, expect } from 'vitest';
import {
	parseQueryParams,
	encodeQueryParams,
	canonicalQueryString,
	getDefaultDateRange,
	formatDate,
	formatDisplayDate,
	buildHeatmapData,
	computeSummaryStats,
	validateQueryParams
} from './utils';
import type { ActivityItem, QueryParams } from './types';

describe('parseQueryParams', () => {
	it('parses valid query params', () => {
		const params = new URLSearchParams(
			'user=octocat&repos=org/repo1,org/repo2&from=2025-01-01&to=2025-03-20&types=issues_opened,prs_opened'
		);
		const result = parseQueryParams(params);
		expect(result).toEqual({
			user: 'octocat',
			repos: ['org/repo1', 'org/repo2'],
			from: '2025-01-01',
			to: '2025-03-20',
			types: ['issues_opened', 'prs_opened']
		});
	});

	it('returns null when required params are missing', () => {
		const params = new URLSearchParams('user=octocat');
		expect(parseQueryParams(params)).toBeNull();
	});

	it('defaults to all activity types when types param is missing', () => {
		const params = new URLSearchParams(
			'user=octocat&repos=org/repo1&from=2025-01-01&to=2025-03-20'
		);
		const result = parseQueryParams(params);
		expect(result).not.toBeNull();
		expect(result!.types).toHaveLength(6);
	});

	it('filters out invalid activity types', () => {
		const params = new URLSearchParams(
			'user=octocat&repos=org/repo1&from=2025-01-01&to=2025-03-20&types=issues_opened,invalid_type'
		);
		const result = parseQueryParams(params);
		expect(result!.types).toEqual(['issues_opened']);
	});

	it('sorts repos alphabetically', () => {
		const params = new URLSearchParams(
			'user=octocat&repos=z/repo,a/repo&from=2025-01-01&to=2025-03-20'
		);
		const result = parseQueryParams(params);
		expect(result!.repos).toEqual(['a/repo', 'z/repo']);
	});
});

describe('encodeQueryParams', () => {
	it('encodes params into a search string', () => {
		const params: QueryParams = {
			user: 'octocat',
			repos: ['org/repo1', 'org/repo2'],
			from: '2025-01-01',
			to: '2025-03-20',
			types: ['issues_opened', 'prs_opened']
		};
		const result = encodeQueryParams(params);
		expect(result).toContain('user=octocat');
		expect(result).toContain('repos=org%2Frepo1%2Corg%2Frepo2');
		expect(result).toContain('from=2025-01-01');
		expect(result).toContain('to=2025-03-20');
	});
});

describe('canonicalQueryString', () => {
	it('produces consistent output regardless of input order', () => {
		const params1: QueryParams = {
			user: 'octocat',
			repos: ['b/repo', 'a/repo'],
			from: '2025-01-01',
			to: '2025-03-20',
			types: ['prs_opened', 'issues_opened']
		};
		const params2: QueryParams = {
			user: 'octocat',
			repos: ['a/repo', 'b/repo'],
			from: '2025-01-01',
			to: '2025-03-20',
			types: ['issues_opened', 'prs_opened']
		};
		expect(canonicalQueryString(params1)).toBe(canonicalQueryString(params2));
	});
});

describe('getDefaultDateRange', () => {
	it('returns a 90-day range ending today', () => {
		const { from, to } = getDefaultDateRange();
		const fromDate = new Date(from);
		const toDate = new Date(to);
		const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
		expect(diffDays).toBe(90);
	});
});

describe('formatDate', () => {
	it('formats a date as YYYY-MM-DD', () => {
		const date = new Date('2025-03-20T12:00:00Z');
		expect(formatDate(date)).toBe('2025-03-20');
	});
});

describe('formatDisplayDate', () => {
	it('formats an ISO string for display', () => {
		const result = formatDisplayDate('2025-03-20T12:00:00Z');
		expect(result).toContain('Mar');
		expect(result).toContain('20');
		expect(result).toContain('2025');
	});
});

describe('buildHeatmapData', () => {
	it('fills in all days in the range', () => {
		const items: ActivityItem[] = [];
		const entries = buildHeatmapData(items, '2025-01-01', '2025-01-03');
		expect(entries).toHaveLength(3);
		expect(entries.every((e) => e.count === 0)).toBe(true);
	});

	it('counts items per day', () => {
		const items: ActivityItem[] = [
			{
				id: '1',
				type: 'issues_opened',
				title: 'Issue 1',
				repo: 'org/repo',
				date: '2025-01-02T10:00:00Z',
				url: 'https://github.com'
			},
			{
				id: '2',
				type: 'issues_opened',
				title: 'Issue 2',
				repo: 'org/repo',
				date: '2025-01-02T15:00:00Z',
				url: 'https://github.com'
			}
		];
		const entries = buildHeatmapData(items, '2025-01-01', '2025-01-03');
		expect(entries[0].count).toBe(0);
		expect(entries[1].count).toBe(2);
		expect(entries[2].count).toBe(0);
	});
});

describe('computeSummaryStats', () => {
	it('computes correct stats', () => {
		const items: ActivityItem[] = [
			{
				id: '1',
				type: 'issues_opened',
				title: 'Issue 1',
				repo: 'org/repo1',
				date: '2025-01-01T10:00:00Z',
				url: ''
			},
			{
				id: '2',
				type: 'issues_opened',
				title: 'Issue 2',
				repo: 'org/repo1',
				date: '2025-01-01T12:00:00Z',
				url: ''
			},
			{
				id: '3',
				type: 'prs_opened',
				title: 'PR 1',
				repo: 'org/repo2',
				date: '2025-01-02T10:00:00Z',
				url: ''
			}
		];
		const stats = computeSummaryStats(items);
		expect(stats.totalItems).toBe(3);
		expect(stats.countsByType.issues_opened).toBe(2);
		expect(stats.countsByType.prs_opened).toBe(1);
		expect(stats.mostActiveRepo).toBe('org/repo1');
		expect(stats.mostActiveDay).toBe('2025-01-01');
	});

	it('handles empty items', () => {
		const stats = computeSummaryStats([]);
		expect(stats.totalItems).toBe(0);
		expect(stats.mostActiveRepo).toBeNull();
		expect(stats.mostActiveDay).toBeNull();
	});
});

describe('validateQueryParams', () => {
	const validParams: QueryParams = {
		user: 'octocat',
		repos: ['org/repo'],
		from: '2025-01-01',
		to: '2025-03-20',
		types: ['issues_opened']
	};

	it('returns no errors for valid params', () => {
		expect(validateQueryParams(validParams)).toEqual([]);
	});

	it('catches empty username', () => {
		const errors = validateQueryParams({ ...validParams, user: '' });
		expect(errors).toContain('GitHub username is required.');
	});

	it('catches too many repos', () => {
		const repos = Array.from({ length: 11 }, (_, i) => `org/repo${i}`);
		const errors = validateQueryParams({ ...validParams, repos });
		expect(errors).toContain('Maximum 10 repositories allowed.');
	});

	it('catches invalid date range', () => {
		const errors = validateQueryParams({ ...validParams, from: '2025-03-20', to: '2025-01-01' });
		expect(errors).toContain('Start date must be before end date.');
	});

	it('catches date range exceeding 1 year', () => {
		const errors = validateQueryParams({ ...validParams, from: '2023-01-01', to: '2025-03-20' });
		expect(errors).toContain('Date range cannot exceed 1 year.');
	});

	it('catches invalid repo format', () => {
		const errors = validateQueryParams({ ...validParams, repos: ['invalid-repo'] });
		expect(errors.some((e) => e.includes('Invalid repository format'))).toBe(true);
	});
});
