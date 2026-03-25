<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import { filteredItems, hasActiveFilters, clearFilters } from '$lib/stores/activity-filter-store';

	const items = useStore(filteredItems);
	const active = useStore(hasActiveFilters);
</script>

{#if active.value}
	<div class="filter-status">
		<span class="result-count"
			>{items.value.length} result{items.value.length !== 1 ? 's' : ''}</span
		>
		<button class="clear-btn" onclick={clearFilters} type="button">Clear filters</button>
	</div>
{/if}

<style>
	.filter-status {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
	}

	.result-count {
		color: var(--color-text-secondary);
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--color-link);
		font-size: 12px;
		padding: 0;
		text-decoration: underline;
	}
</style>
