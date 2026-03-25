<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import { filterFrom, filterTo, setDateRange } from '$lib/stores/date-filter';

	const from = useStore(filterFrom);
	const to = useStore(filterTo);
</script>

<div class="filter-group">
	<span class="filter-label">Date</span>
	<div class="date-filter-inputs">
		<input
			type="date"
			value={from.value ?? ''}
			oninput={(e) => {
				const v = (e.target as HTMLInputElement).value;
				setDateRange(v || null, to.value);
			}}
			aria-label="Filter from date"
		/>
		<span class="date-sep">to</span>
		<input
			type="date"
			value={to.value ?? ''}
			oninput={(e) => {
				const v = (e.target as HTMLInputElement).value;
				setDateRange(from.value, v || null);
			}}
			aria-label="Filter to date"
		/>
	</div>
</div>

<style>
	.filter-group {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.filter-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		min-width: 40px;
		flex-shrink: 0;
	}

	.date-filter-inputs {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.date-filter-inputs input[type='date'] {
		padding: 3px 6px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 12px;
	}

	.date-sep {
		font-size: 12px;
		color: var(--color-text-secondary);
	}
</style>
