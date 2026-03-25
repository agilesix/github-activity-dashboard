import { describe, it, expect } from 'vitest';
import type { ActivityItem } from '$lib/types';
import type { ExportMetadata } from './export';
import { buildActivityRows, buildMetadataRows } from './export';

function makeItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
	return {
		id: '1',
		type: 'issues_opened',
		title: 'Test issue',
		repo: 'org/repo',
		date: '2025-02-15T10:00:00Z',
		url: 'https://github.com/org/repo/issues/1',
		...overrides
	};
}

describe('buildActivityRows', () => {
	it('returns correct headers', () => {
		const { headers } = buildActivityRows([]);
		expect(headers).toEqual([
			'Type',
			'Number',
			'Title',
			'Repo',
			'State',
			'Date',
			'Assignees',
			'Labels',
			'URL'
		]);
	});

	it('returns empty rows for no items', () => {
		const { rows } = buildActivityRows([]);
		expect(rows).toHaveLength(0);
	});

	it('generates a row per item with correct fields', () => {
		const items = [
			makeItem({
				number: 42,
				state: 'open',
				labels: ['bug', 'urgent'],
				assignees: ['alice', 'bob']
			})
		];
		const { rows } = buildActivityRows(items);
		expect(rows).toHaveLength(1);

		const [type, number, title, repo, state, date, assignees, labels, url] = rows[0];
		expect(type).toBe('Issues Opened');
		expect(number).toBe('#42');
		expect(title).toBe('Test issue');
		expect(repo).toBe('org/repo');
		expect(state).toBe('open');
		expect(date).toBe('2025-02-15');
		expect(assignees).toBe('alice, bob');
		expect(labels).toBe('bug, urgent');
		expect(url).toBe('https://github.com/org/repo/issues/1');
	});

	it('handles missing optional fields', () => {
		const item = makeItem({
			number: undefined,
			state: undefined,
			labels: undefined,
			assignees: undefined
		});
		const { rows } = buildActivityRows([item]);
		const row = rows[0];
		expect(row[1]).toBe(''); // number
		expect(row[4]).toBe(''); // state
		expect(row[6]).toBe(''); // assignees
		expect(row[7]).toBe(''); // labels
	});
});

describe('buildMetadataRows', () => {
	const meta: ExportMetadata = {
		user: 'octocat',
		repos: ['org/repo1', 'org/repo2'],
		from: '2025-01-01',
		to: '2025-03-20',
		types: ['issues_opened', 'prs_opened'],
		exportedAt: '2025-03-20T12:00:00Z',
		selectedTypes: [],
		filters: {
			searchQuery: '',
			selectedRepos: [],
			selectedLabels: [],
			dateFilterFrom: null,
			dateFilterTo: null
		},
		totalItems: 100,
		filteredItems: 50
	};

	it('returns correct headers', () => {
		const { headers } = buildMetadataRows(meta);
		expect(headers).toEqual(['Field', 'Value']);
	});

	it('includes all metadata fields', () => {
		const { rows } = buildMetadataRows(meta);
		const fields = rows.map((r) => r[0]);
		expect(fields).toContain('User');
		expect(fields).toContain('Repos');
		expect(fields).toContain('Date Range');
		expect(fields).toContain('Activity Types');
		expect(fields).toContain('Selected Types');
		expect(fields).toContain('Total Items');
		expect(fields).toContain('Filtered Items');
		expect(fields).toContain('Exported At');
	});

	it('formats values correctly', () => {
		const { rows } = buildMetadataRows(meta);
		const toMap = Object.fromEntries(rows);
		expect(toMap['User']).toBe('octocat');
		expect(toMap['Repos']).toBe('org/repo1, org/repo2');
		expect(toMap['Date Range']).toBe('2025-01-01 to 2025-03-20');
		expect(toMap['Activity Types']).toBe('Issues Opened, PRs Opened');
		expect(toMap['Total Items']).toBe('100');
		expect(toMap['Filtered Items']).toBe('50');
	});

	it('shows (none) and (all) for empty filters', () => {
		const { rows } = buildMetadataRows(meta);
		const toMap = Object.fromEntries(rows);
		expect(toMap['Search Query']).toBe('(none)');
		expect(toMap['Filtered Repos']).toBe('(all)');
		expect(toMap['Filtered Labels']).toBe('(all)');
		expect(toMap['Date Filter']).toBe('(none)');
	});

	it('shows active filters when set', () => {
		const activeMeta: ExportMetadata = {
			...meta,
			filters: {
				searchQuery: 'login',
				selectedRepos: ['org/repo1'],
				selectedLabels: ['bug'],
				dateFilterFrom: '2025-02-01',
				dateFilterTo: '2025-02-28'
			}
		};
		const { rows } = buildMetadataRows(activeMeta);
		const toMap = Object.fromEntries(rows);
		expect(toMap['Search Query']).toBe('login');
		expect(toMap['Filtered Repos']).toBe('org/repo1');
		expect(toMap['Filtered Labels']).toBe('bug');
		expect(toMap['Date Filter']).toBe('2025-02-01 to 2025-02-28');
	});
});
