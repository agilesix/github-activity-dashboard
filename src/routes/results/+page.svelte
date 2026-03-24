<script lang="ts">
	import type { PageData } from './$types';
	import type { ActivityType } from '$lib/types';
	import { ACTIVITY_TYPE_LABELS } from '$lib/types';
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
	let menuOpen = $state(false);
	let headerRef = $state<HTMLElement | null>(null);
	let stickyVisible = $state(false);

	let filteredItems = $derived(
		activeTab === 'all'
			? data.dashboard.items
			: data.dashboard.items.filter((i) => i.type === activeTab)
	);

	let heatmapEntries = $derived(
		buildHeatmapData(filteredItems, data.dashboard.query.from, data.dashboard.query.to)
	);

	let stats = $derived(computeSummaryStats(data.dashboard.items));

	let activeTabLabel = $derived(
		activeTab === 'all' ? 'All Activity' : ACTIVITY_TYPE_LABELS[activeTab]
	);

	function handleRefresh() {
		menuOpen = false;
		const url = new URL($page.url);
		url.searchParams.set('refresh', 'true');
		goto(resolveRoute('/results') + '?' + url.searchParams.toString(), { invalidateAll: true });
	}

	async function handleCopyLink() {
		menuOpen = false;
		const url = new URL($page.url);
		url.searchParams.delete('refresh');
		await navigator.clipboard.writeText(url.toString());
		copyFeedback = true;
		setTimeout(() => (copyFeedback = false), 2000);
	}

	function handleNewQuery() {
		menuOpen = false;
	}

	// Observe when the main header scrolls out of view
	$effect(() => {
		if (!headerRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				stickyVisible = !entry.isIntersecting;
			},
			{ threshold: 0 }
		);
		observer.observe(headerRef);
		return () => observer.disconnect();
	});
</script>

<svelte:window onclick={() => (menuOpen = false)} />

<div class="sticky-header" class:visible={stickyVisible}>
	<div class="sticky-inner">
		<div class="sticky-summary">
			<div class="sticky-user">{data.dashboard.query.user}</div>
			<div class="sticky-detail">
				{data.dashboard.query.repos.length} repo{data.dashboard.query.repos.length > 1 ? 's' : ''}
				&middot;
				{data.dashboard.query.from} &ndash; {data.dashboard.query.to}
			</div>
			<div class="sticky-tab">{activeTabLabel}</div>
		</div>
		<div class="sticky-actions-desktop">
			<button class="btn btn-secondary btn-sm" onclick={handleRefresh}>Refresh</button>
			<button class="btn btn-secondary btn-sm" onclick={handleCopyLink}>
				{copyFeedback ? 'Copied!' : 'Copy Link'}
			</button>
			<a href={resolveRoute('/')} class="btn btn-secondary btn-sm">New Query</a>
		</div>
		<div class="menu-container">
			<button
				class="menu-trigger"
				type="button"
				aria-label="Actions menu"
				aria-expanded={menuOpen}
				onclick={(e) => {
					e.stopPropagation();
					menuOpen = !menuOpen;
				}}
			>
				&#8942;
			</button>
			{#if menuOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<div class="menu-dropdown" onclick={(e) => e.stopPropagation()}>
					<button class="menu-item" type="button" onclick={handleRefresh}>Refresh data</button>
					<button class="menu-item" type="button" onclick={handleCopyLink}>
						{copyFeedback ? 'Copied!' : 'Copy link'}
					</button>
					<a href={resolveRoute('/')} class="menu-item" onclick={handleNewQuery}> New query </a>
				</div>
			{/if}
		</div>
	</div>
</div>

<main class="results-page">
	<header class="results-header" bind:this={headerRef}>
		<div class="header-top">
			<div>
				<h1>{data.dashboard.query.user}</h1>
				<p class="subtitle">
					{data.dashboard.query.repos.length} repo{data.dashboard.query.repos.length > 1 ? 's' : ''}
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
	/* Sticky header — hidden until main header scrolls out */
	.sticky-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		transform: translateY(-100%);
		opacity: 0;
		transition:
			transform 0.2s ease,
			opacity 0.2s ease;
		pointer-events: none;
	}

	.sticky-header.visible {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.sticky-inner {
		max-width: 960px;
		margin: 0 auto;
		padding: 10px 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.sticky-summary {
		min-width: 0;
	}

	.sticky-user {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		line-height: 1.3;
	}

	.sticky-detail {
		font-size: 13px;
		color: var(--color-text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sticky-tab {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-link);
	}

	/* Desktop action buttons in sticky header */
	.sticky-actions-desktop {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.btn-sm {
		padding: 4px 10px;
		font-size: 12px;
	}

	/* Overflow menu — mobile only */
	.menu-container {
		position: relative;
		flex-shrink: 0;
		display: none;
	}

	@media (max-width: 640px) {
		.sticky-actions-desktop {
			display: none;
		}

		.menu-container {
			display: block;
		}
	}

	.menu-trigger {
		background: none;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-size: 20px;
		line-height: 1;
		padding: 2px 8px;
		color: var(--color-text-secondary);
	}

	.menu-trigger:hover {
		background: var(--color-bg-secondary);
		border-color: var(--color-border);
		color: var(--color-text);
	}

	.menu-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 4px;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		min-width: 140px;
		padding: 4px 0;
		z-index: 30;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 6px 12px;
		background: none;
		border: none;
		text-align: left;
		font-size: 13px;
		color: var(--color-text);
		text-decoration: none;
	}

	.menu-item:hover {
		background: var(--color-bg-secondary);
	}

	/* Main page */
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
