<script lang="ts">
	import type { ActivityItem } from '$lib/types';
	import { ACTIVITY_TYPE_CATEGORY, ACTIVITY_TYPE_SHORT_LABELS, isTypeLabel } from '$lib/types';
	import { formatDisplayDate } from '$lib/utils';
	import { getActivityTypeColor } from '$lib/utils/colors';
	import StateIcon from '../StateIcon.svelte';

	interface Props {
		item: ActivityItem;
	}

	let { item }: Props = $props();

	let typeLabels = $derived((item.labels ?? []).filter((l) => isTypeLabel(l)));
	let otherLabels = $derived((item.labels ?? []).filter((l) => !isTypeLabel(l)));
</script>

<li class="item">
	<span class="activity-type-label" style="color: {getActivityTypeColor(item.type)}">
		{ACTIVITY_TYPE_SHORT_LABELS[item.type]}
	</span>
	<div class="item-content">
		<div class="item-title-row">
			<StateIcon state={item.state || 'open'} category={ACTIVITY_TYPE_CATEGORY[item.type]} />
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external GitHub URL -->
			<a href={item.url} target="_blank" rel="noopener noreferrer" class="item-title">
				{#if item.number}
					<span class="item-number">#{item.number}</span>
				{/if}
				{item.title}
			</a>
		</div>
		<div class="item-meta">
			<span class="item-repo">{item.repo}</span>
			{#if typeLabels.length > 0}
				{#each typeLabels as tl (tl)}
					<span class="type-badge">{tl}</span>
				{/each}
			{/if}
			<span class="item-date">{formatDisplayDate(item.date)}</span>
		</div>
		{#if otherLabels.length > 0}
			<div class="item-labels">
				{#each otherLabels as label (label)}
					<span class="label-badge">{label}</span>
				{/each}
			</div>
		{/if}
	</div>
</li>

<style>
	.item {
		display: flex;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
	}

	.item:last-child {
		border-bottom: none;
	}

	.activity-type-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		flex-shrink: 0;
		width: 62px;
		padding-top: 3px;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-title-row {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-bottom: 4px;
	}

	.item-title {
		font-size: 14px;
		font-weight: 600;
	}

	.item-number {
		color: var(--color-text-secondary);
		font-weight: 400;
	}

	.item-meta {
		display: flex;
		gap: 10px;
		font-size: 12px;
		color: var(--color-text-secondary);
		flex-wrap: wrap;
		align-items: center;
	}

	.item-repo {
		font-family: var(--font-mono);
	}

	.type-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 0 6px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-link) 10%, transparent);
		color: var(--color-link);
		text-transform: capitalize;
	}

	.item-labels {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}

	.label-badge {
		font-size: 11px;
		padding: 0 6px;
		border: 1px solid var(--color-border);
		border-radius: 10px;
		color: var(--color-text-secondary);
		background: var(--color-bg-secondary);
	}
</style>
