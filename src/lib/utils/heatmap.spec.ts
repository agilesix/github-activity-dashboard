import { describe, it, expect } from 'vitest';
import type { HeatmapEntry } from '$lib/types';
import { computeHeatmapGrid, getHeatmapColor } from './heatmap';

describe('computeHeatmapGrid', () => {
	it('returns empty grid for empty entries', () => {
		const grid = computeHeatmapGrid([]);
		expect(grid.cells).toHaveLength(0);
		expect(grid.monthLabels).toHaveLength(0);
		expect(grid.totalCols).toBe(0);
	});

	it('assigns correct row based on day of week (Sunday=0, Monday=1)', () => {
		// 2025-01-05 is a Sunday, 2025-01-06 is a Monday
		const entries: HeatmapEntry[] = [
			{ date: '2025-01-05', count: 1 },
			{ date: '2025-01-06', count: 2 }
		];
		const grid = computeHeatmapGrid(entries);
		expect(grid.cells[0].row).toBe(0); // Sunday
		expect(grid.cells[1].row).toBe(1); // Monday
	});

	it('increments column for each new week', () => {
		const entries: HeatmapEntry[] = [
			{ date: '2025-01-05', count: 1 }, // Sunday week 0
			{ date: '2025-01-12', count: 1 } // Sunday week 1
		];
		const grid = computeHeatmapGrid(entries);
		expect(grid.cells[0].col).toBe(0);
		expect(grid.cells[1].col).toBe(1);
		expect(grid.totalCols).toBe(2);
	});

	it('generates month labels', () => {
		// Span two months
		const entries: HeatmapEntry[] = [];
		const start = new Date('2025-01-15T00:00:00');
		for (let i = 0; i < 45; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			entries.push({ date: d.toISOString().split('T')[0], count: 0 });
		}
		const grid = computeHeatmapGrid(entries);
		expect(grid.monthLabels.length).toBeGreaterThanOrEqual(1);
		const labels = grid.monthLabels.map((l) => l.text);
		expect(labels.some((l) => l === 'Jan' || l === 'Feb')).toBe(true);
	});

	it('drops month labels that are too close together (< 3 cols apart)', () => {
		// A very short range straddling a month boundary
		const entries: HeatmapEntry[] = [
			{ date: '2025-01-31', count: 1 }, // Friday
			{ date: '2025-02-01', count: 1 } // Saturday — same week
		];
		const grid = computeHeatmapGrid(entries);
		// Both dates are in the same column, so < 3 cols apart.
		// Only the last label (Feb) should survive.
		expect(grid.monthLabels).toHaveLength(1);
		expect(grid.monthLabels[0].text).toBe('Feb');
	});
});

describe('getHeatmapColor', () => {
	it('returns level 0 for count 0', () => {
		expect(getHeatmapColor(0, 10)).toBe('var(--heatmap-0)');
	});

	it('returns level 1 for ratio <= 0.25', () => {
		expect(getHeatmapColor(1, 10)).toBe('var(--heatmap-1)');
		expect(getHeatmapColor(2, 8)).toBe('var(--heatmap-1)');
	});

	it('returns level 2 for ratio <= 0.5', () => {
		expect(getHeatmapColor(5, 10)).toBe('var(--heatmap-2)');
	});

	it('returns level 3 for ratio <= 0.75', () => {
		expect(getHeatmapColor(7, 10)).toBe('var(--heatmap-3)');
	});

	it('returns level 4 for ratio > 0.75', () => {
		expect(getHeatmapColor(10, 10)).toBe('var(--heatmap-4)');
	});

	it('returns level 4 for single item when maxCount is 1', () => {
		expect(getHeatmapColor(1, 1)).toBe('var(--heatmap-4)');
	});
});
