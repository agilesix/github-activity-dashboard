import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { parseQueryParams, validateQueryParams } from '$lib/utils';
import { readCache, writeCache } from '$lib/server/cache';
import { fetchGitHubActivity } from '$lib/server/github';
import { generateMockData } from '$lib/server/mock-data';
import type { DashboardData } from '$lib/types';

const useMockData = () => env.USE_MOCK_DATA === 'true' || (dev && env.USE_MOCK_DATA !== 'false');

export const GET: RequestHandler = async ({ url, request, platform }) => {
	const params = parseQueryParams(url.searchParams);
	if (!params) {
		return json(
			{ error: 'Missing or invalid query parameters. Required: user, repos, from, to.' },
			{ status: 400 }
		);
	}

	const validationErrors = validateQueryParams(params);
	if (validationErrors.length > 0) {
		return json({ error: validationErrors.join(' ') }, { status: 400 });
	}

	// Attach PAT from header (never in URL)
	const pat = request.headers.get('x-github-pat') || undefined;
	if (pat) {
		params.pat = pat;
	}

	// Use mock data in dev mode
	if (useMockData()) {
		const dashboard = generateMockData(params);
		return json({ dashboard, fromCache: false, errors: [], rateLimitInfo: undefined });
	}

	const refresh = url.searchParams.get('refresh') === 'true';
	const kv = platform?.env?.CACHE;

	// Check cache (unless refresh requested)
	if (!refresh) {
		const cached = await readCache(kv, params);
		if (cached) {
			return json({ dashboard: cached, fromCache: true, errors: [], rateLimitInfo: undefined });
		}
	}

	// Fetch from GitHub
	const result = await fetchGitHubActivity(params);

	const dashboard: DashboardData = {
		query: params,
		items: result.items,
		fetchedAt: new Date().toISOString()
	};

	// Write to cache
	await writeCache(kv, params, dashboard);

	return json({
		dashboard,
		fromCache: false,
		errors: result.errors,
		rateLimitInfo: result.rateLimitInfo
	});
};
