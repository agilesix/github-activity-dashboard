import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { parseQueryParams, validateQueryParams } from '$lib/utils';
import { readCache, writeCache } from '$lib/server/cache';
import { fetchGitHubActivity } from '$lib/server/github';
import { generateMockData } from '$lib/server/mock-data';
import type { DashboardData } from '$lib/types';

const useMockData = () => env.USE_MOCK_DATA === 'true' || (dev && env.USE_MOCK_DATA !== 'false');

export const load: PageServerLoad = async ({ url, platform }) => {
	const params = parseQueryParams(url.searchParams);
	if (!params) {
		error(400, 'Missing or invalid query parameters. Required: user, repos, from, to.');
	}

	const validationErrors = validateQueryParams(params);
	if (validationErrors.length > 0) {
		error(400, validationErrors.join(' '));
	}

	// Use mock data in dev mode (override with USE_MOCK_DATA=false to use real API)
	if (useMockData()) {
		const dashboard = generateMockData(params);
		return { dashboard, fromCache: false, errors: [], rateLimitInfo: undefined };
	}

	const refresh = url.searchParams.get('refresh') === 'true';
	const kv = platform?.env?.CACHE;

	// Check cache (unless refresh requested)
	if (!refresh) {
		const cached = await readCache(kv, params);
		if (cached) {
			return { dashboard: cached, fromCache: true };
		}
	}

	// Fetch from GitHub
	const result = await fetchGitHubActivity(params);

	const dashboard: DashboardData = {
		query: params,
		items: result.items,
		fetchedAt: new Date().toISOString()
	};

	// Write to cache (non-blocking on Cloudflare, best-effort locally)
	await writeCache(kv, params, dashboard);

	return {
		dashboard,
		fromCache: false,
		errors: result.errors,
		rateLimitInfo: result.rateLimitInfo
	};
};
