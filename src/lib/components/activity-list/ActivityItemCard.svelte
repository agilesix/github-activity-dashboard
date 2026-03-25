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

	let typeLabel = $derived((item.labels ?? []).find((l) => isTypeLabel(l)));
	let otherLabels = $derived((item.labels ?? []).filter((l) => !isTypeLabel(l)));
</script>

<li class="item">
	<div class="activity-type-col">
		<span class="activity-type-label" style="color: {getActivityTypeColor(item.type)}">
			{ACTIVITY_TYPE_SHORT_LABELS[item.type]}
		</span>
		<span class="item-date">{formatDisplayDate(item.date)}</span>
	</div>
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
		</div>
		{#if typeLabel || (item.assignees && item.assignees.length > 0)}
			<div class="item-details">
				{#if typeLabel}
					<span class="type-badge">{typeLabel}</span>
				{/if}
				{#if item.assignees && item.assignees.length > 0}
					<span class="item-assignees">
						<svg
							class="assignee-icon"
							width="12"
							height="12"
							viewBox="0 0 16 16"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"
							/>
						</svg>
						{item.assignees.join(', ')}
					</span>
				{/if}
			</div>
		{/if}
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

	.activity-type-col {
		flex-shrink: 0;
		width: 80px;
		padding-top: 3px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.activity-type-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.item-date {
		font-size: 11px;
		color: var(--color-text-secondary);
		white-space: nowrap;
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
		flex: 1;
		min-width: 0;
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
		align-items: center;
	}

	.item-repo {
		font-family: var(--font-mono);
	}

	.item-details {
		display: flex;
		gap: 10px;
		font-size: 12px;
		color: var(--color-text-secondary);
		align-items: center;
		margin-top: 4px;
	}

	.item-assignees {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}

	.assignee-icon {
		flex-shrink: 0;
		opacity: 0.6;
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

	@media (max-width: 640px) {
		.activity-type-col {
			width: 72px;
		}

		.activity-type-label {
			font-size: 9px;
		}

		/* Align metadata rows with title text, past the 16px icon + 6px gap */
		.item-meta,
		.item-details,
		.item-labels {
			margin-left: 22px;
		}
	}
</style>
