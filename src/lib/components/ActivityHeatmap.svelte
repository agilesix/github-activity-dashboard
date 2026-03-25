<script lang="ts">
	import type { HeatmapEntry } from '$lib/types';
	import { formatDisplayDate } from '$lib/utils';
	import { computeHeatmapGrid, getHeatmapColor } from '$lib/utils/heatmap';
	import { useStore } from '$lib/stores/use-store.svelte';
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

	const currentFrom = useStore(filterFrom);
	const currentTo = useStore(filterTo);

	let grid = $derived(computeHeatmapGrid(entries));
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

	let hasFilter = $derived(currentFrom.value !== null || currentTo.value !== null);

	function isSelected(date: string): boolean {
		const from = currentFrom.value;
		const to = currentTo.value;
		if (!from && !to) return false;
		if (from && to) return date >= from && date <= to;
		if (from) return date >= from;
		if (to) return date <= to;
		return false;
	}

	function handleCellClick(entry: HeatmapEntry) {
		if (currentFrom.value === entry.date && currentTo.value === entry.date) {
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
				fill={getHeatmapColor(cell.entry.count, maxCount)}
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
