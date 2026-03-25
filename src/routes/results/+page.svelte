<script lang="ts">
	import {
		buildHeatmapData,
		computeSummaryStats,
		encodeQueryParams,
		formatRelativeTime,
		parseQueryParams
	} from '$lib/utils';
	import { useStore } from '$lib/stores/use-store.svelte';
	import { ACTIVITY_TYPE_LABELS } from '$lib/types';
	import {
		dashboard as dashboardStore,
		loading as loadingStore,
		loadError as loadErrorStore,
		fromCache as fromCacheStore,
		errors as errorsStore,
		rateLimitInfo as rateLimitInfoStore,
		selectedTypes as selectedTypesStore,
		fetchDashboard,
		resetDashboard
	} from '$lib/stores/dashboard-store';
	import {
		menuOpen as menuOpenStore,
		copyFeedback as copyFeedbackStore,
		stickyVisible as stickyVisibleStore,
		closeMenu,
		toggleMenu,
		showCopyFeedback,
		setStickyVisible
	} from '$lib/stores/ui-store';
	import { typeFilteredItems as typeFilteredItemsStore } from '$lib/stores/activity-filter-store';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import ActivityTabs from '$lib/components/ActivityTabs.svelte';
	import ActivityBarChart from '$lib/components/ActivityBarChart.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import SummaryStats from '$lib/components/SummaryStats.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	// Subscribe to stores
	const dashboard = useStore(dashboardStore);
	const loading = useStore(loadingStore);
	const loadError = useStore(loadErrorStore);
	const fromCache = useStore(fromCacheStore);
	const errors = useStore(errorsStore);
	const rateLimitInfo = useStore(rateLimitInfoStore);
	const menuOpen = useStore(menuOpenStore);
	const copyFeedback = useStore(copyFeedbackStore);
	const stickyVisible = useStore(stickyVisibleStore);
	const typeFilteredItems = useStore(typeFilteredItemsStore);
	const selectedTypesVal = useStore(selectedTypesStore);

	let headerRef = $state<HTMLElement | null>(null);

	let activeTypesLabel = $derived(
		selectedTypesVal.value.length === 0
			? 'All Activity'
			: selectedTypesVal.value.map((t) => ACTIVITY_TYPE_LABELS[t]).join(', ')
	);

	// Parse query from URL
	let queryParams = $derived(parseQueryParams(page.url.searchParams));

	// Fetch data on mount and when URL changes
	$effect(() => {
		const params = queryParams;
		if (!params) {
			loadErrorStore.set('Missing or invalid query parameters.');
			loadingStore.set(false);
			return;
		}

		const refresh = page.url.searchParams.get('refresh') === 'true';
		resetDashboard();

		fetchDashboard(params, { refresh }).then(({ refreshed }) => {
			if (refreshed) {
				const cleanUrl = new URL(page.url);
				cleanUrl.searchParams.delete('refresh');
				goto(cleanUrl.pathname + '?' + cleanUrl.searchParams.toString(), {
					replaceState: true,
					keepFocus: true
				});
			}
		});
	});

	// Derived from stores — heatmap and stats use type-filtered items
	let heatmapEntries = $derived(
		dashboard.value
			? buildHeatmapData(
					typeFilteredItems.value,
					dashboard.value.query.from,
					dashboard.value.query.to
				)
			: []
	);

	let stats = $derived(dashboard.value ? computeSummaryStats(dashboard.value.items) : null);

	let newQueryUrl = $derived.by(() => {
		if (!dashboard.value) return resolve('/');
		const qs = encodeQueryParams(dashboard.value.query);
		return `${resolve('/')}?${qs}`;
	});

	function handleRefresh() {
		closeMenu();
		const url = new URL(page.url);
		url.searchParams.set('refresh', 'true');
		goto(resolve('/results') + '?' + url.searchParams.toString());
	}

	async function handleCopyLink() {
		closeMenu();
		const url = new URL(page.url);
		url.searchParams.delete('refresh');
		await navigator.clipboard.writeText(url.toString());
		showCopyFeedback();
	}

	function handleNewQuery() {
		closeMenu();
	}

	// Observe when the main header scrolls out of view
	$effect(() => {
		if (!headerRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				setStickyVisible(!entry.isIntersecting);
			},
			{ threshold: 0 }
		);
		observer.observe(headerRef);
		return () => observer.disconnect();
	});
</script>

<svelte:window onclick={() => closeMenu()} />

{#if loading.value}
	<main class="loading-page">
		<div class="loading-content">
			<div class="spinner"></div>
			<h2>Fetching activity data...</h2>
			{#if queryParams}
				<p class="loading-detail">
					{queryParams.user} &middot; {queryParams.repos.length} repo{queryParams.repos.length > 1
						? 's'
						: ''}
					&middot; {queryParams.from} to {queryParams.to}
				</p>
			{/if}
			<p class="loading-hint">
				This may take a moment depending on the number of repos and activity.
			</p>
		</div>
	</main>
{:else if loadError.value}
	<main class="error-page">
		<h1>Something went wrong</h1>
		<p>{loadError.value}</p>
		<a href={newQueryUrl}>Back to search</a>
	</main>
{:else if dashboard.value && stats}
	<div class="sticky-header" class:visible={stickyVisible.value}>
		<div class="sticky-inner">
			<div class="sticky-summary">
				<div class="sticky-user">{dashboard.value.query.user}</div>
				<div class="sticky-detail">
					{dashboard.value.query.repos.length} repo{dashboard.value.query.repos.length > 1
						? 's'
						: ''}
					&middot;
					{dashboard.value.query.from} &ndash; {dashboard.value.query.to}
				</div>
				<div class="sticky-types">{activeTypesLabel}</div>
			</div>
			<div class="sticky-actions-desktop">
				<button class="btn btn-secondary btn-sm" onclick={handleRefresh}>Refresh</button>
				<button class="btn btn-secondary btn-sm" onclick={handleCopyLink}>
					{copyFeedback.value ? 'Copied!' : 'Copy Link'}
				</button>
				<a href={newQueryUrl} class="btn btn-secondary btn-sm">New Query</a>
			</div>
			<div class="menu-container">
				<button
					id="sticky-actions-menu-trigger"
					class="menu-trigger"
					type="button"
					aria-label="Actions menu"
					aria-haspopup="menu"
					aria-expanded={menuOpen.value}
					aria-controls="sticky-actions-menu"
					onclick={(e) => {
						e.stopPropagation();
						toggleMenu();
					}}
				>
					&#8942;
				</button>
				{#if menuOpen.value}
					<div
						id="sticky-actions-menu"
						class="menu-dropdown"
						role="menu"
						aria-labelledby="sticky-actions-menu-trigger"
					>
						<button class="menu-item" type="button" role="menuitem" onclick={handleRefresh}>
							Refresh data
						</button>
						<button class="menu-item" type="button" role="menuitem" onclick={handleCopyLink}>
							{copyFeedback.value ? 'Copied!' : 'Copy link'}
						</button>
						<a href={newQueryUrl} class="menu-item" role="menuitem" onclick={handleNewQuery}>
							New query
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<main class="results-page">
		<header class="results-header" bind:this={headerRef}>
			<div class="header-top">
				<div>
					<h1>{dashboard.value.query.user}</h1>
					<p class="subtitle">
						{dashboard.value.query.repos.length} repo{dashboard.value.query.repos.length > 1
							? 's'
							: ''}
						&middot;
						{dashboard.value.query.from} to {dashboard.value.query.to}
					</p>
				</div>
				<div class="header-actions">
					<button class="btn btn-secondary" onclick={handleRefresh}>Refresh</button>
					<button class="btn btn-secondary" onclick={handleCopyLink}>
						{copyFeedback.value ? 'Copied!' : 'Copy Link'}
					</button>
					<a href={newQueryUrl} class="btn btn-secondary">New Query</a>
				</div>
			</div>

			<div class="fetch-info">
				{#if fromCache.value}
					Cached data from {formatRelativeTime(dashboard.value.fetchedAt)}
				{:else}
					Fetched {formatRelativeTime(dashboard.value.fetchedAt)}
				{/if}
				{#if rateLimitInfo.value}
					&middot; API: {rateLimitInfo.value.remaining}/{rateLimitInfo.value.limit} remaining
				{/if}
			</div>

			{#if errors.value.length > 0}
				<div class="warnings">
					{#each errors.value as error, i (i)}
						<p class="warning">{error.message}</p>
					{/each}
				</div>
			{/if}
		</header>

		<SummaryStats {stats} />

		<section class="activity-section">
			<ActivityTabs countsByType={stats.countsByType} totalCount={stats.totalItems} />

			<ActivityHeatmap entries={heatmapEntries} />

			<ActivityBarChart
				items={typeFilteredItems.value}
				allItems={dashboard.value.items}
				repos={dashboard.value.query.repos}
			/>

			<ActivityList />
		</section>
	</main>
{/if}

<style>
	/* Loading page */
	.loading-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 20px;
	}

	.loading-content {
		text-align: center;
		max-width: 400px;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-link);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 16px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-content h2 {
		font-size: 18px;
		margin-bottom: 8px;
	}

	.loading-detail {
		font-size: 14px;
		color: var(--color-text-secondary);
		margin-bottom: 8px;
	}

	.loading-hint {
		font-size: 12px;
		color: var(--color-text-secondary);
	}

	/* Error page */
	.error-page {
		max-width: 480px;
		margin: 0 auto;
		padding: 80px 20px;
		text-align: center;
	}

	.error-page h1 {
		font-size: 22px;
		margin-bottom: 8px;
	}

	.error-page p {
		color: var(--color-text-secondary);
		margin-bottom: 24px;
	}

	/* Sticky header */
	.sticky-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
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

	.sticky-types {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-link);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	@media (max-width: 640px) {
		.results-page {
			padding: 16px 16px;
		}

		h1 {
			font-size: 18px;
		}

		.results-header {
			margin-bottom: 16px;
		}

		.header-actions {
			display: none;
		}
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
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
</style>
