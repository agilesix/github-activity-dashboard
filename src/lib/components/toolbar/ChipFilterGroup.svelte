<script lang="ts">
	interface Props {
		label: string;
		options: readonly string[];
		selected: readonly string[];
		onToggle: (option: string) => void;
		formatOption?: (option: string) => string;
	}

	let { label, options, selected, onToggle, formatOption }: Props = $props();
</script>

{#if options.length > 0}
	<div class="filter-group">
		<span class="filter-label">{label}</span>
		<div class="filter-chips">
			{#each options as option (option)}
				<button
					class="chip"
					class:active={selected.includes(option)}
					onclick={() => onToggle(option)}
					type="button"
				>
					{formatOption ? formatOption(option) : option}
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
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
</style>
