<script lang="ts">
	import '$lib/styles/global.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	function initials(username: string): string {
		return username.slice(0, 2).toUpperCase();
	}
</script>

<svelte:head>
	<title>Travel Tracker</title>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<div class="header-inner">
			<a class="brand" href={data.user ? '/dashboard' : '/login'}>Travel Tracker</a>

			<nav class="nav" aria-label="Main navigation">
				{#if data.user}
					<a class="nav-link" href="/trip/new">Add Trip</a>
					<a class="nav-link" href="/dashboard">Dashboard</a>
					<form method="POST" action="/logout">
						<button class="button button-secondary" type="submit">Log out</button>
					</form>
					<div class="account" aria-label={`Signed in as ${data.user.username}`}>
						<span class="avatar" aria-hidden="true">{initials(data.user.username)}</span>
						<span>{data.user.username}</span>
					</div>
				{:else}
					<a class="nav-link" href="/login">Log in</a>
					<a class="button button-primary" href="/register">Create account</a>
				{/if}
			</nav>
		</div>
	</header>

	<main class="page">
		{@render children()}
	</main>
</div>
