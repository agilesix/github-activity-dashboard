import { describe, it, expect, beforeEach } from 'vitest';
import type { DashboardData } from '$lib/types';
import { dashboard, activeTab } from './dashboard-store';
import { filterFrom, filterTo } from './date-filter';
import {
	searchQuery,
	selectedRepos,
	selectedLabels,
	currentPage,
	collapsedSections,
	filteredItems,
	totalPages,
	pagedItems,
	groupedSections,
	allLabels,
	hasActiveFilters,
	toggleRepo,
	toggleLabel,
	clearFilters,
	toggleSection,
	setPage
} from './activity-filter-store';

const mockDashboard: DashboardData = {
	query: {
		user: 'octocat',
		repos: ['org/alpha', 'org/beta'],
		from: '2025-01-01',
		to: '2025-03-20',
		types: ['issues_opened', 'prs_opened']
	},
	items: [
		{
			id: '1',
			type: 'issues_opened',
			title: 'Fix login bug',
			repo: 'org/alpha',
			date: '2025-02-01T00:00:00Z',
			url: '',
			labels: ['bug', 'urgent']
		},
		{
			id: '2',
			type: 'prs_opened',
			title: 'Add dashboard',
			repo: 'org/beta',
			date: '2025-02-15T00:00:00Z',
			url: '',
			labels: ['feature']
		},
		{
			id: '3',
			type: 'issues_opened',
			title: 'Update docs',
			repo: 'org/alpha',
			date: '2025-03-01T00:00:00Z',
			url: '',
			labels: []
		}
	],
	fetchedAt: '2025-03-20T12:00:00Z'
};

describe('activity-filter-store', () => {
	beforeEach(() => {
		// Reset all atoms
		dashboard.set(null);
		activeTab.set('all');
		searchQuery.set('');
		selectedRepos.set([]);
		selectedLabels.set([]);
		currentPage.set(1);
		collapsedSections.set({});
		filterFrom.set(null);
		filterTo.set(null);
	});

	it('returns empty filtered items when no dashboard', () => {
		expect(filteredItems.get()).toHaveLength(0);
	});

	it('returns all items when no filters active', () => {
		dashboard.set(mockDashboard);
		expect(filteredItems.get()).toHaveLength(3);
	});

	it('filters by activity type tab', () => {
		dashboard.set(mockDashboard);
		activeTab.set('prs_opened');
		expect(filteredItems.get()).toHaveLength(1);
		expect(filteredItems.get()[0].id).toBe('2');
	});

	it('filters by search query', () => {
		dashboard.set(mockDashboard);
		searchQuery.set('login');
		expect(filteredItems.get()).toHaveLength(1);
		expect(filteredItems.get()[0].id).toBe('1');
	});

	it('filters by selected repos', () => {
		dashboard.set(mockDashboard);
		selectedRepos.set(['org/beta']);
		expect(filteredItems.get()).toHaveLength(1);
		expect(filteredItems.get()[0].id).toBe('2');
	});

	it('filters by selected labels', () => {
		dashboard.set(mockDashboard);
		selectedLabels.set(['bug']);
		expect(filteredItems.get()).toHaveLength(1);
		expect(filteredItems.get()[0].id).toBe('1');
	});

	it('filters by date range', () => {
		dashboard.set(mockDashboard);
		filterFrom.set('2025-02-10');
		filterTo.set('2025-02-20');
		expect(filteredItems.get()).toHaveLength(1);
		expect(filteredItems.get()[0].id).toBe('2');
	});

	it('chains multiple filters', () => {
		dashboard.set(mockDashboard);
		activeTab.set('issues_opened');
		selectedRepos.set(['org/alpha']);
		searchQuery.set('docs');
		expect(filteredItems.get()).toHaveLength(1);
		expect(filteredItems.get()[0].id).toBe('3');
	});

	it('computes totalPages correctly', () => {
		dashboard.set(mockDashboard);
		expect(totalPages.get()).toBe(1);
	});

	it('computes pagedItems as a slice', () => {
		dashboard.set(mockDashboard);
		expect(pagedItems.get()).toHaveLength(3);
	});

	it('groups items by category', () => {
		dashboard.set(mockDashboard);
		const sections = groupedSections.get();
		expect(sections).toHaveLength(2);
		expect(sections[0].category).toBe('issues');
		expect(sections[0].items).toHaveLength(2);
		expect(sections[1].category).toBe('pull_requests');
		expect(sections[1].items).toHaveLength(1);
	});

	it('computes allLabels from dashboard items', () => {
		dashboard.set(mockDashboard);
		const labels = allLabels.get();
		expect(labels).toEqual(['bug', 'feature', 'urgent']);
	});

	it('detects hasActiveFilters', () => {
		dashboard.set(mockDashboard);
		expect(hasActiveFilters.get()).toBe(false);

		searchQuery.set('test');
		expect(hasActiveFilters.get()).toBe(true);

		searchQuery.set('');
		selectedRepos.set(['org/alpha']);
		expect(hasActiveFilters.get()).toBe(true);
	});

	it('toggleRepo adds and removes repos', () => {
		toggleRepo('org/alpha');
		expect(selectedRepos.get()).toEqual(['org/alpha']);

		toggleRepo('org/beta');
		expect(selectedRepos.get()).toEqual(['org/alpha', 'org/beta']);

		toggleRepo('org/alpha');
		expect(selectedRepos.get()).toEqual(['org/beta']);
	});

	it('toggleLabel adds and removes labels', () => {
		toggleLabel('bug');
		expect(selectedLabels.get()).toEqual(['bug']);

		toggleLabel('bug');
		expect(selectedLabels.get()).toEqual([]);
	});

	it('clearFilters resets all filter state', () => {
		searchQuery.set('test');
		selectedRepos.set(['org/alpha']);
		selectedLabels.set(['bug']);
		filterFrom.set('2025-01-01');

		clearFilters();

		expect(searchQuery.get()).toBe('');
		expect(selectedRepos.get()).toEqual([]);
		expect(selectedLabels.get()).toEqual([]);
		expect(filterFrom.get()).toBeNull();
		expect(filterTo.get()).toBeNull();
	});

	it('toggleSection toggles collapsed state', () => {
		expect(collapsedSections.get()).toEqual({});

		toggleSection('issues');
		expect(collapsedSections.get()).toEqual({ issues: true });

		toggleSection('issues');
		expect(collapsedSections.get()).toEqual({ issues: false });
	});

	it('setPage updates currentPage', () => {
		setPage(3);
		expect(currentPage.get()).toBe(3);
	});
});
