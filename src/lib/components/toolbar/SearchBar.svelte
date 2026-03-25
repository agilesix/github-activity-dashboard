<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import { searchQuery } from '$lib/stores/activity-filter-store';

	const query = useStore(searchQuery);
</script>

<div class="search-box">
	<input
		type="search"
		value={query.value}
		oninput={(e) => searchQuery.set((e.target as HTMLInputElement).value)}
		placeholder="Search by title, repo, or #number..."
		aria-label="Search activity items"
	/>
</div>

<style>
	.search-box input {
		width: 100%;
		padding: 7px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 13px;
	}

	.search-box input:focus {
		border-color: var(--color-link);
		outline: 2px solid color-mix(in srgb, var(--color-link) 20%, transparent);
	}
</style>
