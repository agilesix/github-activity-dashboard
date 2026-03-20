import type { DashboardData, QueryParams } from '$lib/types';
import { canonicalQueryString } from '$lib/utils';

interface CacheEnvelope {
	fetchedAt: string;
	data: DashboardData;
}

/**
 * Compute a cache key from query params using a SHA-256 hash of the canonical query string.
 */
export async function computeCacheKey(params: QueryParams): Promise<string> {
	const canonical = canonicalQueryString(params);
	const encoder = new TextEncoder();
	const data = encoder.encode(canonical);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return `results:${hashHex}`;
}

/**
 * Compute adaptive TTL based on how recent the query end date is.
 * - End date is today/yesterday: 1 hour (3600s)
 * - End date is 2-7 days ago: 4 hours (14400s)
 * - End date is 7+ days ago: 24 hours (86400s)
 */
export function computeTtl(toDate: string): number {
	const endDate = new Date(toDate);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

	if (diffDays <= 1) return 3600;
	if (diffDays <= 7) return 14400;
	return 86400;
}

/**
 * Read cached dashboard data from KV.
 */
export async function readCache(
	kv: KVNamespace | undefined,
	params: QueryParams
): Promise<DashboardData | null> {
	if (!kv) return null;

	try {
		const key = await computeCacheKey(params);
		const raw = await kv.get(key, 'json');
		if (!raw) return null;

		const envelope = raw as CacheEnvelope;
		return envelope.data;
	} catch {
		return null;
	}
}

/**
 * Write dashboard data to KV cache.
 */
export async function writeCache(
	kv: KVNamespace | undefined,
	params: QueryParams,
	data: DashboardData
): Promise<void> {
	if (!kv) return;

	try {
		const key = await computeCacheKey(params);
		const ttl = computeTtl(params.to);
		const envelope: CacheEnvelope = { fetchedAt: data.fetchedAt, data };
		await kv.put(key, JSON.stringify(envelope), { expirationTtl: ttl });
	} catch {
		// Cache write failures are non-fatal
	}
}
