<script lang="ts">
	import type { HeatmapEntry } from '$lib/types';

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

	function getColor(count: number, maxCount: number): string {
		if (count === 0) return 'var(--heatmap-0)';
		const ratio = count / maxCount;
		if (ratio <= 0.25) return 'var(--heatmap-1)';
		if (ratio <= 0.5) return 'var(--heatmap-2)';
		if (ratio <= 0.75) return 'var(--heatmap-3)';
		return 'var(--heatmap-4)';
	}

	interface WeekColumn {
		weekIndex: number;
		days: { entry: HeatmapEntry; dayOfWeek: number }[];
	}

	let weeks = $derived.by(() => {
		if (entries.length === 0) return [];

		const cols: WeekColumn[] = [];
		let currentWeek: WeekColumn = { weekIndex: 0, days: [] };

		for (const entry of entries) {
			const date = new Date(entry.date + 'T00:00:00');
			const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

			if (dayOfWeek === 0 && currentWeek.days.length > 0) {
				cols.push(currentWeek);
				currentWeek = { weekIndex: cols.length, days: [] };
			}

			currentWeek.days.push({ entry, dayOfWeek });
		}

		if (currentWeek.days.length > 0) {
			cols.push(currentWeek);
		}

		return cols;
	});

	let maxCount = $derived(Math.max(1, ...entries.map((e) => e.count)));

	let monthLabels = $derived.by(() => {
		const labels: { text: string; weekIndex: number }[] = [];
		let lastMonth = -1;

		for (const week of weeks) {
			for (const day of week.days) {
				const date = new Date(day.entry.date + 'T00:00:00');
				const month = date.getMonth();
				if (month !== lastMonth) {
					labels.push({
						text: date.toLocaleDateString('en-US', { month: 'short' }),
						weekIndex: week.weekIndex
					});
					lastMonth = month;
				}
				break; // Only check first day of each week
			}
		}

		return labels;
	});

	let svgWidth = $derived(dayLabelWidth + weeks.length * cellStep + cellGap);
	let svgHeight = $derived(monthLabelHeight + 7 * cellStep + cellGap);
</script>

<div class="heatmap-container">
	<svg width={svgWidth} height={svgHeight}>
		<!-- Month labels -->
		{#each monthLabels as label (label.weekIndex)}
			<text x={dayLabelWidth + label.weekIndex * cellStep} y={12} class="label month-label">
				{label.text}
			</text>
		{/each}

		<!-- Day labels -->
		{#each dayLabels as label, i (i)}
			<text x={0} y={monthLabelHeight + i * cellStep + cellSize - 2} class="label day-label">
				{label}
			</text>
		{/each}

		<!-- Cells -->
		{#each weeks as week (week.weekIndex)}
			{#each week.days as day (day.entry.date)}
				<rect
					x={dayLabelWidth + week.weekIndex * cellStep}
					y={monthLabelHeight + day.dayOfWeek * cellStep}
					width={cellSize}
					height={cellSize}
					rx="2"
					fill={getColor(day.entry.count, maxCount)}
				>
					<title>{day.entry.date}: {day.entry.count} activities</title>
				</rect>
			{/each}
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
