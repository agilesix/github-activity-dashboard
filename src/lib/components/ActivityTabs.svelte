<script lang="ts">
	import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '$lib/types';
	import type { ActivityType } from '$lib/types';

	interface Props {
		activeTab: 'all' | ActivityType;
		countsByType: Record<ActivityType, number>;
		totalCount: number;
		onchange: (tab: 'all' | ActivityType) => void;
	}

	let { activeTab, countsByType, totalCount, onchange }: Props = $props();

	const tabs: { key: 'all' | ActivityType; label: string }[] = [
		{ key: 'all', label: 'All Activity' },
		...ACTIVITY_TYPES.map((t) => ({ key: t as ActivityType, label: ACTIVITY_TYPE_LABELS[t] }))
	];

	function getCount(key: 'all' | ActivityType): number {
		if (key === 'all') return totalCount;
		return countsByType[key] || 0;
	}
</script>

<nav class="tabs">
	{#each tabs as tab (tab.key)}
		<button
			class="tab"
			class:active={activeTab === tab.key}
			onclick={() => onchange(tab.key)}
			type="button"
		>
			{tab.label}
			<span class="count">{getCount(tab.key)}</span>
		</button>
	{/each}
</nav>

<style>
	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--color-border);
		overflow-x: auto;
	}

	.tab {
		padding: 8px 14px;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--color-text-secondary);
		font-size: 13px;
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		color: var(--color-text);
		border-bottom-color: var(--color-link);
		font-weight: 600;
	}

	.count {
		font-size: 11px;
		padding: 1px 6px;
		background: var(--color-bg-secondary);
		border-radius: 10px;
		font-weight: 600;
	}

	.tab.active .count {
		background: color-mix(in srgb, var(--color-link) 12%, transparent);
		color: var(--color-link);
	}
</style>
