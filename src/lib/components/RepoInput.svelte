<script lang="ts">
	interface Props {
		repos: string[];
		username: string;
		pat?: string;
	}

	let { repos = $bindable([]), username, pat }: Props = $props();

	let inputValue = $state('');
	let suggestions = $state<string[]>([]);
	let showSuggestions = $state(false);
	let loading = $state(false);
	let fetchedUser = $state('');
	let fetchedPat = $state('');
	let highlightIndex = $state(-1);

	async function loadSuggestions() {
		if (!username || (username === fetchedUser && (pat || '') === fetchedPat)) return;
		loading = true;
		try {
			const url = `/api/repos?username=${encodeURIComponent(username)}`;
			const headers: Record<string, string> = {};
			if (pat) headers['x-github-pat'] = pat;
			const res = await fetch(url, { headers });
			const data: { repos?: string[] } = await res.json();
			suggestions = data.repos || [];
			fetchedUser = username;
			fetchedPat = pat || '';
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
		highlightIndex = -1;
		showSuggestions = false;
	}

	function removeRepo(repo: string) {
		repos = repos.filter((r) => r !== repo);
	}

	function handleKeydown(e: KeyboardEvent) {
		const visible = showSuggestions && filteredSuggestions.length > 0;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (!visible) {
				showSuggestions = true;
				highlightIndex = 0;
			} else {
				highlightIndex = Math.min(highlightIndex + 1, filteredSuggestions.length - 1);
			}
			scrollToHighlighted();
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (visible) {
				highlightIndex = Math.max(highlightIndex - 1, 0);
				scrollToHighlighted();
			}
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			if (visible && highlightIndex >= 0 && highlightIndex < filteredSuggestions.length) {
				addRepo(filteredSuggestions[highlightIndex]);
			} else if (inputValue.trim()) {
				addRepo(inputValue);
			}
			return;
		}

		if (e.key === 'Escape') {
			showSuggestions = false;
			highlightIndex = -1;
			return;
		}

		if (e.key === 'Tab' && visible && highlightIndex >= 0) {
			e.preventDefault();
			addRepo(filteredSuggestions[highlightIndex]);
			return;
		}

		if (e.key === 'Backspace' && !inputValue && repos.length > 0) {
			repos = repos.slice(0, -1);
		}
	}

	function scrollToHighlighted() {
		requestAnimationFrame(() => {
			const el = document.querySelector('.suggestion-item.highlighted');
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	function handleInput() {
		showSuggestions = true;
		highlightIndex = -1;
	}

	function handleFocus() {
		loadSuggestions();
		showSuggestions = true;
	}

	function handleBlur() {
		// Delay so mousedown on suggestion fires before dropdown closes
		setTimeout(() => {
			showSuggestions = false;
			highlightIndex = -1;
		}, 200);
	}

	let filteredSuggestions = $derived(
		suggestions
			.filter((s) => !repos.includes(s))
			.filter((s) => !inputValue || s.toLowerCase().includes(inputValue.toLowerCase()))
			.slice(0, 20)
	);

	// Reset highlight when filter changes
	$effect(() => {
		void filteredSuggestions;
		highlightIndex = -1;
	});
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
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
			placeholder={repos.length === 0 ? 'owner/repo' : 'Add another...'}
			role="combobox"
			aria-expanded={showSuggestions && filteredSuggestions.length > 0}
			aria-autocomplete="list"
			aria-controls="repo-suggestions"
			aria-activedescendant={highlightIndex >= 0 ? `repo-option-${highlightIndex}` : undefined}
		/>
	</div>

	{#if showSuggestions && (filteredSuggestions.length > 0 || loading)}
		<ul class="suggestions" id="repo-suggestions" role="listbox">
			{#if loading}
				<li class="suggestion-item loading">Loading repos...</li>
			{:else}
				{#each filteredSuggestions as suggestion, i (suggestion)}
					<li
						id="repo-option-{i}"
						class="suggestion-item"
						class:highlighted={i === highlightIndex}
						role="option"
						aria-selected={i === highlightIndex}
						onmousedown={() => addRepo(suggestion)}
						onmouseenter={() => (highlightIndex = i)}
					>
						{suggestion}
					</li>
				{/each}
			{/if}
		</ul>
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
		list-style: none;
		padding: 0;
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
		cursor: pointer;
	}

	.suggestion-item:hover,
	.suggestion-item.highlighted {
		background: var(--color-bg-secondary);
	}

	.suggestion-item.loading {
		color: var(--color-text-secondary);
		font-style: italic;
		font-family: var(--font-sans);
		cursor: default;
	}
</style>
