<script lang="ts">
	interface Props {
		repos: string[];
		username: string;
	}

	let { repos = $bindable([]), username }: Props = $props();

	let inputValue = $state('');
	let suggestions = $state<string[]>([]);
	let showSuggestions = $state(false);
	let loading = $state(false);
	let fetchedUser = $state('');

	async function loadSuggestions() {
		if (!username || username === fetchedUser) return;
		loading = true;
		try {
			const res = await fetch(`/api/repos?username=${encodeURIComponent(username)}`);
			const data: { repos?: string[] } = await res.json();
			suggestions = data.repos || [];
			fetchedUser = username;
		} catch {
			suggestions = [];
		} finally {
			loading = false;
		}
	}

	function addRepo(repo: string) {
		const trimmed = repo.trim();
		if (trimmed && !repos.includes(trimmed)) {
			repos = [...repos, trimmed];
		}
		inputValue = '';
		showSuggestions = false;
	}

	function removeRepo(repo: string) {
		repos = repos.filter((r) => r !== repo);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && inputValue.trim()) {
			e.preventDefault();
			addRepo(inputValue);
		}
		if (e.key === 'Backspace' && !inputValue && repos.length > 0) {
			repos = repos.slice(0, -1);
		}
	}

	function handleFocus() {
		loadSuggestions();
		showSuggestions = true;
	}

	let filteredSuggestions = $derived(
		suggestions
			.filter((s) => !repos.includes(s))
			.filter((s) => !inputValue || s.toLowerCase().includes(inputValue.toLowerCase()))
	);
</script>

<div class="repo-input">
	<div class="tags">
		{#each repos as repo (repo)}
			<span class="tag">
				{repo}
				<button type="button" class="tag-remove" onclick={() => removeRepo(repo)}>&times;</button>
			</span>
		{/each}
		<input
			type="text"
			bind:value={inputValue}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={() => setTimeout(() => (showSuggestions = false), 200)}
			placeholder={repos.length === 0 ? 'owner/repo' : 'Add another...'}
		/>
	</div>

	{#if showSuggestions && (filteredSuggestions.length > 0 || loading)}
		<div class="suggestions">
			{#if loading}
				<div class="suggestion-item loading">Loading repos...</div>
			{:else}
				{#each filteredSuggestions.slice(0, 20) as suggestion (suggestion)}
					<button type="button" class="suggestion-item" onmousedown={() => addRepo(suggestion)}>
						{suggestion}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.repo-input {
		position: relative;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 6px 8px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		min-height: 38px;
		align-items: center;
	}

	.tags:focus-within {
		border-color: var(--color-link);
		outline: 2px solid color-mix(in srgb, var(--color-link) 20%, transparent);
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 2px 8px;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 12px;
		font-family: var(--font-mono);
	}

	.tag-remove {
		background: none;
		border: none;
		padding: 0 2px;
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1;
	}

	.tag-remove:hover {
		color: var(--color-danger);
	}

	.tags input {
		border: none;
		outline: none;
		flex: 1;
		min-width: 120px;
		padding: 2px 0;
		font-family: var(--font-mono);
		font-size: 13px;
	}

	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		margin-top: 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.suggestion-item {
		display: block;
		width: 100%;
		padding: 6px 10px;
		text-align: left;
		background: none;
		border: none;
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--color-text);
	}

	.suggestion-item:hover {
		background: var(--color-bg-secondary);
	}

	.suggestion-item.loading {
		color: var(--color-text-secondary);
		font-style: italic;
		font-family: var(--font-sans);
	}
</style>
