import { describe, it, expect } from 'vitest';
import type { ActivityItem } from '$lib/types';
import {
	filterByDateRange,
	filterByRepos,
	filterByLabels,
	filterBySearch,
	filterByActivityType,
	groupByCategory
} from './filters';

function makeItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
	return {
		id: '1',
		type: 'issues_opened',
		title: 'Test issue',
		repo: 'org/repo',
		date: '2025-02-15T10:00:00Z',
		url: 'https://github.com',
		...overrides
	};
}

describe('filterByDateRange', () => {
	const items = [
		makeItem({ id: '1', date: '2025-01-10T00:00:00Z' }),
		makeItem({ id: '2', date: '2025-02-15T00:00:00Z' }),
		makeItem({ id: '3', date: '2025-03-20T00:00:00Z' })
	];

	it('returns all items when both from and to are null', () => {
		expect(filterByDateRange(items, null, null)).toHaveLength(3);
	});

	it('filters items before from date', () => {
		const result = filterByDateRange(items, '2025-02-01', null);
		expect(result).toHaveLength(2);
		expect(result[0].id).toBe('2');
	});

	it('filters items after to date', () => {
		const result = filterByDateRange(items, null, '2025-02-28');
		expect(result).toHaveLength(2);
		expect(result[1].id).toBe('2');
	});

	it('filters to exact date range', () => {
		const result = filterByDateRange(items, '2025-02-01', '2025-02-28');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('2');
	});

	it('returns empty for no match', () => {
		expect(filterByDateRange(items, '2026-01-01', '2026-12-31')).toHaveLength(0);
	});

	it('handles empty input', () => {
		expect(filterByDateRange([], '2025-01-01', '2025-12-31')).toHaveLength(0);
	});
});

describe('filterByRepos', () => {
	const items = [
		makeItem({ id: '1', repo: 'org/alpha' }),
		makeItem({ id: '2', repo: 'org/beta' }),
		makeItem({ id: '3', repo: 'org/gamma' })
	];

	it('returns all items when repos is empty', () => {
		expect(filterByRepos(items, [])).toHaveLength(3);
	});

	it('filters to matching repos', () => {
		const result = filterByRepos(items, ['org/alpha', 'org/gamma']);
		expect(result).toHaveLength(2);
		expect(result.map((i) => i.id)).toEqual(['1', '3']);
	});

	it('returns empty for no match', () => {
		expect(filterByRepos(items, ['org/missing'])).toHaveLength(0);
	});
});

describe('filterByLabels', () => {
	const items = [
		makeItem({ id: '1', labels: ['bug', 'urgent'] }),
		makeItem({ id: '2', labels: ['feature'] }),
		makeItem({ id: '3', labels: [] }),
		makeItem({ id: '4' }) // no labels property
	];

	it('returns all items when labels is empty', () => {
		expect(filterByLabels(items, [])).toHaveLength(4);
	});

	it('filters to items with matching labels', () => {
		const result = filterByLabels(items, ['bug']);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('matches any label (intersection)', () => {
		const result = filterByLabels(items, ['bug', 'feature']);
		expect(result).toHaveLength(2);
	});

	it('returns empty for no match', () => {
		expect(filterByLabels(items, ['nonexistent'])).toHaveLength(0);
	});
});

describe('filterBySearch', () => {
	const items = [
		makeItem({ id: '1', title: 'Fix login bug', repo: 'org/auth', number: 42 }),
		makeItem({ id: '2', title: 'Add dashboard feature', repo: 'org/web', number: 99 }),
		makeItem({ id: '3', title: 'Update docs', repo: 'org/docs' })
	];

	it('returns all items for empty query', () => {
		expect(filterBySearch(items, '')).toHaveLength(3);
		expect(filterBySearch(items, '   ')).toHaveLength(3);
	});

	it('searches by title', () => {
		const result = filterBySearch(items, 'login');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('searches by repo', () => {
		const result = filterBySearch(items, 'org/web');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('2');
	});

	it('searches by #number', () => {
		const result = filterBySearch(items, '#42');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('is case insensitive', () => {
		expect(filterBySearch(items, 'FIX')).toHaveLength(1);
	});

	it('returns empty for no match', () => {
		expect(filterBySearch(items, 'nonexistent')).toHaveLength(0);
	});
});

describe('filterByActivityType', () => {
	const items = [
		makeItem({ id: '1', type: 'issues_opened' }),
		makeItem({ id: '2', type: 'prs_opened' }),
		makeItem({ id: '3', type: 'issues_opened' })
	];

	it('returns all items for "all" tab', () => {
		expect(filterByActivityType(items, 'all')).toHaveLength(3);
	});

	it('filters to specific type', () => {
		const result = filterByActivityType(items, 'prs_opened');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('2');
	});

	it('returns empty for no match', () => {
		expect(filterByActivityType(items, 'prs_merged')).toHaveLength(0);
	});
});

describe('groupByCategory', () => {
	it('groups items into Issues and Pull Requests sections', () => {
		const items = [
			makeItem({ id: '1', type: 'issues_opened' }),
			makeItem({ id: '2', type: 'prs_opened' }),
			makeItem({ id: '3', type: 'issue_comments' }),
			makeItem({ id: '4', type: 'prs_merged' })
		];
		const sections = groupByCategory(items);
		expect(sections).toHaveLength(2);
		expect(sections[0].category).toBe('issues');
		expect(sections[0].categoryLabel).toBe('Issues');
		expect(sections[0].items).toHaveLength(2);
		expect(sections[1].category).toBe('pull_requests');
		expect(sections[1].categoryLabel).toBe('Pull Requests');
		expect(sections[1].items).toHaveLength(2);
	});

	it('orders Issues before Pull Requests', () => {
		const items = [
			makeItem({ id: '1', type: 'prs_opened' }),
			makeItem({ id: '2', type: 'issues_opened' })
		];
		const sections = groupByCategory(items);
		expect(sections[0].category).toBe('issues');
		expect(sections[1].category).toBe('pull_requests');
	});

	it('omits empty categories', () => {
		const items = [makeItem({ id: '1', type: 'prs_merged' })];
		const sections = groupByCategory(items);
		expect(sections).toHaveLength(1);
		expect(sections[0].category).toBe('pull_requests');
	});

	it('returns empty for no items', () => {
		expect(groupByCategory([])).toHaveLength(0);
	});
});
