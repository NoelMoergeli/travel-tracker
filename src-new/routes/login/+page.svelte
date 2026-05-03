<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<section class="auth-panel">
	<h1>Log in</h1>
	<form method="POST">
		<label class="field">
			Username
			<input class="input" name="username" autocomplete="username" required />
		</label>

		<label class="field">
			Password
			<input class="input" name="password" type="password" autocomplete="current-password" required />
		</label>

		<div class="form-actions">
			<a class="button button-secondary" href="/register">Create account</a>
			<button class="button button-primary" type="submit">Log in</button>
		</div>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}
	</form>
</section>
