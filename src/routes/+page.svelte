<script lang="ts">
	import QueryForm from '$lib/components/QueryForm.svelte';
</script>

<main class="page">
	<header>
		<h1>GitHub Activity Dashboard</h1>
		<p>View a summary of GitHub activity for any user across multiple repositories.</p>
	</header>

	<QueryForm />
</main>

<style>
	.page {
		max-width: 640px;
		margin: 0 auto;
		padding: 48px 20px;
	}

	header {
		margin-bottom: 32px;
	}

	h1 {
		font-size: 24px;
		margin-bottom: 6px;
	}

	p {
		color: var(--color-text-secondary);
		font-size: 15px;
	}
</style>
