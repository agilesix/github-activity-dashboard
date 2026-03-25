<script lang="ts">
	import type { ActivityCategory, ActivityItem } from '$lib/types';
	import ActivityItemCard from './ActivityItemCard.svelte';

	interface Props {
		category: ActivityCategory;
		categoryLabel: string;
		items: ActivityItem[];
		collapsed: boolean;
		onToggle: () => void;
	}

	let { category, categoryLabel, items, collapsed, onToggle }: Props = $props();

	function getCategoryIcon(cat: ActivityCategory): string {
		return cat === 'issues' ? '\u25CB' : '\u2387';
	}
</script>

<div class="category-section">
	<button class="category-header" onclick={onToggle} type="button" aria-expanded={!collapsed}>
		<svg
			class="collapse-icon"
			class:collapsed
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M4 6 L8 10 L12 6" />
		</svg>
		<span class="category-icon">{getCategoryIcon(category)}</span>
		{categoryLabel}
		<span class="category-count">{items.length}</span>
	</button>
	{#if !collapsed}
		<ul class="items">
			{#each items as item (item.id)}
				<ActivityItemCard {item} />
			{/each}
		</ul>
	{/if}
</div>

<style>
	.category-section {
		margin-bottom: 20px;
	}

	.category-header {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		padding: 8px 0;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		background: none;
		border-top: none;
		border-left: none;
		border-right: none;
		text-align: left;
	}

	.category-header:hover {
		color: var(--color-text);
	}

	.collapse-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.collapse-icon.collapsed {
		transform: rotate(-90deg);
	}

	.category-icon {
		font-size: 14px;
	}

	.category-count {
		font-size: 11px;
		padding: 1px 6px;
		background: var(--color-bg-secondary);
		border-radius: 10px;
		font-weight: 600;
		margin-left: 2px;
	}

	.items {
		list-style: none;
		padding: 0;
	}
</style>
