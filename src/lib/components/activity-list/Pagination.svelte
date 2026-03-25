<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import { currentPage, totalPages, setPage } from '$lib/stores/activity-filter-store';

	const page = useStore(currentPage);
	const total = useStore(totalPages);
</script>

{#if total.value > 1}
	<nav class="pagination" aria-label="Activity list pagination">
		<button
			class="page-btn"
			disabled={page.value <= 1}
			onclick={() => setPage(page.value - 1)}
			type="button"
		>
			Previous
		</button>
		<span class="page-info">
			Page {page.value} of {total.value}
		</span>
		<button
			class="page-btn"
			disabled={page.value >= total.value}
			onclick={() => setPage(page.value + 1)}
			type="button"
		>
			Next
		</button>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		padding: 16px 0;
		border-top: 1px solid var(--color-border);
	}

	.page-btn {
		padding: 5px 12px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 13px;
		color: var(--color-text);
	}

	.page-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.page-btn:not(:disabled):hover {
		background: var(--color-border);
	}

	.page-info {
		font-size: 13px;
		color: var(--color-text-secondary);
	}
</style>
