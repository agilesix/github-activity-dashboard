import type { ActivityItem, DashboardData, QueryParams } from '$lib/types';
import { ACTIVITY_TYPES } from '$lib/types';

/**
 * Generate realistic mock activity data for development.
 * Avoids hitting GitHub API during local dev.
 *
 * Enable with USE_MOCK_DATA=true environment variable.
 */
export function generateMockData(params: QueryParams): DashboardData {
	const items: ActivityItem[] = [];
	const fromDate = new Date(params.from);
	const toDate = new Date(params.to);
	const dayCount = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

	let id = 0;

	for (const type of params.types) {
		// Generate a realistic number of items per type
		const count = getRandomCount(type, dayCount);

		for (let i = 0; i < count; i++) {
			const repo = params.repos[Math.floor(Math.random() * params.repos.length)];
			const date = randomDateInRange(fromDate, toDate);
			const number = Math.floor(Math.random() * 500) + 1;

			items.push({
				id: `mock-${type}-${id++}`,
				type,
				title: generateTitle(type, number),
				repo,
				date: date.toISOString(),
				url: `https://github.com/${repo}/${type.includes('pr') ? 'pull' : 'issues'}/${number}`,
				state: generateState(type),
				labels: generateLabels(),
				number,
				assignees: generateAssignees(params.user)
			});
		}
	}

	items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return {
		query: params,
		items,
		fetchedAt: new Date().toISOString()
	};
}

function getRandomCount(type: (typeof ACTIVITY_TYPES)[number], dayCount: number): number {
	const base = dayCount / 90; // Scale with date range
	const ranges: Record<string, [number, number]> = {
		issues_opened: [5, 20],
		issues_closed: [3, 15],
		issue_comments: [15, 60],
		prs_opened: [8, 30],
		pr_reviews: [10, 40],
		prs_merged: [5, 25]
	};
	const [min, max] = ranges[type] || [5, 20];
	return Math.floor((Math.random() * (max - min) + min) * base);
}

function randomDateInRange(from: Date, to: Date): Date {
	const diff = to.getTime() - from.getTime();
	return new Date(from.getTime() + Math.random() * diff);
}

function generateTitle(type: string, number: number): string {
	const issueTitles = [
		'Fix broken navigation on mobile',
		'Add dark mode support',
		'Update documentation for API v2',
		'Improve error handling in auth flow',
		'Migrate database schema for new fields',
		'Optimize query performance for dashboard',
		'Add unit tests for utility functions',
		'Refactor component state management',
		'Fix race condition in data fetching',
		'Add input validation for form fields'
	];

	const prTitles = [
		'feat: add user profile page',
		'fix: resolve memory leak in event handler',
		'chore: update dependencies',
		'refactor: extract shared utilities',
		'docs: update README with setup instructions',
		'feat: implement caching layer',
		'fix: correct date formatting in reports',
		'feat: add export functionality',
		'chore: configure CI/CD pipeline',
		'fix: handle edge case in pagination'
	];

	const commentTitles = [
		`Comment on #${number}: Fix broken navigation on mobile`,
		`Comment on #${number}: Add dark mode support`,
		`Comment on #${number}: Update documentation for API v2`
	];

	const reviewTitles = [
		`Approved #${number}: feat: add user profile page`,
		`Changes requested on #${number}: fix: resolve memory leak`,
		`Reviewed #${number}: chore: update dependencies`
	];

	switch (type) {
		case 'issues_opened':
		case 'issues_closed':
			return issueTitles[Math.floor(Math.random() * issueTitles.length)];
		case 'issue_comments':
			return commentTitles[Math.floor(Math.random() * commentTitles.length)];
		case 'prs_opened':
		case 'prs_merged':
			return prTitles[Math.floor(Math.random() * prTitles.length)];
		case 'pr_reviews':
			return reviewTitles[Math.floor(Math.random() * reviewTitles.length)];
		default:
			return `Activity item #${number}`;
	}
}

function generateState(type: string): string {
	switch (type) {
		case 'issues_opened':
			return Math.random() > 0.3 ? 'open' : 'closed';
		case 'issues_closed':
			return 'closed';
		case 'issue_comments':
			return Math.random() > 0.3 ? 'open' : 'closed';
		case 'prs_opened':
			return ['open', 'closed', 'merged'][Math.floor(Math.random() * 3)];
		case 'prs_merged':
			return 'merged';
		case 'pr_reviews':
			return ['open', 'closed', 'merged'][Math.floor(Math.random() * 3)];
		default:
			return 'open';
	}
}

function generateAssignees(user: string): string[] {
	const others = ['alice', 'bob', 'carol', 'dave'];
	if (Math.random() > 0.6) return [];
	const assignees = [user];
	if (Math.random() > 0.5) {
		assignees.push(others[Math.floor(Math.random() * others.length)]);
	}
	return assignees;
}

function generateLabels(): string[] {
	const allLabels = ['bug', 'enhancement', 'documentation', 'good first issue', 'help wanted'];
	if (Math.random() > 0.6) return [];
	const count = Math.floor(Math.random() * 2) + 1;
	return allLabels.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Generate mock repo list for autocomplete.
 */
export function generateMockRepos(username: string): string[] {
	return [
		`${username}/webapp`,
		`${username}/api-server`,
		`${username}/docs`,
		`${username}/cli-tool`,
		`${username}/shared-utils`,
		`${username}/design-system`,
		`${username}/infrastructure`,
		`${username}/mobile-app`
	];
}
