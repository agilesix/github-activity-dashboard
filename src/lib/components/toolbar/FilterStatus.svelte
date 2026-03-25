<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import { filteredItems, hasActiveFilters, clearFilters } from '$lib/stores/activity-filter-store';
	import {
		dashboard as dashboardStore,
		selectedTypes as selectedTypesStore
	} from '$lib/stores/dashboard-store';
	import { searchQuery, selectedRepos, selectedLabels } from '$lib/stores/activity-filter-store';
	import { effectiveDateFilter } from '$lib/stores/date-filter';
	import { ACTIVITY_TYPE_LABELS } from '$lib/types';
	import { exportActivityData } from '$lib/utils/export';
	import type { ExportMetadata } from '$lib/utils/export';

	const items = useStore(filteredItems);
	const active = useStore(hasActiveFilters);
	const dashboard = useStore(dashboardStore);

	function handleExport() {
		const dash = dashboard.value;
		if (!dash) return;

		const dateFilter = effectiveDateFilter.get();
		const types = selectedTypesStore.get();

		const meta: ExportMetadata = {
			user: dash.query.user,
			repos: dash.query.repos,
			from: dash.query.from,
			to: dash.query.to,
			types: dash.query.types,
			exportedAt: new Date().toISOString(),
			selectedTypes: types.map((t) => ACTIVITY_TYPE_LABELS[t]),
			filters: {
				searchQuery: searchQuery.get(),
				selectedRepos: selectedRepos.get(),
				selectedLabels: selectedLabels.get(),
				dateFilterFrom: dateFilter?.from ?? null,
				dateFilterTo: dateFilter?.to ?? null
			},
			totalItems: dash.items.length,
			filteredItems: items.value.length
		};

		const prefix = `${dash.query.user}_${dash.query.from}_${dash.query.to}`;
		exportActivityData(items.value, meta, prefix);
	}
</script>

<div class="filter-status">
	{#if active.value}
		<span class="result-count"
			>{items.value.length} result{items.value.length !== 1 ? 's' : ''}</span
		>
		<button class="clear-btn" onclick={clearFilters} type="button">Clear filters</button>
		<span class="status-sep"></span>
	{/if}
	{#if items.value.length > 0}
		<button class="export-btn" onclick={handleExport} type="button">
			<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
				<path
					d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"
				/>
				<path
					d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06Z"
				/>
			</svg>
			Export Excel
		</button>
	{/if}
</div>

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

	.status-sep {
		width: 1px;
		height: 14px;
		background: var(--color-border);
	}

	.export-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		color: var(--color-text-secondary);
		font-size: 12px;
		padding: 3px 8px;
	}

	.export-btn:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text);
		border-color: var(--color-text-secondary);
	}
</style>
