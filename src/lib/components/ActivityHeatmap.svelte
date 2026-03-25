<script lang="ts">
	import type { HeatmapEntry } from '$lib/types';
	import { formatDisplayDate } from '$lib/utils';
	import { filterFrom, filterTo, setDateRange, clearDateFilter } from '$lib/stores/date-filter';

	interface Props {
		entries: HeatmapEntry[];
	}

	let { entries }: Props = $props();

	const cellSize = 12;
	const cellGap = 2;
	const cellStep = cellSize + cellGap;
	const dayLabelWidth = 28;
	const monthLabelHeight = 16;

	const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

	let tooltip = $state<{ text: string; x: number; y: number } | null>(null);
	let currentFrom = $state<string | null>(null);
	let currentTo = $state<string | null>(null);

	$effect(() => {
		const unsub = filterFrom.subscribe((v) => {
			currentFrom = v;
		});
		return unsub;
	});

	$effect(() => {
		const unsub = filterTo.subscribe((v) => {
			currentTo = v;
		});
		return unsub;
	});

	function getColor(count: number, maxCount: number): string {
		if (count === 0) return 'var(--heatmap-0)';
		const ratio = count / maxCount;
		if (ratio <= 0.25) return 'var(--heatmap-1)';
		if (ratio <= 0.5) return 'var(--heatmap-2)';
		if (ratio <= 0.75) return 'var(--heatmap-3)';
		return 'var(--heatmap-4)';
	}

	// Compute grid position for each cell and month labels from the flat entries list.
	// Each entry gets a column (week index) and row (day of week) based on the
	// number of days since the start date's week-start (Sunday).
	interface Cell {
		entry: HeatmapEntry;
		col: number;
		row: number;
	}

	let grid = $derived.by(() => {
		if (entries.length === 0)
			return {
				cells: [] as Cell[],
				monthLabels: [] as { text: string; col: number }[],
				totalCols: 0
			};

		// Find the Sunday on or before the first entry
		const firstDate = new Date(entries[0].date + 'T00:00:00');
		const startTime = firstDate.getTime() - firstDate.getDay() * 86400000;
		const msPerDay = 86400000;

		const cells: Cell[] = [];
		const monthLabels: { text: string; col: number }[] = [];
		let lastMonth = -1;

		// First pass: collect all month boundaries
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

		// Second pass: remove labels that are too close, preferring the later one
		// (i.e., if Dec col=0 and Jan col=1, drop Dec and keep Jan)
		for (let i = 0; i < rawLabels.length - 1; i++) {
			if (rawLabels[i + 1].col - rawLabels[i].col < 3) {
				// Skip the earlier label
				continue;
			}
			monthLabels.push(rawLabels[i]);
		}
		// Always include the last label
		if (rawLabels.length > 0) {
			monthLabels.push(rawLabels[rawLabels.length - 1]);
		}

		const totalCols = cells.length > 0 ? cells[cells.length - 1].col + 1 : 0;
		return { cells, monthLabels, totalCols };
	});

	let maxCount = $derived(Math.max(1, ...entries.map((e) => e.count)));
	let svgWidth = $derived(dayLabelWidth + grid.totalCols * cellStep + cellGap);
	let svgHeight = $derived(monthLabelHeight + 7 * cellStep + cellGap);

	function showTooltip(entry: HeatmapEntry, event: MouseEvent) {
		const count = entry.count;
		const label = count === 0 ? 'No activity' : `${count} activit${count === 1 ? 'y' : 'ies'}`;
		tooltip = {
			text: `${label} on ${formatDisplayDate(entry.date)}`,
			x: event.clientX,
			y: event.clientY - 8
		};
	}

	function hideTooltip() {
		tooltip = null;
	}

	let hasFilter = $derived(currentFrom !== null || currentTo !== null);

	function isSelected(date: string): boolean {
		if (!currentFrom && !currentTo) return false;
		if (currentFrom && currentTo) return date >= currentFrom && date <= currentTo;
		if (currentFrom) return date >= currentFrom;
		if (currentTo) return date <= currentTo;
		return false;
	}

	function handleCellClick(entry: HeatmapEntry) {
		// Toggle off if clicking the same single-date filter
		if (currentFrom === entry.date && currentTo === entry.date) {
			clearDateFilter();
		} else {
			setDateRange(entry.date, entry.date);
		}
	}
</script>

<div class="heatmap-container">
	<svg width={svgWidth} height={svgHeight}>
		{#each grid.monthLabels as label (label.col)}
			<text x={dayLabelWidth + label.col * cellStep} y={12} class="label month-label">
				{label.text}
			</text>
		{/each}

		{#each dayLabels as label, i (i)}
			<text x={0} y={monthLabelHeight + i * cellStep + cellSize - 2} class="label day-label">
				{label}
			</text>
		{/each}

		{#each grid.cells as cell (cell.entry.date)}
			<rect
				x={dayLabelWidth + cell.col * cellStep}
				y={monthLabelHeight + cell.row * cellStep}
				width={cellSize}
				height={cellSize}
				rx="2"
				fill={getColor(cell.entry.count, maxCount)}
				opacity={hasFilter && !isSelected(cell.entry.date) ? 0.3 : 1}
				onmouseenter={(e) => showTooltip(cell.entry, e)}
				onmouseleave={hideTooltip}
				onclick={() => handleCellClick(cell.entry)}
				role="button"
				tabindex={0}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleCellClick(cell.entry);
					}
				}}
				aria-label={`${cell.entry.count} activit${cell.entry.count === 1 ? 'y' : 'ies'} on ${formatDisplayDate(cell.entry.date)}`}
				aria-pressed={isSelected(cell.entry.date)}
			/>
		{/each}
	</svg>

	<div class="legend">
		<span class="legend-label">Less</span>
		<span class="legend-cell" style="background: var(--heatmap-0)"></span>
		<span class="legend-cell" style="background: var(--heatmap-1)"></span>
		<span class="legend-cell" style="background: var(--heatmap-2)"></span>
		<span class="legend-cell" style="background: var(--heatmap-3)"></span>
		<span class="legend-cell" style="background: var(--heatmap-4)"></span>
		<span class="legend-label">More</span>
	</div>
</div>

{#if tooltip}
	<div class="tooltip" style="left: {tooltip.x}px; top: {tooltip.y}px;">
		{tooltip.text}
	</div>
{/if}

<style>
	.heatmap-container {
		overflow-x: auto;
	}

	.label {
		font-size: 10px;
		fill: var(--color-text-secondary);
	}

	.day-label {
		font-size: 9px;
	}

	rect {
		cursor: pointer;
	}

	.tooltip {
		position: fixed;
		pointer-events: none;
		transform: translate(-50%, -100%);
		background: var(--color-text);
		color: var(--color-bg);
		font-size: 12px;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		white-space: nowrap;
		z-index: 10;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 3px;
		margin-top: 8px;
		justify-content: flex-end;
	}

	.legend-label {
		font-size: 11px;
		color: var(--color-text-secondary);
	}

	.legend-cell {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}
</style>
