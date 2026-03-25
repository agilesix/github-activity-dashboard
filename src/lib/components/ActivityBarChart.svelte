<script lang="ts">
	import type { ActivityItem, ActivityType } from '$lib/types';
	import {
		ACTIVITY_TYPE_SHORT_LABELS,
		ACTIVITY_TYPE_CATEGORY,
		ACTIVITY_CATEGORY_LABELS,
		ACTIVITY_TYPE_LABELS
	} from '$lib/types';
	import type { ActivityCategory } from '$lib/types';

	interface Props {
		items: ActivityItem[];
		allItems: ActivityItem[];
		repos: string[];
	}

	let { items, allItems, repos }: Props = $props();

	// Green scale for Issues (light → dark), Blue scale for PRs (light → dark)
	const TYPE_COLORS: Record<ActivityType, string> = {
		issues_opened: '#aff5b4',
		issue_comments: '#3fb950',
		issues_closed: '#196c2e',
		prs_opened: '#b6d9ff',
		pr_reviews: '#388bfd',
		prs_merged: '#1158c7'
	};

	// Segment order: opened, commented, closed for issues; opened, reviewed, merged for PRs
	const SEGMENT_ORDER: ActivityType[] = [
		'issues_opened',
		'issue_comments',
		'issues_closed',
		'prs_opened',
		'pr_reviews',
		'prs_merged'
	];

	interface RepoBar {
		repo: string;
		label: string;
		total: number;
		segments: { type: ActivityType; count: number; width: number }[];
	}

	// Tooltip state
	let tooltip = $state<{ repo: string; line: string; x: number; y: number } | null>(null);

	function showSegmentTooltip(repo: string, type: ActivityType, count: number, event: MouseEvent) {
		tooltip = {
			repo,
			line: `${ACTIVITY_TYPE_LABELS[type]}: ${count}`,
			x: event.clientX,
			y: event.clientY - 8
		};
	}

	function moveTooltip(event: MouseEvent) {
		if (tooltip) {
			tooltip = { ...tooltip, x: event.clientX, y: event.clientY - 8 };
		}
	}

	function hideTooltip() {
		tooltip = null;
	}

	// Fixed scale based on ALL items (not filtered), so bars grow as types are selected
	let maxCount = $derived(
		Math.max(
			1,
			...repos.map((r) => {
				const lower = r.toLowerCase();
				return allItems.filter((i) => i.repo.toLowerCase() === lower).length;
			})
		)
	);

	// Compute nice tick marks for the scale
	let scaleTicks = $derived.by((): number[] => {
		if (maxCount <= 5) return Array.from({ length: maxCount + 1 }, (_, i) => i);
		const step = Math.ceil(maxCount / 4);
		const rounded = Math.ceil(step / 5) * 5;
		const ticks: number[] = [0];
		let v = rounded;
		while (v < maxCount) {
			ticks.push(v);
			v += rounded;
		}
		ticks.push(maxCount);
		return ticks;
	});

	let bars = $derived.by((): RepoBar[] => {
		return repos.map((repo) => {
			const lower = repo.toLowerCase();
			const repoItems = items.filter((i) => i.repo.toLowerCase() === lower);
			const total = repoItems.length;

			const segments: RepoBar['segments'] = [];
			for (const type of SEGMENT_ORDER) {
				const count = repoItems.filter((i) => i.type === type).length;
				if (count > 0) {
					const width = (count / maxCount) * 100;
					segments.push({ type, count, width });
				}
			}

			return { repo, label: repo, total, segments };
		});
	});

	// Group active types by category for the legend
	const LEGEND_ORDER: ActivityCategory[] = ['issues', 'pull_requests'];

	let legendGroups = $derived.by(() => {
		const activeTypes = SEGMENT_ORDER.filter((type) => items.some((i) => i.type === type));
		return LEGEND_ORDER.map((cat) => ({
			label: ACTIVITY_CATEGORY_LABELS[cat],
			types: activeTypes.filter((t) => ACTIVITY_TYPE_CATEGORY[t] === cat)
		})).filter((g) => g.types.length > 0);
	});
</script>

{#if allItems.length > 0}
	<div class="bar-chart">
		<div class="chart-area">
			<div class="bars">
				{#each bars as bar (bar.repo)}
					<div class="bar-row">
						<span class="bar-label" title={bar.repo}>{bar.label}</span>
						<div
							class="bar-track"
							role="img"
							aria-label="{bar.repo}: {bar.total} activities"
							onmouseleave={hideTooltip}
						>
							{#each bar.segments as seg (seg.type)}
								<div
									class="bar-segment"
									role="presentation"
									style="width: {seg.width}%; background: {TYPE_COLORS[seg.type]};"
									onmouseenter={(e) => showSegmentTooltip(bar.repo, seg.type, seg.count, e)}
									onmousemove={moveTooltip}
								></div>
							{/each}
						</div>
						<span class="bar-count">{bar.total}</span>
					</div>
				{/each}
			</div>
			<div class="scale">
				{#each scaleTicks as tick (tick)}
					<span class="tick" style="left: {(tick / maxCount) * 100}%;">{tick}</span>
				{/each}
			</div>
		</div>
		<div class="legend">
			{#each legendGroups as group (group.label)}
				<div class="legend-group">
					<span class="legend-group-label">{group.label}</span>
					<div class="legend-group-items">
						{#each group.types as type (type)}
							<span class="legend-item">
								<span class="legend-swatch" style="background: {TYPE_COLORS[type]};"></span>
								{ACTIVITY_TYPE_SHORT_LABELS[type]}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if tooltip}
	<div class="tooltip" style="left: {tooltip.x}px; top: {tooltip.y}px;">
		<div class="tooltip-repo">{tooltip.repo}</div>
		<div class="tooltip-detail">{tooltip.line}</div>
	</div>
{/if}

<style>
	.bar-chart {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.chart-area {
		display: flex;
		flex-direction: column;
	}

	.bars {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bar-label {
		flex-shrink: 0;
		width: 160px;
		font-size: 12px;
		font-family: var(--font-mono);
		color: var(--color-text-secondary);
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bar-track {
		flex: 1;
		display: flex;
		height: 18px;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
		overflow: hidden;
		cursor: default;
	}

	.bar-segment {
		height: 100%;
		transition: width 0.2s ease;
	}

	.bar-segment:first-child {
		border-radius: var(--radius-sm) 0 0 var(--radius-sm);
	}

	.bar-segment:last-child {
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}

	.bar-segment:only-child {
		border-radius: var(--radius-sm);
	}

	.bar-count {
		flex-shrink: 0;
		width: 32px;
		font-size: 12px;
		color: var(--color-text-secondary);
		font-weight: 600;
	}

	/* Scale axis */
	.scale {
		position: relative;
		height: 20px;
		margin-left: 168px; /* label width + gap */
		margin-right: 40px; /* count width + gap */
		border-top: 1px solid var(--color-border);
	}

	.tick {
		position: absolute;
		top: 4px;
		transform: translateX(-50%);
		font-size: 10px;
		color: var(--color-text-secondary);
	}

	/* Tooltip */
	.tooltip {
		position: fixed;
		pointer-events: none;
		transform: translate(-50%, -100%);
		background: var(--color-text);
		color: var(--color-bg);
		font-size: 12px;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		white-space: nowrap;
		z-index: 10;
		line-height: 1.4;
	}

	.tooltip-repo {
		font-weight: 600;
	}

	.tooltip-detail {
		opacity: 0.85;
	}

	/* Legend */
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.legend-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.legend-group-label {
		font-size: 10px;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.legend-group-items {
		display: flex;
		gap: 8px;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: var(--color-text-secondary);
	}

	.legend-swatch {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.bar-label {
			width: 100px;
			font-size: 11px;
		}

		.scale {
			margin-left: 108px;
		}
	}
</style>
