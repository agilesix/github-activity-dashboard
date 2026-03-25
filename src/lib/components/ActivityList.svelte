<script lang="ts">
	import { useStore } from '$lib/stores/use-store.svelte';
	import {
		filteredItems,
		groupedSections,
		collapsedSections,
		toggleSection
	} from '$lib/stores/activity-filter-store';
	import Toolbar from './toolbar/Toolbar.svelte';
	import CategorySection from './activity-list/CategorySection.svelte';
	import Pagination from './activity-list/Pagination.svelte';

	const items = useStore(filteredItems);
	const sections = useStore(groupedSections);
	const collapsed = useStore(collapsedSections);
</script>

<div class="list-container">
	<Toolbar />

	{#if items.value.length === 0}
		<p class="empty">No activity matches your filters.</p>
	{:else}
		{#each sections.value as section (section.category)}
			<CategorySection
				category={section.category}
				categoryLabel={section.categoryLabel}
				items={section.items}
				collapsed={!!collapsed.value[section.category]}
				onToggle={() => toggleSection(section.category)}
			/>
		{/each}

		<Pagination />
	{/if}
</div>

<style>
	.list-container {
		margin-top: 12px;
	}

	.empty {
		color: var(--color-text-secondary);
		padding: 24px 0;
		text-align: center;
	}
</style>
