<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import { dashboard } from '$lib/stores/dashboard-store';
	import {
		selectedRepos,
		selectedLabels,
		allLabels,
		toggleRepo,
		toggleLabel
	} from '$lib/stores/activity-filter-store';
	import ChipFilterGroup from './ChipFilterGroup.svelte';
	import DateRangeFilter from './DateRangeFilter.svelte';

	const dash = useStore(dashboard);
	const repos = useStore(selectedRepos);
	const labels = useStore(selectedLabels);
	const labelsAll = useStore(allLabels);

	let repoOptions = $derived(dash.value?.query.repos ?? []);
</script>

<div class="filter-groups">
	{#if repoOptions.length > 1}
		<ChipFilterGroup
			label="Repo"
			options={repoOptions}
			selected={repos.value}
			onToggle={toggleRepo}
			formatOption={(r) => r.split('/')[1]}
		/>
	{/if}

	{#if labelsAll.value.length > 0}
		<ChipFilterGroup
			label="Label"
			options={labelsAll.value.slice(0, 12)}
			selected={labels.value}
			onToggle={toggleLabel}
		/>
	{/if}

	<DateRangeFilter />
</div>

<style>
	.filter-groups {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
