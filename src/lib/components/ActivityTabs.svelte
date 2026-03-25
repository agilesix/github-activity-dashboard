<script lang="ts">
	import type { ActivityType } from '$lib/types';
	import { ACTIVITY_TYPE_SHORT_LABELS, ACTIVITY_TYPE_LABELS } from '$lib/types';
	import { useStore } from '$lib/stores/use-store.svelte';
	import { selectedTypes } from '$lib/stores/dashboard-store';
	import { toggleActivityType, clearActivityTypes } from '$lib/stores/activity-filter-store';

	interface Props {
		countsByType: Record<ActivityType, number>;
		totalCount: number;
	}

	let { countsByType, totalCount }: Props = $props();

	const types = useStore(selectedTypes);

	interface TabGroup {
		label: string | null;
		tabs: { key: ActivityType | 'all'; label: string; fullLabel: string }[];
	}

	const groups: TabGroup[] = [
		{
			label: null,
			tabs: [{ key: 'all', label: 'All Activity', fullLabel: 'All Activity' }]
		},
		{
			label: 'Issues',
			tabs: [
				{
					key: 'issues_opened' as const,
					label: ACTIVITY_TYPE_SHORT_LABELS.issues_opened,
					fullLabel: ACTIVITY_TYPE_LABELS.issues_opened
				},
				{
					key: 'issue_comments' as const,
					label: ACTIVITY_TYPE_SHORT_LABELS.issue_comments,
					fullLabel: ACTIVITY_TYPE_LABELS.issue_comments
				},
				{
					key: 'issues_closed' as const,
					label: ACTIVITY_TYPE_SHORT_LABELS.issues_closed,
					fullLabel: ACTIVITY_TYPE_LABELS.issues_closed
				}
			]
		},
		{
			label: 'Pull Requests',
			tabs: [
				{
					key: 'prs_opened' as const,
					label: ACTIVITY_TYPE_SHORT_LABELS.prs_opened,
					fullLabel: ACTIVITY_TYPE_LABELS.prs_opened
				},
				{
					key: 'pr_reviews' as const,
					label: ACTIVITY_TYPE_SHORT_LABELS.pr_reviews,
					fullLabel: ACTIVITY_TYPE_LABELS.pr_reviews
				},
				{
					key: 'prs_merged' as const,
					label: ACTIVITY_TYPE_SHORT_LABELS.prs_merged,
					fullLabel: ACTIVITY_TYPE_LABELS.prs_merged
				}
			]
		}
	];

	function getCount(key: ActivityType | 'all'): number {
		if (key === 'all') return totalCount;
		return countsByType[key] || 0;
	}

	function isActive(key: ActivityType | 'all'): boolean {
		if (key === 'all') return types.value.length === 0;
		return types.value.includes(key);
	}

	function handleClick(key: ActivityType | 'all') {
		if (key === 'all') {
			clearActivityTypes();
		} else {
			toggleActivityType(key);
		}
	}
</script>

<nav class="tabs" aria-label="Activity type filter">
	{#each groups as group (group.label ?? 'all')}
		<div class="group" role="group" aria-label={group.label ?? 'All'}>
			{#if group.label}
				<span class="group-label" aria-hidden="true">{group.label}</span>
			{/if}
			<div class="group-pills">
				{#each group.tabs as tab (tab.key)}
					<button
						class="pill"
						class:active={isActive(tab.key)}
						onclick={() => handleClick(tab.key)}
						type="button"
						aria-label="{tab.fullLabel} ({getCount(tab.key)})"
						aria-pressed={isActive(tab.key)}
					>
						{tab.label}
						<span class="count" aria-hidden="true">{getCount(tab.key)}</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		gap: 16px;
		align-items: flex-end;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--color-border);
		flex-wrap: wrap;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.group-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding-left: 4px;
	}

	.group-pills {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.pill {
		padding: 5px 12px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 20px;
		color: var(--color-text-secondary);
		font-size: 13px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.pill:hover {
		background: var(--color-border);
		color: var(--color-text);
	}

	.pill.active {
		background: color-mix(in srgb, var(--color-link) 10%, transparent);
		border-color: var(--color-link);
		color: var(--color-link);
		font-weight: 600;
	}

	.count {
		font-size: 11px;
		padding: 1px 6px;
		background: color-mix(in srgb, currentColor 8%, transparent);
		border-radius: 10px;
		font-weight: 600;
	}

	.pill.active .count {
		background: color-mix(in srgb, var(--color-link) 15%, transparent);
	}

	@media (max-width: 640px) {
		.tabs {
			gap: 12px;
		}

		.pill {
			padding: 4px 10px;
			font-size: 12px;
		}

		.count {
			font-size: 10px;
			padding: 1px 5px;
		}
	}
</style>
