<script lang="ts">
	import type { ActivityItem } from '$lib/types';
	import { ACTIVITY_TYPE_LABELS } from '$lib/types';
	import { formatDisplayDate } from '$lib/utils';

	interface Props {
		items: ActivityItem[];
		repos: string[];
	}

	let { items, repos }: Props = $props();

	let filterRepo = $state('all');

	let filteredItems = $derived(
		filterRepo === 'all' ? items : items.filter((i) => i.repo === filterRepo)
	);
</script>

<div class="list-container">
	{#if repos.length > 1}
		<div class="filters">
			<select bind:value={filterRepo}>
				<option value="all">All repos</option>
				{#each repos as repo (repo)}
					<option value={repo}>{repo}</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if filteredItems.length === 0}
		<p class="empty">No activity found.</p>
	{:else}
		<ul class="items">
			{#each filteredItems as item (item.id)}
				<li class="item">
					<div class="item-main">
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external GitHub URL -->
						<a href={item.url} target="_blank" rel="noopener noreferrer" class="item-title">
							{#if item.number}
								<span class="item-number">#{item.number}</span>
							{/if}
							{item.title}
						</a>
						<div class="item-meta">
							<span class="item-repo">{item.repo}</span>
							<span class="item-type">{ACTIVITY_TYPE_LABELS[item.type]}</span>
							<span class="item-date">{formatDisplayDate(item.date)}</span>
							{#if item.state}
								<span class="item-state state-{item.state}">{item.state}</span>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.list-container {
		margin-top: 16px;
	}

	.filters {
		margin-bottom: 12px;
	}

	.filters select {
		padding: 4px 8px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 13px;
	}

	.empty {
		color: var(--color-text-secondary);
		padding: 24px 0;
		text-align: center;
	}

	.items {
		list-style: none;
		padding: 0;
	}

	.item {
		padding: 10px 0;
		border-bottom: 1px solid var(--color-border);
	}

	.item:last-child {
		border-bottom: none;
	}

	.item-title {
		font-size: 14px;
		font-weight: 600;
		display: block;
		margin-bottom: 4px;
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
	}

	.item-repo {
		font-family: var(--font-mono);
	}

	.item-state {
		padding: 0 6px;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 600;
	}

	.state-open {
		background: color-mix(in srgb, var(--color-success) 12%, transparent);
		color: var(--color-success);
	}

	.state-closed {
		background: color-mix(in srgb, var(--color-danger) 12%, transparent);
		color: var(--color-danger);
	}

	.state-merged {
		background: color-mix(in srgb, #8250df 12%, transparent);
		color: #8250df;
	}
</style>
