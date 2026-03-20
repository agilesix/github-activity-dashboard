import { ACTIVITY_TYPES } from './types';
import type { ActivityItem, ActivityType, HeatmapEntry, QueryParams, SummaryStats } from './types';

/**
 * Parse query parameters from a URL search params object.
 */
export function parseQueryParams(searchParams: URLSearchParams): QueryParams | null {
	const user = searchParams.get('user');
	const reposParam = searchParams.get('repos');
	const from = searchParams.get('from');
	const to = searchParams.get('to');
	const typesParam = searchParams.get('types');

	if (!user || !reposParam || !from || !to) return null;

	const repos = reposParam
		.split(',')
		.map((r) => r.trim())
		.filter(Boolean)
		.sort();
	const types = typesParam
		? (typesParam
				.split(',')
				.map((t) => t.trim())
				.filter((t) => ACTIVITY_TYPES.includes(t as ActivityType)) as ActivityType[])
		: [...ACTIVITY_TYPES];

	if (repos.length === 0 || types.length === 0) return null;

	return { user, repos, from, to, types: types.sort() };
}

/**
 * Encode query params into a URL search string.
 */
export function encodeQueryParams(params: QueryParams): string {
	const searchParams = new URLSearchParams();
	searchParams.set('user', params.user);
	searchParams.set('repos', [...params.repos].sort().join(','));
	searchParams.set('from', params.from);
	searchParams.set('to', params.to);
	searchParams.set('types', [...params.types].sort().join(','));
	return searchParams.toString();
}

/**
 * Compute a canonical string for cache key generation.
 * Sorts repos and types to ensure consistent keys.
 */
export function canonicalQueryString(params: QueryParams): string {
	return `user=${params.user}&repos=${[...params.repos].sort().join(',')}&from=${params.from}&to=${params.to}&types=${[...params.types].sort().join(',')}`;
}

/**
 * Get the default date range (last 90 days).
 */
export function getDefaultDateRange(): { from: string; to: string } {
	const to = new Date();
	const from = new Date();
	from.setDate(from.getDate() - 90);
	return {
		from: formatDate(from),
		to: formatDate(to)
	};
}

/**
 * Format a Date as YYYY-MM-DD.
 */
export function formatDate(date: Date): string {
	return date.toISOString().split('T')[0];
}

/**
 * Format an ISO date string for display (e.g., "Mar 20, 2026").
 */
export function formatDisplayDate(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return 'just now';
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return formatDisplayDate(isoString);
}

/**
 * Build heatmap entries from activity items for a date range.
 */
export function buildHeatmapData(items: ActivityItem[], from: string, to: string): HeatmapEntry[] {
	// Count items per day
	const counts = new Map<string, number>();
	for (const item of items) {
		const day = item.date.split('T')[0];
		counts.set(day, (counts.get(day) || 0) + 1);
	}

	// Fill in all days in the range
	const entries: HeatmapEntry[] = [];
	const current = new Date(from);
	const end = new Date(to);
	while (current <= end) {
		const dateStr = formatDate(current);
		entries.push({ date: dateStr, count: counts.get(dateStr) || 0 });
		current.setDate(current.getDate() + 1);
	}

	return entries;
}

/**
 * Compute summary stats from activity items.
 */
export function computeSummaryStats(items: ActivityItem[]): SummaryStats {
	const countsByType: Record<ActivityType, number> = {
		issues_opened: 0,
		issues_closed: 0,
		issue_comments: 0,
		prs_opened: 0,
		pr_reviews: 0,
		prs_merged: 0
	};

	const repoCounts = new Map<string, number>();
	const dayCounts = new Map<string, number>();

	for (const item of items) {
		countsByType[item.type]++;
		repoCounts.set(item.repo, (repoCounts.get(item.repo) || 0) + 1);
		const day = item.date.split('T')[0];
		dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
	}

	let mostActiveRepo: string | null = null;
	let maxRepoCount = 0;
	for (const [repo, count] of repoCounts) {
		if (count > maxRepoCount) {
			mostActiveRepo = repo;
			maxRepoCount = count;
		}
	}

	let mostActiveDay: string | null = null;
	let maxDayCount = 0;
	for (const [day, count] of dayCounts) {
		if (count > maxDayCount) {
			mostActiveDay = day;
			maxDayCount = count;
		}
	}

	return {
		totalItems: items.length,
		countsByType,
		mostActiveRepo,
		mostActiveDay
	};
}

/**
 * Validate query params and return errors.
 */
export function validateQueryParams(params: QueryParams): string[] {
	const errors: string[] = [];

	if (!params.user.trim()) errors.push('GitHub username is required.');
	if (params.repos.length === 0) errors.push('At least one repository is required.');
	if (params.repos.length > 10) errors.push('Maximum 10 repositories allowed.');
	if (!params.from || !params.to) errors.push('Date range is required.');
	if (params.types.length === 0) errors.push('At least one activity type is required.');

	if (params.from && params.to) {
		const fromDate = new Date(params.from);
		const toDate = new Date(params.to);
		if (fromDate > toDate) errors.push('Start date must be before end date.');
		const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
		if (diffDays > 365) errors.push('Date range cannot exceed 1 year.');
	}

	for (const repo of params.repos) {
		if (!repo.match(/^[^/]+\/[^/]+$/)) {
			errors.push(`Invalid repository format: "${repo}". Use "owner/repo".`);
		}
	}

	return errors;
}
