import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { fetchUserRepos } from '$lib/server/github';
import { generateMockRepos } from '$lib/server/mock-data';

const useMockData = () => env.USE_MOCK_DATA === 'true' || (dev && env.USE_MOCK_DATA !== 'false');

export const GET: RequestHandler = async ({ url, request }) => {
	const username = url.searchParams.get('username');
	if (!username) {
		return json({ repos: [], error: 'username parameter is required' }, { status: 400 });
	}

	if (useMockData()) {
		return json({ repos: generateMockRepos(username) });
	}

	const pat = request.headers.get('x-github-pat') || undefined;
	const result = await fetchUserRepos(username, pat);

	if (result.error) {
		console.error(`[repos] Error fetching repos for ${username}:`, result.error);
		return json(result, { status: 502 });
	}

	return json(result);
};
