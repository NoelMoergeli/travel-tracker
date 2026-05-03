<script lang="ts">
	import CountryPicker from '$lib/components/CountryPicker.svelte';
	import PhotoManager from '$lib/components/PhotoManager.svelte';
	import {
		validateCountrySelection,
		validateTripField,
		type TripFieldErrors,
		type TripFormField,
		type TripFormValues
	} from '$lib/trip-validation';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let formElement = $state<HTMLFormElement>();
	let clientErrors = $state<TripFieldErrors>({});

	const values = $derived({
		countryCode: form?.values?.countryCode ?? data.trip.countryCode,
		placeName: form?.values?.placeName ?? data.trip.placeName,
		dateFrom: form?.values?.dateFrom ?? data.trip.dateFrom,
		dateTo: form?.values?.dateTo ?? data.trip.dateTo,
		notes: form?.values?.notes ?? data.trip.notes
	});

	const images = $derived(form?.images ?? data.trip.images);
	const photos = $derived(form?.photos ?? data.trip.photos);
	const errors = $derived.by(() => {
		const merged: TripFieldErrors = { ...(form?.errors ?? {}), ...clientErrors };

		for (const field of Object.keys(merged) as (keyof TripFieldErrors)[]) {
			if (!merged[field]) delete merged[field];
		}

		return merged;
	});

	function getFormValues(): TripFormValues {
		if (!formElement) {
			return values;
		}

		const getFieldValue = (name: string): string => {
			const field = formElement?.elements.namedItem(name);
			return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
				? field.value
				: '';
		};

		return {
			countryCode: getFieldValue('countryCode').toUpperCase(),
			placeName: getFieldValue('placeName'),
			dateFrom: getFieldValue('dateFrom'),
			dateTo: getFieldValue('dateTo'),
			notes: getFieldValue('notes')
		};
	}

	function applyFieldErrors(fields: (keyof TripFieldErrors)[], nextErrors: TripFieldErrors): void {
		const nextClientErrors = { ...clientErrors };

		for (const field of fields) {
			nextClientErrors[field] = nextErrors[field] ?? '';
		}

		clientErrors = nextClientErrors;
	}

	function validateField(field: TripFormField): void {
		const nextErrors = validateTripField(field, getFormValues());
		const fields: (keyof TripFieldErrors)[] =
			field === 'dateFrom' ? ['dateFrom', 'dateTo'] : [field];

		applyFieldErrors(fields, nextErrors);
	}

	function validateCountry(countryCode: string, query: string): void {
		applyFieldErrors(['countryCode'], {
			countryCode: validateCountrySelection(countryCode, query)
		});
	}
</script>

<section class="form-page">
	<div class="form-panel">
		<div class="form-heading">
			<p class="eyebrow">Trip details</p>
			<h1>Edit Trip</h1>
		</div>

		<form bind:this={formElement} method="POST" enctype="multipart/form-data">
			<div class="form-grid">
				<CountryPicker
					value={values.countryCode}
					error={errors.countryCode}
					onValidate={validateCountry}
				/>

				<label class="field">
					Place or city
					<input
						class="input"
						name="placeName"
						value={values.placeName}
						required
						onblur={() => validateField('placeName')}
					/>
					{#if errors.placeName}
						<p class="field-error">{errors.placeName}</p>
					{/if}
				</label>

				<label class="field">
					Date from
					<input
						class="input"
						name="dateFrom"
						type="date"
						value={values.dateFrom}
						required
						onblur={() => validateField('dateFrom')}
					/>
					{#if errors.dateFrom}
						<p class="field-error">{errors.dateFrom}</p>
					{/if}
				</label>

				<label class="field">
					Date to
					<input
						class="input"
						name="dateTo"
						type="date"
						value={values.dateTo}
						onblur={() => validateField('dateTo')}
					/>
					{#if errors.dateTo}
						<p class="field-error">{errors.dateTo}</p>
					{/if}
				</label>
			</div>

			<label class="field">
				Notes
				<textarea class="input textarea" name="notes" onblur={() => validateField('notes')}>{values.notes}</textarea>
			</label>

			{#each images as image}
				<input type="hidden" name="existingImages" value={image} />
			{/each}

			<PhotoManager {photos} error={errors.photos} />

			<div class="form-actions">
				<a class="button button-secondary" href="/dashboard">Cancel</a>
				<button class="button button-primary" type="submit">Save Changes</button>
			</div>

			{#if form?.message && !Object.keys(errors).length}
				<p class="error">{form.message}</p>
			{/if}
		</form>
	</div>
</section>
