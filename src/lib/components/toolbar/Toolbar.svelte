<script lang="ts">
	import SearchBar from './SearchBar.svelte';
	import FilterGroups from './FilterGroups.svelte';
	import FilterStatus from './FilterStatus.svelte';
</script>

<div class="toolbar">
	<SearchBar />
	<FilterGroups />
	<FilterStatus />
</div>

<style>
	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 20px;
	}
</style>
