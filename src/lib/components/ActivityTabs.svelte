<script lang="ts">
	import type { ActivityType } from '$lib/types';

	interface Props {
		activeTab: 'all' | ActivityType;
		countsByType: Record<ActivityType, number>;
		totalCount: number;
		onchange: (tab: 'all' | ActivityType) => void;
	}

	let { activeTab, countsByType, totalCount, onchange }: Props = $props();

	type TabKey = 'all' | ActivityType;

	interface TabGroup {
		label: string | null;
		tabs: { key: TabKey; label: string; fullLabel: string }[];
	}

	const groups: TabGroup[] = [
		{
			label: null,
			tabs: [{ key: 'all', label: 'All Activity', fullLabel: 'All Activity' }]
		},
		{
			label: 'Issues',
			tabs: [
				{ key: 'issues_opened', label: 'Opened', fullLabel: 'Issues Opened' },
				{ key: 'issue_comments', label: 'Comments', fullLabel: 'Issue Comments' },
				{ key: 'issues_closed', label: 'Closed', fullLabel: 'Issues Closed' }
			]
		},
		{
			label: 'Pull Requests',
			tabs: [
				{ key: 'prs_opened', label: 'Opened', fullLabel: 'PRs Opened' },
				{ key: 'pr_reviews', label: 'Reviews', fullLabel: 'PR Reviews' },
				{ key: 'prs_merged', label: 'Merged', fullLabel: 'PRs Merged' }
			]
		}
	];

	function getCount(key: TabKey): number {
		if (key === 'all') return totalCount;
		return countsByType[key] || 0;
	}

	function handleSelectChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		onchange(value as TabKey);
	}
</script>

<!-- Desktop: grouped pills -->
<nav class="tabs-desktop" aria-label="Activity type filter">
	{#each groups as group (group.label ?? 'all')}
		<div class="group" role="group" aria-label={group.label ?? 'All'}>
			{#if group.label}
				<span class="group-label" aria-hidden="true">{group.label}</span>
			{/if}
			<div class="group-pills">
				{#each group.tabs as tab (tab.key)}
					<button
						class="pill"
						class:active={activeTab === tab.key}
						onclick={() => onchange(tab.key)}
						type="button"
						aria-label="{tab.fullLabel} ({getCount(tab.key)})"
						aria-pressed={activeTab === tab.key}
					>
						{tab.label}
						<span class="count" aria-hidden="true">{getCount(tab.key)}</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}
</nav>

<!-- Mobile: grouped dropdown + count badge -->
<div class="tabs-mobile">
	<select value={activeTab} onchange={handleSelectChange} aria-label="Activity type filter">
		{#each groups as group (group.label ?? 'all')}
			{#if group.label}
				<optgroup label={group.label}>
					{#each group.tabs as tab (tab.key)}
						<option value={tab.key}>{tab.fullLabel} ({getCount(tab.key)})</option>
					{/each}
				</optgroup>
			{:else}
				{#each group.tabs as tab (tab.key)}
					<option value={tab.key}>{tab.fullLabel} ({getCount(tab.key)})</option>
				{/each}
			{/if}
		{/each}
	</select>
	<span class="mobile-count" aria-live="polite" aria-label="Count for selected filter">
		{getCount(activeTab)}
	</span>
</div>

<style>
	.tabs-desktop {
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

	/* Mobile dropdown */
	.tabs-mobile {
		display: none;
		align-items: center;
		gap: 10px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--color-border);
	}

	.tabs-mobile select {
		flex: 1;
		padding: 6px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 14px;
		background: var(--color-bg);
		color: var(--color-text);
	}

	.mobile-count {
		font-size: 13px;
		font-weight: 700;
		padding: 3px 10px;
		background: color-mix(in srgb, var(--color-link) 12%, transparent);
		color: var(--color-link);
		border-radius: 10px;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.tabs-desktop {
			display: none;
		}

		.tabs-mobile {
			display: flex;
		}
	}
</style>
