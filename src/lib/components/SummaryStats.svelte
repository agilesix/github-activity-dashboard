<script lang="ts">
	import type { SummaryStats } from '$lib/types';
	import { formatDisplayDate } from '$lib/utils';

	interface Props {
		stats: SummaryStats;
	}

	let { stats }: Props = $props();
</script>

<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-value">{stats.totalItems}</div>
		<div class="stat-label">Total Activities</div>
	</div>

	{#if stats.mostActiveRepo}
		<div class="stat-card">
			<div class="stat-value repo">{stats.mostActiveRepo}</div>
			<div class="stat-label">Most Active Repo</div>
		</div>
	{/if}

	{#if stats.mostActiveDay}
		<div class="stat-card">
			<div class="stat-value">{formatDisplayDate(stats.mostActiveDay)}</div>
			<div class="stat-label">Most Active Day</div>
		</div>
	{/if}
</div>

<style>
	.stats-grid {
		display: flex;
		gap: 12px;
	}

	@media (max-width: 640px) {
		.stats-grid {
			flex-direction: column;
		}
	}

	.stat-card {
		flex: 1;
		padding: 14px 16px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-secondary);
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: 20px;
		font-weight: 700;
		margin-bottom: 2px;
	}

	.stat-value.repo {
		font-size: 14px;
		font-family: var(--font-mono);
	}

	.stat-label {
		font-size: 12px;
		color: var(--color-text-secondary);
		margin-top: auto;
	}
</style>
