import { describe, it, expect } from 'vitest';
import { getActivityTypeColor, getStateColor, getStateTitle } from './colors';

describe('getActivityTypeColor', () => {
	it('returns success color for issues_opened', () => {
		expect(getActivityTypeColor('issues_opened')).toBe('var(--color-success)');
	});

	it('returns purple for issues_closed', () => {
		expect(getActivityTypeColor('issues_closed')).toBe('#8250df');
	});

	it('returns secondary for issue_comments', () => {
		expect(getActivityTypeColor('issue_comments')).toBe('var(--color-text-secondary)');
	});

	it('returns success color for prs_opened', () => {
		expect(getActivityTypeColor('prs_opened')).toBe('var(--color-success)');
	});

	it('returns link color for pr_reviews', () => {
		expect(getActivityTypeColor('pr_reviews')).toBe('var(--color-link)');
	});

	it('returns purple for prs_merged', () => {
		expect(getActivityTypeColor('prs_merged')).toBe('#8250df');
	});

	it('returns secondary for unknown type', () => {
		expect(getActivityTypeColor('unknown')).toBe('var(--color-text-secondary)');
	});
});

describe('getStateColor', () => {
	describe('issues', () => {
		it('returns green for open', () => {
			expect(getStateColor('open', 'issues')).toBe('#1a7f37');
		});

		it('returns purple for closed', () => {
			expect(getStateColor('closed', 'issues')).toBe('#8250df');
		});

		it('returns gray for not_planned', () => {
			expect(getStateColor('not_planned', 'issues')).toBe('#656d76');
		});

		it('returns gray for unknown state', () => {
			expect(getStateColor('unknown', 'issues')).toBe('#656d76');
		});
	});

	describe('pull_requests', () => {
		it('returns green for open', () => {
			expect(getStateColor('open', 'pull_requests')).toBe('#1a7f37');
		});

		it('returns purple for merged', () => {
			expect(getStateColor('merged', 'pull_requests')).toBe('#8250df');
		});

		it('returns red for closed', () => {
			expect(getStateColor('closed', 'pull_requests')).toBe('#d1242f');
		});

		it('returns gray for draft', () => {
			expect(getStateColor('draft', 'pull_requests')).toBe('#656d76');
		});

		it('returns gray for unknown state', () => {
			expect(getStateColor('unknown', 'pull_requests')).toBe('#656d76');
		});
	});
});

describe('getStateTitle', () => {
	describe('issues', () => {
		it('returns "Open" for open', () => {
			expect(getStateTitle('open', 'issues')).toBe('Open');
		});

		it('returns "Closed" for closed', () => {
			expect(getStateTitle('closed', 'issues')).toBe('Closed');
		});

		it('returns "Not planned" for not_planned', () => {
			expect(getStateTitle('not_planned', 'issues')).toBe('Not planned');
		});

		it('returns raw state for unknown', () => {
			expect(getStateTitle('custom', 'issues')).toBe('custom');
		});
	});

	describe('pull_requests', () => {
		it('returns "Open" for open', () => {
			expect(getStateTitle('open', 'pull_requests')).toBe('Open');
		});

		it('returns "Merged" for merged', () => {
			expect(getStateTitle('merged', 'pull_requests')).toBe('Merged');
		});

		it('returns "Closed" for closed', () => {
			expect(getStateTitle('closed', 'pull_requests')).toBe('Closed');
		});

		it('returns "Draft" for draft', () => {
			expect(getStateTitle('draft', 'pull_requests')).toBe('Draft');
		});

		it('returns raw state for unknown', () => {
			expect(getStateTitle('custom', 'pull_requests')).toBe('custom');
		});
	});
});
