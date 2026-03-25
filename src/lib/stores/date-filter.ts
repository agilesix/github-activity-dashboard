import { atom, computed } from 'nanostores';

/**
 * Shared date filter state between heatmap and activity list.
 * Heatmap clicks set both from and to to the same date.
 * Date range inputs set them independently.
 */
export const filterFrom = atom<string | null>(null);
export const filterTo = atom<string | null>(null);

/** The effective date filter — null if no filter is active */
export const effectiveDateFilter = computed([filterFrom, filterTo], (from, to) => {
	if (from || to) return { from, to };
	return null;
});

/** Reset date filter */
export function clearDateFilter() {
	filterFrom.set(null);
	filterTo.set(null);
}

/** Set a date range (from inputs or heatmap click) */
export function setDateRange(from: string | null, to: string | null) {
	filterFrom.set(from);
	filterTo.set(to);
}
