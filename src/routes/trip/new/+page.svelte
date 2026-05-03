<script lang="ts">
	import CountryPicker from '$lib/components/CountryPicker.svelte';
	import PhotoManager from '$lib/components/PhotoManager.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const values = $derived({
		countryCode: form?.values?.countryCode ?? data.countryCode,
		placeName: form?.values?.placeName ?? '',
		dateFrom: form?.values?.dateFrom ?? '',
		dateTo: form?.values?.dateTo ?? '',
		notes: form?.values?.notes ?? ''
	});

	const photos = $derived(form?.photos ?? []);
</script>

<section class="form-page">
	<div class="form-panel">
		<div class="form-heading">
			<p class="eyebrow">New itinerary</p>
			<h1>Add Trip</h1>
		</div>

		<form method="POST" enctype="multipart/form-data">
			<div class="form-grid">
				<CountryPicker value={values.countryCode} />

				<label class="field">
					Place or city
					<input class="input" name="placeName" value={values.placeName} required />
				</label>

				<label class="field">
					Date from
					<input class="input" name="dateFrom" type="date" value={values.dateFrom} required />
				</label>

				<label class="field">
					Date to
					<input class="input" name="dateTo" type="date" value={values.dateTo} />
				</label>
			</div>

			<label class="field">
				Notes
				<textarea class="input textarea" name="notes">{values.notes}</textarea>
			</label>

			<PhotoManager {photos} />

			<div class="form-actions">
				<a class="button button-secondary" href="/dashboard">Cancel</a>
				<button class="button button-primary" type="submit">Save Trip</button>
			</div>

			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}
		</form>
	</div>
</section>
