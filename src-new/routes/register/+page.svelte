<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<section class="auth-panel">
	<h1>Create account</h1>
	<form method="POST">
		<label class="field">
			Username
			<input class="input" name="username" autocomplete="username" minlength="3" required />
		</label>

		<label class="field">
			Password
			<input class="input" name="password" type="password" autocomplete="new-password" minlength="6" required />
		</label>

		<div class="form-actions">
			<a class="button button-secondary" href="/login">Log in</a>
			<button class="button button-primary" type="submit">Create account</button>
		</div>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}
	</form>
</section>
