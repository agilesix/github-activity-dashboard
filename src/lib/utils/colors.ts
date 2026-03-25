import type { ActivityCategory } from '$lib/types';

// =======================================================================
// Activity type colors
// =======================================================================

export function getActivityTypeColor(type: string): string {
	switch (type) {
		case 'issues_opened':
			return 'var(--color-success)';
		case 'issues_closed':
			return '#8250df';
		case 'issue_comments':
			return 'var(--color-text-secondary)';
		case 'prs_opened':
			return 'var(--color-success)';
		case 'pr_reviews':
			return 'var(--color-link)';
		case 'prs_merged':
			return '#8250df';
		default:
			return 'var(--color-text-secondary)';
	}
}

// =======================================================================
// Issue / PR state colors and titles
// =======================================================================

export function getStateColor(state: string, category: ActivityCategory): string {
	if (category === 'pull_requests') {
		switch (state) {
			case 'merged':
				return '#8250df';
			case 'open':
				return '#1a7f37';
			case 'closed':
				return '#d1242f';
			case 'draft':
				return '#656d76';
			default:
				return '#656d76';
		}
	}
	switch (state) {
		case 'open':
			return '#1a7f37';
		case 'closed':
			return '#8250df';
		case 'not_planned':
			return '#656d76';
		default:
			return '#656d76';
	}
}

export function getStateTitle(state: string, category: ActivityCategory): string {
	if (category === 'pull_requests') {
		switch (state) {
			case 'merged':
				return 'Merged';
			case 'open':
				return 'Open';
			case 'closed':
				return 'Closed';
			case 'draft':
				return 'Draft';
			default:
				return state;
		}
	}
	switch (state) {
		case 'open':
			return 'Open';
		case 'closed':
			return 'Closed';
		case 'not_planned':
			return 'Not planned';
		default:
			return state;
	}
}
