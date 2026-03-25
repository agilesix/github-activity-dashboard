import type { ActivityItem, ActivityCategory, ActivityType, GroupedSection } from '$lib/types';
import { ACTIVITY_TYPE_CATEGORY, ACTIVITY_CATEGORY_LABELS } from '$lib/types';

// =======================================================================
// Filter functions
// =======================================================================

export function filterByDateRange(
	items: ActivityItem[],
	from: string | null,
	to: string | null
): ActivityItem[] {
	if (!from && !to) return items;
	return items.filter((i) => {
		const day = i.date.split('T')[0];
		if (from && day < from) return false;
		if (to && day > to) return false;
		return true;
	});
}

export function filterByRepos(items: ActivityItem[], repos: string[]): ActivityItem[] {
	if (repos.length === 0) return items;
	const lower = repos.map((r) => r.toLowerCase());
	return items.filter((i) => lower.includes(i.repo.toLowerCase()));
}

export function filterByLabels(items: ActivityItem[], labels: string[]): ActivityItem[] {
	if (labels.length === 0) return items;
	return items.filter((i) => i.labels?.some((l) => labels.includes(l)));
}

export function filterBySearch(items: ActivityItem[], query: string): ActivityItem[] {
	const q = query.trim().toLowerCase();
	if (!q) return items;
	return items.filter(
		(i) =>
			i.title.toLowerCase().includes(q) ||
			i.repo.toLowerCase().includes(q) ||
			(i.number && `#${i.number}`.includes(q))
	);
}

export function filterByActivityType(items: ActivityItem[], types: ActivityType[]): ActivityItem[] {
	if (types.length === 0) return items;
	return items.filter((i) => types.includes(i.type));
}

// =======================================================================
// Grouping
// =======================================================================

export function groupByCategory(items: ActivityItem[]): GroupedSection[] {
	const groups: Record<string, ActivityItem[]> = {};
	for (const item of items) {
		const cat = ACTIVITY_TYPE_CATEGORY[item.type];
		if (!groups[cat]) groups[cat] = [];
		groups[cat].push(item);
	}

	const sections: GroupedSection[] = [];
	const order: ActivityCategory[] = ['issues', 'pull_requests'];
	for (const cat of order) {
		const catItems = groups[cat];
		if (catItems && catItems.length > 0) {
			sections.push({
				category: cat,
				categoryLabel: ACTIVITY_CATEGORY_LABELS[cat],
				items: catItems
			});
		}
	}
	return sections;
}
