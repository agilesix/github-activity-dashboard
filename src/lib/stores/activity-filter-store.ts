import { atom, computed } from 'nanostores';
import type { ActivityItem, ActivityType, GroupedSection } from '$lib/types';
import {
	filterByDateRange,
	filterByRepos,
	filterByLabels,
	filterBySearch,
	filterByActivityType,
	groupByCategory
} from '$lib/utils/filters';
import { dashboard, activeTab } from './dashboard-store';
import { effectiveDateFilter, clearDateFilter } from './date-filter';

const PAGE_SIZE = 100;

// =======================================================================
// Filter atoms
// =======================================================================

export const searchQuery = atom('');
export const selectedRepos = atom<string[]>([]);
export const selectedLabels = atom<string[]>([]);
export const currentPage = atom(1);
export const collapsedSections = atom<Record<string, boolean>>({});

// =======================================================================
// Computed stores
// =======================================================================

// Computed: items filtered only by activity type tab (for heatmap — no date/repo/label/search)
export const tabFilteredItems = computed([dashboard, activeTab], (dash, tab) => {
	if (!dash) return [];
	return filterByActivityType(dash.items, tab);
});

// Computed: filtered items (chains all filters)
export const filteredItems = computed(
	[dashboard, activeTab, effectiveDateFilter, selectedRepos, selectedLabels, searchQuery],
	(dash, tab, dateFilter, repos, labels, query) => {
		if (!dash) return [];
		let items: ActivityItem[] = dash.items;
		items = filterByActivityType(items, tab);
		if (dateFilter) {
			items = filterByDateRange(items, dateFilter.from, dateFilter.to);
		}
		items = filterByRepos(items, repos);
		items = filterByLabels(items, labels);
		items = filterBySearch(items, query);
		return items;
	}
);

// Computed: pagination
export const totalPages = computed(filteredItems, (items) =>
	Math.max(1, Math.ceil(items.length / PAGE_SIZE))
);

export const pagedItems = computed([filteredItems, currentPage], (items, page) =>
	items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
);

// Computed: grouped sections for display
export const groupedSections = computed(pagedItems, (items): GroupedSection[] =>
	groupByCategory(items)
);

// Computed: all unique labels from dashboard items
export const allLabels = computed(dashboard, (dash) => {
	if (!dash) return [];
	return [...new Set(dash.items.flatMap((i) => i.labels ?? []))].filter(Boolean).sort();
});

// Computed: whether any filter is active
export const hasActiveFilters = computed(
	[searchQuery, selectedRepos, selectedLabels, effectiveDateFilter],
	(query, repos, labels, dateFilter) =>
		query.trim() !== '' || repos.length > 0 || labels.length > 0 || dateFilter !== null
);

// =======================================================================
// Actions
// =======================================================================

export function toggleRepo(repo: string) {
	const current = selectedRepos.get();
	selectedRepos.set(
		current.includes(repo) ? current.filter((r) => r !== repo) : [...current, repo]
	);
}

export function toggleLabel(label: string) {
	const current = selectedLabels.get();
	selectedLabels.set(
		current.includes(label) ? current.filter((l) => l !== label) : [...current, label]
	);
}

export function clearFilters() {
	searchQuery.set('');
	selectedRepos.set([]);
	selectedLabels.set([]);
	clearDateFilter();
}

export function setActiveTab(tab: 'all' | ActivityType) {
	activeTab.set(tab);
}

export function toggleSection(category: string) {
	const current = collapsedSections.get();
	collapsedSections.set({ ...current, [category]: !current[category] });
}

export function setPage(page: number) {
	currentPage.set(page);
}

// =======================================================================
// Auto-reset currentPage to 1 when any filter changes
// =======================================================================

let initialized = false;
function setupAutoReset() {
	if (initialized) return;
	initialized = true;

	const resetPage = () => {
		currentPage.set(1);
		collapsedSections.set({});
	};

	// Listen to filter changes, but skip the first emission
	for (const store of [searchQuery, selectedRepos, selectedLabels, effectiveDateFilter]) {
		let first = true;
		store.listen(() => {
			if (first) {
				first = false;
				return;
			}
			resetPage();
		});
	}
}

setupAutoReset();
