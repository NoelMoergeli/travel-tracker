<script lang="ts">
	import CountryPicker from '$lib/components/CountryPicker.svelte';
	import PhotoManager from '$lib/components/PhotoManager.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const values = $derived({
		countryCode: form?.values?.countryCode ?? data.trip.countryCode,
		placeName: form?.values?.placeName ?? data.trip.placeName,
		dateFrom: form?.values?.dateFrom ?? data.trip.dateFrom,
		dateTo: form?.values?.dateTo ?? data.trip.dateTo,
		notes: form?.values?.notes ?? data.trip.notes
	});

	const images = $derived(form?.images ?? data.trip.images);
	const photos = $derived(form?.photos ?? data.trip.photos);
</script>

<section class="form-page">
	<div class="form-panel">
		<div class="form-heading">
			<p class="eyebrow">Trip details</p>
			<h1>Edit Trip</h1>
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

			{#if images.length}
				<div class="field">
					<span>Existing uploaded photos</span>
					<div class="image-grid">
						{#each images as image}
							<label class="image-choice">
								<img src={image} alt="" />
								<span>
									<input type="checkbox" name="existingImages" value={image} checked />
									Keep
								</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}

			<PhotoManager {photos} />

			<label class="field">
				Add photos
				<input class="input file-input" name="images" type="file" accept="image/*" multiple />
			</label>

			<div class="form-actions">
				<a class="button button-secondary" href="/dashboard">Cancel</a>
				<button class="button button-primary" type="submit">Save Changes</button>
			</div>

			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}
		</form>
	</div>
</section>
