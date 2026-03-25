import { atom } from 'nanostores';
import type {
	ActivityType,
	DashboardData,
	FetchError,
	GitHubRateLimitInfo,
	QueryParams
} from '$lib/types';
import { encodeQueryParams } from '$lib/utils';
import { buildCacheKey, readSessionCache, writeSessionCache } from '$lib/utils/cache';

// =======================================================================
// Atoms
// =======================================================================

export const dashboard = atom<DashboardData | null>(null);
export const loading = atom(true);
export const loadError = atom<string | null>(null);
export const fromCache = atom(false);
export const errors = atom<FetchError[]>([]);
export const rateLimitInfo = atom<GitHubRateLimitInfo | undefined>(undefined);
export const activeTab = atom<'all' | ActivityType>('all');

// =======================================================================
// Types
// =======================================================================

interface CachedDashboard {
	dashboard: DashboardData;
	errors: FetchError[];
	rateLimitInfo?: GitHubRateLimitInfo;
}

export interface FetchDashboardOpts {
	refresh?: boolean;
}

// =======================================================================
// Actions
// =======================================================================

export async function fetchDashboard(
	params: QueryParams,
	opts?: FetchDashboardOpts
): Promise<{ refreshed: boolean }> {
	const refresh = opts?.refresh ?? false;

	// Check session cache first (unless refresh requested)
	if (!refresh) {
		const key = buildCacheKey(params);
		const cached = readSessionCache<CachedDashboard>(key);
		if (cached) {
			dashboard.set(cached.dashboard);
			fromCache.set(true);
			errors.set(cached.errors ?? []);
			rateLimitInfo.set(cached.rateLimitInfo);
			loading.set(false);
			return { refreshed: false };
		}
	}

	loading.set(true);
	loadError.set(null);
	activeTab.set('all');

	const queryString = encodeQueryParams(params);
	let url = `/api/activity?${queryString}`;
	if (refresh) url += '&refresh=true';

	const headers: Record<string, string> = {};
	const pat = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('github_pat') : null;
	if (pat) headers['x-github-pat'] = pat;

	try {
		const res = await fetch(url, { headers });
		const data = (await res.json()) as {
			dashboard?: DashboardData;
			fromCache?: boolean;
			errors?: FetchError[];
			rateLimitInfo?: GitHubRateLimitInfo;
			error?: string;
		};

		if (data.error) {
			loadError.set(data.error);
		} else if (data.dashboard) {
			dashboard.set(data.dashboard);
			fromCache.set(data.fromCache ?? false);
			errors.set(data.errors ?? []);
			rateLimitInfo.set(data.rateLimitInfo);

			writeSessionCache(buildCacheKey(params), {
				dashboard: data.dashboard,
				errors: data.errors ?? [],
				rateLimitInfo: data.rateLimitInfo
			});
		}

		loading.set(false);
		return { refreshed: refresh };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Failed to fetch activity data.';
		loadError.set(message);
		loading.set(false);
		return { refreshed: refresh };
	}
}

export function resetDashboard() {
	dashboard.set(null);
	loading.set(true);
	loadError.set(null);
	fromCache.set(false);
	errors.set([]);
	rateLimitInfo.set(undefined);
	activeTab.set('all');
}
