<script lang="ts">
	import type { PageData } from './$types';
	import type { ActivityType } from '$lib/types';
	import { buildHeatmapData, computeSummaryStats, formatRelativeTime } from '$lib/utils';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import ActivityTabs from '$lib/components/ActivityTabs.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import SummaryStats from '$lib/components/SummaryStats.svelte';
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'all' | ActivityType>('all');
	let copyFeedback = $state(false);

	let filteredItems = $derived(
		activeTab === 'all'
			? data.dashboard.items
			: data.dashboard.items.filter((i) => i.type === activeTab)
	);

	let heatmapEntries = $derived(
		buildHeatmapData(filteredItems, data.dashboard.query.from, data.dashboard.query.to)
	);

	let stats = $derived(computeSummaryStats(data.dashboard.items));

	function handleRefresh() {
		const url = new URL($page.url);
		url.searchParams.set('refresh', 'true');
		goto(resolveRoute('/results') + '?' + url.searchParams.toString(), { invalidateAll: true });
	}

	async function handleCopyLink() {
		const url = new URL($page.url);
		url.searchParams.delete('refresh');
		await navigator.clipboard.writeText(url.toString());
		copyFeedback = true;
		setTimeout(() => (copyFeedback = false), 2000);
	}
</script>

<main class="results-page">
	<header class="results-header">
		<div class="header-top">
			<div>
				<h1>{data.dashboard.query.user}</h1>
				<p class="subtitle">
					Activity across {data.dashboard.query.repos.length} repo{data.dashboard.query.repos
						.length > 1
						? 's'
						: ''}
					&middot;
					{data.dashboard.query.from} to {data.dashboard.query.to}
				</p>
			</div>
			<div class="header-actions">
				<button class="btn btn-secondary" onclick={handleRefresh}>Refresh</button>
				<button class="btn btn-secondary" onclick={handleCopyLink}>
					{copyFeedback ? 'Copied!' : 'Copy Link'}
				</button>
				<a href={resolveRoute('/')} class="btn btn-secondary">New Query</a>
			</div>
		</div>

		<div class="fetch-info">
			{#if data.fromCache}
				Cached data from {formatRelativeTime(data.dashboard.fetchedAt)}
			{:else}
				Fetched {formatRelativeTime(data.dashboard.fetchedAt)}
			{/if}
			{#if data.rateLimitInfo}
				&middot; API: {data.rateLimitInfo.remaining}/{data.rateLimitInfo.limit} remaining
			{/if}
		</div>

		{#if data.errors && data.errors.length > 0}
			<div class="warnings">
				{#each data.errors as error, i (i)}
					<p class="warning">{error.message}</p>
				{/each}
			</div>
		{/if}
	</header>

	<SummaryStats {stats} />

	<section class="activity-section">
		<ActivityTabs
			{activeTab}
			countsByType={stats.countsByType}
			totalCount={stats.totalItems}
			onchange={(tab) => (activeTab = tab)}
		/>

		<ActivityHeatmap entries={heatmapEntries} />

		<ActivityList items={filteredItems} repos={data.dashboard.query.repos} />
	</section>
</main>

<style>
	.results-page {
		max-width: 960px;
		margin: 0 auto;
		padding: 24px 20px;
	}

	.results-header {
		margin-bottom: 24px;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
		flex-wrap: wrap;
	}

	h1 {
		font-size: 22px;
	}

	.subtitle {
		font-size: 13px;
		color: var(--color-text-secondary);
		margin-top: 2px;
	}

	.header-actions {
		display: flex;
		gap: 8px;
	}

	.btn {
		padding: 5px 12px;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
		display: inline-block;
	}

	.btn-secondary {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background: var(--color-border);
	}

	.fetch-info {
		font-size: 12px;
		color: var(--color-text-secondary);
		margin-top: 8px;
	}

	.warnings {
		margin-top: 8px;
		padding: 8px 12px;
		background: color-mix(in srgb, var(--color-warning) 8%, transparent);
		border: 1px solid var(--color-warning);
		border-radius: var(--radius-md);
	}

	.warning {
		font-size: 13px;
		color: var(--color-warning);
		margin: 2px 0;
	}

	.activity-section {
		margin-top: 24px;
	}
</style>
