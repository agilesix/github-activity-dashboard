<script lang="ts">
	import { page } from '$app/state';
	import { resolveRoute } from '$app/paths';
</script>

<main class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error?.message || 'Something went wrong.'}</p>
	<a href={resolveRoute('/')}>Back to search</a>
</main>

<style>
	.error-page {
		max-width: 480px;
		margin: 0 auto;
		padding: 80px 20px;
		text-align: center;
	}

	h1 {
		font-size: 48px;
		color: var(--color-text-secondary);
		margin-bottom: 8px;
	}

	p {
		color: var(--color-text-secondary);
		margin-bottom: 24px;
	}
</style>
