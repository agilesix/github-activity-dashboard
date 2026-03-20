<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from '$lib/types';
	import { encodeQueryParams, getDefaultDateRange, validateQueryParams } from '$lib/utils';
	import type { ActivityType, QueryParams } from '$lib/types';
	import RepoInput from './RepoInput.svelte';

	const defaults = getDefaultDateRange();

	let username = $state('');
	let repos = $state<string[]>([]);
	let fromDate = $state(defaults.from);
	let toDate = $state(defaults.to);
	let selectedTypes = $state<ActivityType[]>([...ACTIVITY_TYPES]);
	let pat = $state('');
	let errors = $state<string[]>([]);

	function toggleType(type: ActivityType) {
		if (selectedTypes.includes(type)) {
			selectedTypes = selectedTypes.filter((t) => t !== type);
		} else {
			selectedTypes = [...selectedTypes, type];
		}
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		const params: QueryParams = {
			user: username,
			repos,
			from: fromDate,
			to: toDate,
			types: selectedTypes,
			pat: pat || undefined
		};

		const validationErrors = validateQueryParams(params);
		if (validationErrors.length > 0) {
			errors = validationErrors;
			return;
		}

		errors = [];
		const query = encodeQueryParams(params);
		// Store PAT in sessionStorage (never in URL)
		if (pat) {
			sessionStorage.setItem('github_pat', pat);
		}
		goto(`${resolveRoute('/results')}?${query}`);
	}
</script>

<form onsubmit={handleSubmit} class="form">
	<div class="field">
		<label for="username">GitHub Username</label>
		<input id="username" type="text" bind:value={username} placeholder="octocat" required />
	</div>

	<div class="field">
		<label for="repos">Repositories</label>
		<RepoInput bind:repos {username} />
		<span class="hint">Type owner/repo and press Enter, or select from suggestions</span>
	</div>

	<div class="field-row">
		<div class="field">
			<label for="from">From</label>
			<input id="from" type="date" bind:value={fromDate} required />
		</div>
		<div class="field">
			<label for="to">To</label>
			<input id="to" type="date" bind:value={toDate} required />
		</div>
	</div>

	<fieldset class="field">
		<legend>Activity Types</legend>
		<div class="checkbox-group">
			{#each ACTIVITY_TYPES as type (type)}
				<label class="checkbox-label">
					<input
						type="checkbox"
						checked={selectedTypes.includes(type)}
						onchange={() => toggleType(type)}
					/>
					{ACTIVITY_TYPE_LABELS[type]}
				</label>
			{/each}
		</div>
	</fieldset>

	<details class="field">
		<summary>Advanced</summary>
		<div class="field" style="margin-top: 8px;">
			<label for="pat">GitHub Personal Access Token (optional)</label>
			<input id="pat" type="password" bind:value={pat} placeholder="ghp_..." />
			<span class="hint">
				Increases rate limits from 60/hr to 5,000/hr. Not stored anywhere beyond this session.
			</span>
		</div>
	</details>

	{#if errors.length > 0}
		<div class="errors">
			{#each errors as error, i (i)}
				<p>{error}</p>
			{/each}
		</div>
	{/if}

	<button type="submit" class="submit-btn">View Activity</button>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 560px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field-row {
		display: flex;
		gap: 12px;
	}

	.field-row .field {
		flex: 1;
	}

	label:not(.checkbox-label) {
		font-weight: 600;
		font-size: 13px;
	}

	input[type='text'],
	input[type='password'],
	input[type='date'] {
		padding: 6px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: 14px;
	}

	input:focus {
		border-color: var(--color-link);
		outline: 2px solid color-mix(in srgb, var(--color-link) 20%, transparent);
	}

	.hint {
		font-size: 12px;
		color: var(--color-text-secondary);
	}

	fieldset {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 10px 12px;
	}

	legend {
		font-weight: 600;
		font-size: 13px;
		padding: 0 4px;
	}

	.checkbox-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px 16px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		cursor: pointer;
	}

	details summary {
		cursor: pointer;
		font-weight: 600;
		font-size: 13px;
		color: var(--color-text-secondary);
	}

	.errors {
		padding: 8px 12px;
		background: color-mix(in srgb, var(--color-danger) 8%, transparent);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius-md);
		color: var(--color-danger);
		font-size: 13px;
	}

	.errors p {
		margin: 2px 0;
	}

	.submit-btn {
		padding: 8px 20px;
		background: var(--color-success);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 14px;
		align-self: flex-start;
	}

	.submit-btn:hover {
		opacity: 0.9;
	}
</style>
