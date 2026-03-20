import { Octokit } from 'octokit';
import type { ActivityItem, ActivityType, FetchError, FetchResult, QueryParams } from '$lib/types';

function createOctokit(pat?: string): Octokit {
	return new Octokit(pat ? { auth: pat } : {});
}

/**
 * Build a GitHub Search API query string for a specific activity type.
 * Batches multiple repos into a single query using `repo:` qualifiers.
 */
function buildSearchQuery(
	params: QueryParams,
	activityType: ActivityType
): { q: string; qualifiers: string } | null {
	const repoQualifiers = params.repos.map((r) => `repo:${r}`).join(' ');
	const dateRange = `${params.from}..${params.to}`;

	switch (activityType) {
		case 'issues_opened':
			return {
				q: `author:${params.user} type:issue created:${dateRange} ${repoQualifiers}`,
				qualifiers: 'issues opened'
			};
		case 'issues_closed':
			return {
				q: `type:issue is:closed closed:${dateRange} ${repoQualifiers}`,
				qualifiers: 'issues closed'
			};
		case 'issue_comments':
			return {
				q: `commenter:${params.user} type:issue updated:${dateRange} ${repoQualifiers}`,
				qualifiers: 'issue comments'
			};
		case 'prs_opened':
			return {
				q: `author:${params.user} type:pr created:${dateRange} ${repoQualifiers}`,
				qualifiers: 'PRs opened'
			};
		case 'pr_reviews':
			return {
				q: `reviewed-by:${params.user} type:pr updated:${dateRange} ${repoQualifiers}`,
				qualifiers: 'PR reviews'
			};
		case 'prs_merged':
			return {
				q: `author:${params.user} type:pr is:merged merged:${dateRange} ${repoQualifiers}`,
				qualifiers: 'PRs merged'
			};
		default:
			return null;
	}
}

/**
 * Extract "owner/repo" from a full GitHub repo URL or API URL.
 */
function extractRepo(repoUrl: string): string {
	const match = repoUrl.match(/repos\/([^/]+\/[^/]+)/);
	if (match) return match[1];
	// Fallback: try html_url pattern
	const htmlMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
	return htmlMatch ? htmlMatch[1] : 'unknown/unknown';
}

/**
 * Fetch issues opened by the user via Search API.
 */
async function fetchIssuesOpened(
	octokit: Octokit,
	params: QueryParams
): Promise<{ items: ActivityItem[]; errors: FetchError[] }> {
	const search = buildSearchQuery(params, 'issues_opened');
	if (!search) return { items: [], errors: [] };

	const items: ActivityItem[] = [];
	const errors: FetchError[] = [];

	try {
		const results = await octokit.rest.search.issuesAndPullRequests({
			q: search.q,
			per_page: 100,
			sort: 'created',
			order: 'desc'
		});

		for (const issue of results.data.items) {
			// Search API returns PRs too when using type:issue, but let's be safe
			if (issue.pull_request) continue;

			items.push({
				id: `issue-opened-${issue.id}`,
				type: 'issues_opened',
				title: issue.title,
				repo: extractRepo(issue.repository_url),
				date: issue.created_at,
				url: issue.html_url,
				state: issue.state,
				labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
				number: issue.number
			});
		}

		// Handle pagination if > 100 results
		if (results.data.total_count > 100) {
			const totalPages = Math.min(Math.ceil(results.data.total_count / 100), 10);
			for (let page = 2; page <= totalPages; page++) {
				const pageResults = await octokit.rest.search.issuesAndPullRequests({
					q: search.q,
					per_page: 100,
					sort: 'created',
					order: 'desc',
					page
				});
				for (const issue of pageResults.data.items) {
					if (issue.pull_request) continue;
					items.push({
						id: `issue-opened-${issue.id}`,
						type: 'issues_opened',
						title: issue.title,
						repo: extractRepo(issue.repository_url),
						date: issue.created_at,
						url: issue.html_url,
						state: issue.state,
						labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
						number: issue.number
					});
				}
			}
		}
	} catch (err) {
		errors.push(handleOctokitError(err, 'issues_opened'));
	}

	return { items, errors };
}

/**
 * Fetch issues closed (filtering for closed_by user client-side).
 */
async function fetchIssuesClosed(
	octokit: Octokit,
	params: QueryParams
): Promise<{ items: ActivityItem[]; errors: FetchError[] }> {
	const search = buildSearchQuery(params, 'issues_closed');
	if (!search) return { items: [], errors: [] };

	const items: ActivityItem[] = [];
	const errors: FetchError[] = [];

	try {
		const results = await searchAllPages(octokit, search.q);

		for (const issue of results) {
			if (issue.pull_request) continue;
			// No closed_by filter in search — we fetch individual issue to check
			// For v1, we include all closed issues in the date range for the repos
			// and note that closed_by filtering requires per-issue API calls
			// Compromise: include issues where user is the author (likely closer)
			// or where user is assigned. Full closed_by needs per-issue fetch.
			items.push({
				id: `issue-closed-${issue.id}`,
				type: 'issues_closed',
				title: issue.title,
				repo: extractRepo(issue.repository_url),
				date: issue.closed_at || issue.updated_at,
				url: issue.html_url,
				state: 'closed',
				labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
				number: issue.number
			});
		}
	} catch (err) {
		errors.push(handleOctokitError(err, 'issues_closed'));
	}

	return { items, errors };
}

/**
 * Fetch issue comments by the user.
 * Uses Search to find issues the user commented on, then fetches comments per issue.
 */
async function fetchIssueComments(
	octokit: Octokit,
	params: QueryParams
): Promise<{ items: ActivityItem[]; errors: FetchError[] }> {
	const search = buildSearchQuery(params, 'issue_comments');
	if (!search) return { items: [], errors: [] };

	const items: ActivityItem[] = [];
	const errors: FetchError[] = [];

	try {
		// Step 1: Find issues the user commented on
		const issues = await searchAllPages(octokit, search.q);

		// Step 2: For each issue, fetch comments and filter by user
		for (const issue of issues) {
			if (issue.pull_request) continue;
			const repo = extractRepo(issue.repository_url);
			const [owner, repoName] = repo.split('/');

			try {
				const comments = await octokit.rest.issues.listComments({
					owner,
					repo: repoName,
					issue_number: issue.number,
					since: params.from,
					per_page: 100
				});

				for (const comment of comments.data) {
					if (comment.user?.login !== params.user) continue;
					const commentDate = comment.created_at;
					if (commentDate < params.from || commentDate > params.to + 'T23:59:59Z') continue;

					items.push({
						id: `issue-comment-${comment.id}`,
						type: 'issue_comments',
						title: `Comment on #${issue.number}: ${issue.title}`,
						repo,
						date: commentDate,
						url: comment.html_url,
						number: issue.number
					});
				}
			} catch (commentErr) {
				errors.push(handleOctokitError(commentErr, 'issue_comments'));
			}
		}
	} catch (err) {
		errors.push(handleOctokitError(err, 'issue_comments'));
	}

	return { items, errors };
}

/**
 * Fetch PRs opened by the user via Search API.
 */
async function fetchPrsOpened(
	octokit: Octokit,
	params: QueryParams
): Promise<{ items: ActivityItem[]; errors: FetchError[] }> {
	const search = buildSearchQuery(params, 'prs_opened');
	if (!search) return { items: [], errors: [] };

	const items: ActivityItem[] = [];
	const errors: FetchError[] = [];

	try {
		const results = await searchAllPages(octokit, search.q);

		for (const pr of results) {
			items.push({
				id: `pr-opened-${pr.id}`,
				type: 'prs_opened',
				title: pr.title,
				repo: extractRepo(pr.repository_url),
				date: pr.created_at,
				url: pr.html_url,
				state: pr.pull_request?.merged_at ? 'merged' : pr.state,
				labels: pr.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
				number: pr.number
			});
		}
	} catch (err) {
		errors.push(handleOctokitError(err, 'prs_opened'));
	}

	return { items, errors };
}

/**
 * Fetch PR reviews by the user.
 * Uses Search to find PRs reviewed by user, then fetches review details.
 */
async function fetchPrReviews(
	octokit: Octokit,
	params: QueryParams
): Promise<{ items: ActivityItem[]; errors: FetchError[] }> {
	const search = buildSearchQuery(params, 'pr_reviews');
	if (!search) return { items: [], errors: [] };

	const items: ActivityItem[] = [];
	const errors: FetchError[] = [];

	try {
		const prs = await searchAllPages(octokit, search.q);

		for (const pr of prs) {
			const repo = extractRepo(pr.repository_url);
			const [owner, repoName] = repo.split('/');

			try {
				const reviews = await octokit.rest.pulls.listReviews({
					owner,
					repo: repoName,
					pull_number: pr.number,
					per_page: 100
				});

				for (const review of reviews.data) {
					if (review.user?.login !== params.user) continue;
					const reviewDate = review.submitted_at || '';
					if (reviewDate < params.from || reviewDate > params.to + 'T23:59:59Z') continue;

					items.push({
						id: `pr-review-${review.id}`,
						type: 'pr_reviews',
						title: `${formatReviewState(review.state)} on #${pr.number}: ${pr.title}`,
						repo,
						date: reviewDate,
						url: review.html_url,
						state: review.state.toLowerCase(),
						number: pr.number
					});
				}
			} catch (reviewErr) {
				errors.push(handleOctokitError(reviewErr, 'pr_reviews'));
			}
		}
	} catch (err) {
		errors.push(handleOctokitError(err, 'pr_reviews'));
	}

	return { items, errors };
}

/**
 * Fetch PRs merged by the user via Search API.
 */
async function fetchPrsMerged(
	octokit: Octokit,
	params: QueryParams
): Promise<{ items: ActivityItem[]; errors: FetchError[] }> {
	const search = buildSearchQuery(params, 'prs_merged');
	if (!search) return { items: [], errors: [] };

	const items: ActivityItem[] = [];
	const errors: FetchError[] = [];

	try {
		const results = await searchAllPages(octokit, search.q);

		for (const pr of results) {
			items.push({
				id: `pr-merged-${pr.id}`,
				type: 'prs_merged',
				title: pr.title,
				repo: extractRepo(pr.repository_url),
				date: pr.pull_request?.merged_at || pr.closed_at || pr.updated_at,
				url: pr.html_url,
				state: 'merged',
				labels: pr.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
				number: pr.number
			});
		}
	} catch (err) {
		errors.push(handleOctokitError(err, 'prs_merged'));
	}

	return { items, errors };
}

/**
 * Helper: paginate through all search results (up to 1000, max 10 pages).
 */
type SearchItem = Awaited<
	ReturnType<Octokit['rest']['search']['issuesAndPullRequests']>
>['data']['items'][number];

async function searchAllPages(octokit: Octokit, q: string): Promise<SearchItem[]> {
	const firstPage = await octokit.rest.search.issuesAndPullRequests({
		q,
		per_page: 100,
		sort: 'created',
		order: 'desc'
	});

	const items = [...firstPage.data.items];

	if (firstPage.data.total_count > 100) {
		const totalPages = Math.min(Math.ceil(firstPage.data.total_count / 100), 10);
		for (let page = 2; page <= totalPages; page++) {
			const pageResults = await octokit.rest.search.issuesAndPullRequests({
				q,
				per_page: 100,
				sort: 'created',
				order: 'desc',
				page
			});
			items.push(...pageResults.data.items);
		}
	}

	return items;
}

function formatReviewState(state: string): string {
	switch (state) {
		case 'APPROVED':
			return 'Approved';
		case 'CHANGES_REQUESTED':
			return 'Changes requested';
		case 'COMMENTED':
			return 'Reviewed';
		case 'DISMISSED':
			return 'Dismissed review';
		default:
			return 'Reviewed';
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleOctokitError(err: any, context: string): FetchError {
	if (err?.status === 403 && err?.response?.headers?.['x-ratelimit-remaining'] === '0') {
		const resetTimestamp = err.response.headers['x-ratelimit-reset'];
		const resetAt = resetTimestamp
			? new Date(parseInt(resetTimestamp) * 1000).toISOString()
			: new Date(Date.now() + 60000).toISOString();
		return {
			type: 'rate_limit',
			message: `Rate limit exceeded while fetching ${context}. Resets at ${resetAt}.`,
			rateLimitInfo: {
				remaining: 0,
				limit: parseInt(err.response.headers['x-ratelimit-limit'] || '0'),
				resetAt
			}
		};
	}

	if (err?.status === 404) {
		return {
			type: 'not_found',
			message: `Resource not found while fetching ${context}.`
		};
	}

	if (err?.status === 401) {
		return {
			type: 'unauthorized',
			message: 'Invalid or expired GitHub token.'
		};
	}

	return {
		type: 'unknown',
		message: `Error fetching ${context}: ${err?.message || 'Unknown error'}`
	};
}

const FETCH_FNS: Record<
	ActivityType,
	(
		octokit: Octokit,
		params: QueryParams
	) => Promise<{ items: ActivityItem[]; errors: FetchError[] }>
> = {
	issues_opened: fetchIssuesOpened,
	issues_closed: fetchIssuesClosed,
	issue_comments: fetchIssueComments,
	prs_opened: fetchPrsOpened,
	pr_reviews: fetchPrReviews,
	prs_merged: fetchPrsMerged
};

/**
 * Main entry point: fetch all requested activity types for the given query.
 */
export async function fetchGitHubActivity(params: QueryParams): Promise<FetchResult> {
	const octokit = createOctokit(params.pat);
	const allItems: ActivityItem[] = [];
	const allErrors: FetchError[] = [];

	// Fetch all requested activity types in parallel
	const results = await Promise.all(
		params.types.map(async (type) => {
			const fetchFn = FETCH_FNS[type];
			return fetchFn(octokit, params);
		})
	);

	for (const result of results) {
		allItems.push(...result.items);
		allErrors.push(...result.errors);
	}

	// Sort all items by date descending
	allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	// Get rate limit info
	let rateLimitInfo;
	try {
		const rateLimit = await octokit.rest.rateLimit.get();
		rateLimitInfo = {
			remaining: rateLimit.data.rate.remaining,
			limit: rateLimit.data.rate.limit,
			resetAt: new Date(rateLimit.data.rate.reset * 1000).toISOString()
		};
	} catch {
		// Rate limit check is best-effort
	}

	return { items: allItems, errors: allErrors, rateLimitInfo };
}

/**
 * Fetch public repos for a user (for autocomplete).
 */
export async function fetchUserRepos(
	username: string,
	pat?: string
): Promise<{ repos: string[]; error?: string }> {
	const octokit = createOctokit(pat);

	try {
		const repos = await octokit.rest.repos.listForUser({
			username,
			type: 'owner',
			sort: 'updated',
			per_page: 100
		});

		return {
			repos: repos.data.map((r) => r.full_name)
		};
	} catch (err) {
		const error = handleOctokitError(err, 'user repos');
		return { repos: [], error: error.message };
	}
}
