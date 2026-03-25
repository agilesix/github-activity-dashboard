import type { HeatmapEntry } from '$lib/types';

// =======================================================================
// Types
// =======================================================================

export interface HeatmapCell {
	entry: HeatmapEntry;
	col: number;
	row: number;
}

export interface HeatmapGrid {
	cells: HeatmapCell[];
	monthLabels: { text: string; col: number }[];
	totalCols: number;
}

// =======================================================================
// Grid computation
// =======================================================================

export function computeHeatmapGrid(entries: HeatmapEntry[]): HeatmapGrid {
	if (entries.length === 0) {
		return { cells: [], monthLabels: [], totalCols: 0 };
	}

	const firstDate = new Date(entries[0].date + 'T00:00:00');
	const startTime = firstDate.getTime() - firstDate.getDay() * 86400000;
	const msPerDay = 86400000;

	const cells: HeatmapCell[] = [];
	let lastMonth = -1;

	const rawLabels: { text: string; col: number }[] = [];
	for (const entry of entries) {
		const date = new Date(entry.date + 'T00:00:00');
		const daysSinceStart = Math.round((date.getTime() - startTime) / msPerDay);
		const col = Math.floor(daysSinceStart / 7);
		const row = daysSinceStart % 7;

		cells.push({ entry, col, row });

		const month = date.getMonth();
		if (month !== lastMonth) {
			rawLabels.push({
				text: date.toLocaleDateString('en-US', { month: 'short' }),
				col
			});
			lastMonth = month;
		}
	}

	const monthLabels: { text: string; col: number }[] = [];
	for (let i = 0; i < rawLabels.length - 1; i++) {
		if (rawLabels[i + 1].col - rawLabels[i].col < 3) {
			continue;
		}
		monthLabels.push(rawLabels[i]);
	}
	if (rawLabels.length > 0) {
		monthLabels.push(rawLabels[rawLabels.length - 1]);
	}

	const totalCols = cells.length > 0 ? cells[cells.length - 1].col + 1 : 0;
	return { cells, monthLabels, totalCols };
}

// =======================================================================
// Color mapping
// =======================================================================

export function getHeatmapColor(count: number, maxCount: number): string {
	if (count === 0) return 'var(--heatmap-0)';
	const ratio = count / maxCount;
	if (ratio <= 0.25) return 'var(--heatmap-1)';
	if (ratio <= 0.5) return 'var(--heatmap-2)';
	if (ratio <= 0.75) return 'var(--heatmap-3)';
	return 'var(--heatmap-4)';
}
