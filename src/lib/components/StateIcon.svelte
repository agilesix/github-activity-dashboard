<script lang="ts">
	import type { ActivityCategory } from '$lib/types';

	interface Props {
		state: string;
		category: ActivityCategory;
	}

	let { state, category }: Props = $props();

	// GitHub-matching colors
	// Issues: open=#1a7f37, closed/completed=#8250df, not_planned=#656d76
	// PRs: open=#1a7f37, merged=#8250df, closed=#d1242f, draft=#656d76
	let color = $derived.by(() => {
		if (category === 'pull_requests') {
			switch (state) {
				case 'merged':
					return '#8250df';
				case 'open':
					return '#1a7f37';
				case 'closed':
					return '#d1242f';
				case 'draft':
					return '#656d76';
				default:
					return '#656d76';
			}
		}
		// Issues
		switch (state) {
			case 'open':
				return '#1a7f37';
			case 'closed':
				return '#8250df';
			case 'not_planned':
				return '#656d76';
			default:
				return '#656d76';
		}
	});

	let title = $derived.by(() => {
		if (category === 'pull_requests') {
			switch (state) {
				case 'merged':
					return 'Merged';
				case 'open':
					return 'Open';
				case 'closed':
					return 'Closed';
				case 'draft':
					return 'Draft';
				default:
					return state;
			}
		}
		switch (state) {
			case 'open':
				return 'Open';
			case 'closed':
				return 'Closed';
			case 'not_planned':
				return 'Not planned';
			default:
				return state;
		}
	});
</script>

<span class="state-icon" {title} aria-label={title}>
	<svg width="16" height="16" viewBox="0 0 16 16" fill={color} aria-hidden="true">
		{#if category === 'pull_requests'}
			{#if state === 'merged'}
				<!-- Git merge icon -->
				<path
					d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
				/>
			{:else if state === 'open'}
				<!-- Git PR open icon -->
				<path
					d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"
				/>
			{:else}
				<!-- Git PR closed icon -->
				<path
					d="M3.25 1A2.25 2.25 0 0 1 4 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 3.25 1Zm9.5 5.5a.75.75 0 0 1 .75.75v3.378a2.251 2.251 0 1 1-1.5 0V7.25a.75.75 0 0 1 .75-.75Zm-2.03-5.28a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06-1.06l.97-.97-.97-.97a.75.75 0 0 1 0-1.06ZM3.25 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm9.5.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"
				/>
			{/if}
		{:else if state === 'open'}
			<!-- Issue open icon (circle with dot) -->
			<path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
			<path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
		{:else if state === 'not_planned'}
			<!-- Issue not planned (circle with slash) -->
			<path
				d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.22-5.5 5.5a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l5.5-5.5a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"
			/>
		{:else}
			<!-- Issue closed (check circle) -->
			<path
				d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"
			/>
			<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z" />
		{/if}
	</svg>
</span>

<style>
	.state-icon {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		height: 21px; /* match title line-height (14px * 1.5) */
	}
</style>
