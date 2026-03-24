<script lang="ts">
	import type { ActivityItem, ActivityCategory } from '$lib/types';
	import {
		ACTIVITY_TYPE_CATEGORY,
		ACTIVITY_CATEGORY_LABELS,
		ACTIVITY_TYPE_SHORT_LABELS,
		isTypeLabel
	} from '$lib/types';
	import { formatDisplayDate } from '$lib/utils';
	import StateIcon from './StateIcon.svelte';

	function getTypeLabels(labels: string[] | undefined): string[] {
		return (labels ?? []).filter((l) => isTypeLabel(l));
	}

	function getNonTypeLabels(labels: string[] | undefined): string[] {
		return (labels ?? []).filter((l) => !isTypeLabel(l));
	}

	interface Props {
		items: ActivityItem[];
		repos: string[];
	}

	let { items, repos }: Props = $props();

	const PAGE_SIZE = 100;

	// Filter state
	let searchQuery = $state('');
	let selectedRepos = $state<string[]>([]);
	let selectedLabels = $state<string[]>([]);
	let currentPage = $state(1);

	// Collect all unique labels from items
	let allLabels = $derived(
		[...new Set(items.flatMap((i) => i.labels ?? []))].filter(Boolean).sort()
	);

	// Filtered items
	let filteredItems = $derived.by(() => {
		let result = items;

		if (selectedRepos.length > 0) {
			result = result.filter((i) => selectedRepos.includes(i.repo));
		}

		if (selectedLabels.length > 0) {
			result = result.filter((i) => i.labels?.some((l) => selectedLabels.includes(l)));
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(i) =>
					i.title.toLowerCase().includes(q) ||
					i.repo.toLowerCase().includes(q) ||
					(i.number && `#${i.number}`.includes(q))
			);
		}

		return result;
	});

	// Pagination
	let totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)));
	let pagedItems = $derived(
		filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	// Group paged items by category for display
	interface GroupedSection {
		category: ActivityCategory;
		categoryLabel: string;
		items: ActivityItem[];
	}

	let groupedSections = $derived.by(() => {
		const groups: Record<string, ActivityItem[]> = {};
		for (const item of pagedItems) {
			const cat = ACTIVITY_TYPE_CATEGORY[item.type];
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(item);
		}

		const sections: GroupedSection[] = [];
		const order: ActivityCategory[] = ['issues', 'pull_requests'];
		for (const cat of order) {
			const catItems = groups[cat];
			if (catItems && catItems.length > 0) {
				sections.push({
					category: cat,
					categoryLabel: ACTIVITY_CATEGORY_LABELS[cat],
					items: catItems
				});
			}
		}
		return sections;
	});

	// Reset page and collapsed state when filters or items change
	$effect(() => {
		void searchQuery;
		void selectedRepos;
		void selectedLabels;
		void items;
		currentPage = 1;
		collapsedSections = {};
	});

	// Multi-select toggle helpers
	function toggleRepo(repo: string) {
		selectedRepos = selectedRepos.includes(repo)
			? selectedRepos.filter((r) => r !== repo)
			: [...selectedRepos, repo];
	}

	function toggleLabel(label: string) {
		selectedLabels = selectedLabels.includes(label)
			? selectedLabels.filter((l) => l !== label)
			: [...selectedLabels, label];
	}

	function clearFilters() {
		searchQuery = '';
		selectedRepos = [];
		selectedLabels = [];
	}

	let hasActiveFilters = $derived(
		searchQuery.trim() !== '' || selectedRepos.length > 0 || selectedLabels.length > 0
	);

	// Section collapse state
	let collapsedSections: Record<string, boolean> = $state({});

	function toggleSection(cat: ActivityCategory) {
		collapsedSections = { ...collapsedSections, [cat]: !collapsedSections[cat] };
	}

	function getCategoryIcon(cat: ActivityCategory): string {
		return cat === 'issues' ? '\u25CB' : '\u2387';
	}

	function getActivityTypeColor(type: string): string {
		switch (type) {
			case 'issues_opened':
				return 'var(--color-success)';
			case 'issues_closed':
				return '#8250df';
			case 'issue_comments':
				return 'var(--color-text-secondary)';
			case 'prs_opened':
				return 'var(--color-success)';
			case 'pr_reviews':
				return 'var(--color-link)';
			case 'prs_merged':
				return '#8250df';
			default:
				return 'var(--color-text-secondary)';
		}
	}
</script>

<div class="list-container">
	<!-- Search + filters bar -->
	<div class="toolbar">
		<div class="search-box">
			<input
				type="search"
				bind:value={searchQuery}
				placeholder="Search by title, repo, or #number..."
				aria-label="Search activity items"
			/>
		</div>

		<div class="filter-groups">
			{#if repos.length > 1}
				<div class="filter-group">
					<span class="filter-label">Repo</span>
					<div class="filter-chips">
						{#each repos as repo (repo)}
							<button
								class="chip"
								class:active={selectedRepos.includes(repo)}
								onclick={() => toggleRepo(repo)}
								type="button"
							>
								{repo.split('/')[1]}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if allLabels.length > 0}
				<div class="filter-group">
					<span class="filter-label">Label</span>
					<div class="filter-chips">
						{#each allLabels.slice(0, 12) as label (label)}
							<button
								class="chip"
								class:active={selectedLabels.includes(label)}
								onclick={() => toggleLabel(label)}
								type="button"
							>
								{label}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#if hasActiveFilters}
			<div class="filter-status">
				<span class="result-count"
					>{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</span
				>
				<button class="clear-btn" onclick={clearFilters} type="button">Clear filters</button>
			</div>
		{/if}
	</div>

	<!-- Results -->
	{#if filteredItems.length === 0}
		<p class="empty">No activity matches your filters.</p>
	{:else}
		{#each groupedSections as section (section.category)}
			<div class="category-section">
				<button
					class="category-header"
					onclick={() => toggleSection(section.category)}
					type="button"
					aria-expanded={!collapsedSections[section.category]}
				>
					<svg
						class="collapse-icon"
						class:collapsed={collapsedSections[section.category]}
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M4 6 L8 10 L12 6" />
					</svg>
					<span class="category-icon">{getCategoryIcon(section.category)}</span>
					{section.categoryLabel}
					<span class="category-count">{section.items.length}</span>
				</button>
				{#if !collapsedSections[section.category]}
					<ul class="items">
						{#each section.items as item (item.id)}
							{@const typeLabels = getTypeLabels(item.labels)}
							{@const otherLabels = getNonTypeLabels(item.labels)}
							<li class="item">
								<span class="activity-type-label" style="color: {getActivityTypeColor(item.type)}">
									{ACTIVITY_TYPE_SHORT_LABELS[item.type]}
								</span>
								<div class="item-content">
									<div class="item-title-row">
										<StateIcon
											state={item.state || 'open'}
											category={ACTIVITY_TYPE_CATEGORY[item.type]}
										/>
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external GitHub URL -->
										<a href={item.url} target="_blank" rel="noopener noreferrer" class="item-title">
											{#if item.number}
												<span class="item-number">#{item.number}</span>
											{/if}
											{item.title}
										</a>
									</div>
									<div class="item-meta">
										<span class="item-repo">{item.repo}</span>
										{#if typeLabels.length > 0}
											{#each typeLabels as tl (tl)}
												<span class="type-badge">{tl}</span>
											{/each}
										{/if}
										<span class="item-date">{formatDisplayDate(item.date)}</span>
									</div>
									{#if otherLabels.length > 0}
										<div class="item-labels">
											{#each otherLabels as label (label)}
												<span class="label-badge">{label}</span>
											{/each}
										</div>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}

		<!-- Pagination -->
		{#if totalPages > 1}
			<nav class="pagination" aria-label="Activity list pagination">
				<button
					class="page-btn"
					disabled={currentPage <= 1}
					onclick={() => (currentPage = currentPage - 1)}
					type="button"
				>
					Previous
				</button>
				<span class="page-info">
					Page {currentPage} of {totalPages}
				</span>
				<button
					class="page-btn"
					disabled={currentPage >= totalPages}
					onclick={() => (currentPage = currentPage + 1)}
					type="button"
				>
					Next
				</button>
			</nav>
		{/if}
	{/if}
</div>

<style>
	.list-container {
		margin-top: 12px;
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 20px;
	}

	.search-box input {
		width: 100%;
		padding: 7px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 13px;
	}

	.search-box input:focus {
		border-color: var(--color-link);
		outline: 2px solid color-mix(in srgb, var(--color-link) 20%, transparent);
	}

	.filter-groups {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

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

	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.chip {
		padding: 2px 8px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		font-size: 12px;
		color: var(--color-text-secondary);
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.chip:hover {
		background: var(--color-border);
		color: var(--color-text);
	}

	.chip.active {
		background: color-mix(in srgb, var(--color-link) 10%, transparent);
		border-color: var(--color-link);
		color: var(--color-link);
		font-weight: 600;
	}

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

	/* Category sections */
	.category-section {
		margin-bottom: 20px;
	}

	.category-header {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		padding: 8px 0;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		background: none;
		border-top: none;
		border-left: none;
		border-right: none;
		text-align: left;
	}

	.category-header:hover {
		color: var(--color-text);
	}

	.collapse-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.collapse-icon.collapsed {
		transform: rotate(-90deg);
	}

	.category-icon {
		font-size: 14px;
	}

	.category-count {
		font-size: 11px;
		padding: 1px 6px;
		background: var(--color-bg-secondary);
		border-radius: 10px;
		font-weight: 600;
		margin-left: 2px;
	}

	.empty {
		color: var(--color-text-secondary);
		padding: 24px 0;
		text-align: center;
	}

	/* Items */
	.items {
		list-style: none;
		padding: 0;
	}

	.item {
		display: flex;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
	}

	.item:last-child {
		border-bottom: none;
	}

	.activity-type-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		flex-shrink: 0;
		width: 62px;
		padding-top: 3px;
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-title-row {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-bottom: 4px;
	}

	.item-title {
		font-size: 14px;
		font-weight: 600;
	}

	.item-number {
		color: var(--color-text-secondary);
		font-weight: 400;
	}

	.item-meta {
		display: flex;
		gap: 10px;
		font-size: 12px;
		color: var(--color-text-secondary);
		flex-wrap: wrap;
		align-items: center;
	}

	.item-repo {
		font-family: var(--font-mono);
	}

	.type-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 0 6px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-link) 10%, transparent);
		color: var(--color-link);
		text-transform: capitalize;
	}

	/* Labels */
	.item-labels {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}

	.label-badge {
		font-size: 11px;
		padding: 0 6px;
		border: 1px solid var(--color-border);
		border-radius: 10px;
		color: var(--color-text-secondary);
		background: var(--color-bg-secondary);
	}

	/* Pagination */
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
