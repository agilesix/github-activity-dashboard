<script lang="ts">
	import type { ActivityType, DashboardData, FetchError, GitHubRateLimitInfo } from '$lib/types';
	import { ACTIVITY_TYPE_LABELS } from '$lib/types';
	import {
		buildHeatmapData,
		computeSummaryStats,
		encodeQueryParams,
		formatRelativeTime,
		parseQueryParams
	} from '$lib/utils';
	import ActivityHeatmap from '$lib/components/ActivityHeatmap.svelte';
	import ActivityTabs from '$lib/components/ActivityTabs.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import SummaryStats from '$lib/components/SummaryStats.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	// State
	let dashboard = $state<DashboardData | null>(null);
	let fromCache = $state(false);
	let errors = $state<FetchError[]>([]);
	let rateLimitInfo = $state<GitHubRateLimitInfo | undefined>(undefined);
	let loading = $state(true);
	let loadError = $state<string | null>(null);

	let activeTab = $state<'all' | ActivityType>('all');
	let copyFeedback = $state(false);
	let menuOpen = $state(false);
	let headerRef = $state<HTMLElement | null>(null);
	let stickyVisible = $state(false);

	// Parse query from URL
	let queryParams = $derived(parseQueryParams(page.url.searchParams));

	// Fetch data on mount and when URL changes
	$effect(() => {
		const params = queryParams;
		if (!params) {
			loadError = 'Missing or invalid query parameters.';
			loading = false;
			return;
		}

		loading = true;
		loadError = null;
		activeTab = 'all';

		const queryString = encodeQueryParams(params);
		const refresh = page.url.searchParams.get('refresh') === 'true';
		let url = `/api/activity?${queryString}`;
		if (refresh) url += '&refresh=true';

		const headers: Record<string, string> = {};
		const pat = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('github_pat') : null;
		if (pat) headers['x-github-pat'] = pat;

		fetch(url, { headers })
			.then(
				(res) =>
					res.json() as Promise<{
						dashboard?: DashboardData;
						fromCache?: boolean;
						errors?: FetchError[];
						rateLimitInfo?: GitHubRateLimitInfo;
						error?: string;
					}>
			)
			.then((data) => {
				if (data.error) {
					loadError = data.error;
				} else if (data.dashboard) {
					dashboard = data.dashboard;
					fromCache = data.fromCache ?? false;
					errors = data.errors ?? [];
					rateLimitInfo = data.rateLimitInfo;
				}
				loading = false;
			})
			.catch((err) => {
				loadError = err?.message || 'Failed to fetch activity data.';
				loading = false;
			});
	});

	let filteredItems = $derived(
		!dashboard
			? []
			: activeTab === 'all'
				? dashboard.items
				: dashboard.items.filter((i) => i.type === activeTab)
	);

	let heatmapEntries = $derived(
		dashboard ? buildHeatmapData(filteredItems, dashboard.query.from, dashboard.query.to) : []
	);

	let stats = $derived(dashboard ? computeSummaryStats(dashboard.items) : null);

	let activeTabLabel = $derived(
		activeTab === 'all' ? 'All Activity' : ACTIVITY_TYPE_LABELS[activeTab]
	);

	function handleRefresh() {
		menuOpen = false;
		const url = new URL(page.url);
		url.searchParams.set('refresh', 'true');
		goto(resolve('/results') + '?' + url.searchParams.toString());
	}

	async function handleCopyLink() {
		menuOpen = false;
		const url = new URL(page.url);
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

{#if loading}
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
{:else if loadError}
	<main class="error-page">
		<h1>Something went wrong</h1>
		<p>{loadError}</p>
		<a href={resolve('/')}>Back to search</a>
	</main>
{:else if dashboard && stats}
	<div class="sticky-header" class:visible={stickyVisible}>
		<div class="sticky-inner">
			<div class="sticky-summary">
				<div class="sticky-user">{dashboard.query.user}</div>
				<div class="sticky-detail">
					{dashboard.query.repos.length} repo{dashboard.query.repos.length > 1 ? 's' : ''}
					&middot;
					{dashboard.query.from} &ndash; {dashboard.query.to}
				</div>
				<div class="sticky-tab">{activeTabLabel}</div>
			</div>
			<div class="sticky-actions-desktop">
				<button class="btn btn-secondary btn-sm" onclick={handleRefresh}>Refresh</button>
				<button class="btn btn-secondary btn-sm" onclick={handleCopyLink}>
					{copyFeedback ? 'Copied!' : 'Copy Link'}
				</button>
				<a href={resolve('/')} class="btn btn-secondary btn-sm">New Query</a>
			</div>
			<div class="menu-container">
				<button
					id="sticky-actions-menu-trigger"
					class="menu-trigger"
					type="button"
					aria-label="Actions menu"
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					aria-controls="sticky-actions-menu"
					onclick={(e) => {
						e.stopPropagation();
						menuOpen = !menuOpen;
					}}
				>
					&#8942;
				</button>
				{#if menuOpen}
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
							{copyFeedback ? 'Copied!' : 'Copy link'}
						</button>
						<a href={resolve('/')} class="menu-item" role="menuitem" onclick={handleNewQuery}>
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
					<h1>{dashboard.query.user}</h1>
					<p class="subtitle">
						{dashboard.query.repos.length} repo{dashboard.query.repos.length > 1 ? 's' : ''}
						&middot;
						{dashboard.query.from} to {dashboard.query.to}
					</p>
				</div>
				<div class="header-actions">
					<button class="btn btn-secondary" onclick={handleRefresh}>Refresh</button>
					<button class="btn btn-secondary" onclick={handleCopyLink}>
						{copyFeedback ? 'Copied!' : 'Copy Link'}
					</button>
					<a href={resolve('/')} class="btn btn-secondary">New Query</a>
				</div>
			</div>

			<div class="fetch-info">
				{#if fromCache}
					Cached data from {formatRelativeTime(dashboard.fetchedAt)}
				{:else}
					Fetched {formatRelativeTime(dashboard.fetchedAt)}
				{/if}
				{#if rateLimitInfo}
					&middot; API: {rateLimitInfo.remaining}/{rateLimitInfo.limit} remaining
				{/if}
			</div>

			{#if errors.length > 0}
				<div class="warnings">
					{#each errors as error, i (i)}
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

			<ActivityList items={filteredItems} repos={dashboard.query.repos} />
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
