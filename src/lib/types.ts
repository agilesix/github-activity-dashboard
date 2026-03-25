export const ACTIVITY_TYPES = [
	'issues_opened',
	'issues_closed',
	'issue_comments',
	'prs_opened',
	'pr_reviews',
	'prs_merged'
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
	issues_opened: 'Issues opened',
	issues_closed: 'Issues closed',
	issue_comments: 'Issue comments',
	prs_opened: 'PRs created',
	pr_reviews: 'PR reviews',
	prs_merged: 'PRs merged'
};

export type ActivityCategory = 'issues' | 'pull_requests';

export const ACTIVITY_TYPE_CATEGORY: Record<ActivityType, ActivityCategory> = {
	issues_opened: 'issues',
	issues_closed: 'issues',
	issue_comments: 'issues',
	prs_opened: 'pull_requests',
	pr_reviews: 'pull_requests',
	prs_merged: 'pull_requests'
};

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
	issues: 'Issues',
	pull_requests: 'Pull Requests'
};

/** Short label for the sub-type within its category (e.g., "Opened" instead of "Issues Opened") */
export const ACTIVITY_TYPE_SHORT_LABELS: Record<ActivityType, string> = {
	issues_opened: 'Opened',
	issues_closed: 'Closed',
	issue_comments: 'Comments',
	prs_opened: 'Opened',
	pr_reviews: 'Reviews',
	prs_merged: 'Merged'
};

export interface QueryParams {
	user: string;
	repos: string[]; // "owner/repo" format
	from: string; // ISO date string YYYY-MM-DD
	to: string; // ISO date string YYYY-MM-DD
	types: ActivityType[];
	pat?: string; // optional GitHub PAT (session-only, never persisted)
}

export interface ActivityItem {
	id: string;
	type: ActivityType;
	title: string;
	repo: string; // "owner/repo"
	date: string; // ISO date string
	url: string; // link to GitHub
	state?: string; // open, closed, merged, etc.
	labels?: string[];
	number?: number; // issue or PR number
	assignees?: string[]; // GitHub login usernames
}

/**
 * Well-known labels that represent issue/PR type rather than general tags.
 * Matched case-insensitively. Covers GitHub defaults and common conventions.
 */
export const ISSUE_TYPE_LABELS = new Set([
	'bug',
	'enhancement',
	'feature',
	'feature request',
	'documentation',
	'docs',
	'question',
	'security',
	'maintenance',
	'chore',
	'refactor',
	'performance',
	'accessibility',
	'design',
	'testing',
	'ci/cd',
	'infrastructure',
	'dependencies',
	'breaking change'
]);

export function isTypeLabel(label: string): boolean {
	return ISSUE_TYPE_LABELS.has(label.toLowerCase());
}

export interface HeatmapEntry {
	date: string; // YYYY-MM-DD
	count: number;
}

export interface SummaryStats {
	totalItems: number;
	countsByType: Record<ActivityType, number>;
	mostActiveRepo: string | null;
	mostActiveDay: string | null; // YYYY-MM-DD
}

export interface DashboardData {
	query: QueryParams;
	items: ActivityItem[];
	fetchedAt: string; // ISO timestamp
}

export interface GitHubRateLimitInfo {
	remaining: number;
	limit: number;
	resetAt: string; // ISO timestamp
}

export interface FetchError {
	type: 'rate_limit' | 'not_found' | 'unauthorized' | 'unknown';
	message: string;
	rateLimitInfo?: GitHubRateLimitInfo;
}

export interface FetchResult {
	items: ActivityItem[];
	errors: FetchError[];
	rateLimitInfo?: GitHubRateLimitInfo;
}

export interface GroupedSection {
	category: ActivityCategory;
	categoryLabel: string;
	items: ActivityItem[];
}
