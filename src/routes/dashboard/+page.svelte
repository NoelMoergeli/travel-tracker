<script lang="ts">
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import PhotoLightbox from '$lib/components/PhotoLightbox.svelte';
	import WorldMap from '$lib/components/WorldMap.svelte';
	import { getCountryOptions, type CountryOption } from '$lib/countries';
	import type { ActionData, PageData } from './$types';
	import type { PublicTrip, PublicTripPhoto } from '$lib/models/public';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const countries = getCountryOptions();
	const visited = $derived(Array.from(new Set(data.trips.map((trip) => trip.countryCode))));

	let query = $state('');
	let selectedCountry = $state<CountryOption | null>(null);
	let deleteCandidate = $state<PublicTrip | null>(null);
	let galleryTrip = $state<PublicTrip | null>(null);
	let lightboxPhotos = $state<PublicTripPhoto[]>([]);
	let lightboxIndex = $state(0);

	const searchResults = $derived.by(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];

		return countries
			.filter(
				(country) =>
					country.name.toLowerCase().includes(normalized) ||
					country.code.toLowerCase().includes(normalized)
			)
			.slice(0, 8);
	});

	const visibleTrips = $derived.by(() => {
		if (!selectedCountry) return data.trips;
		return data.trips.filter((trip) => trip.countryCode === selectedCountry?.code);
	});

	function selectCountry(country: CountryOption): void {
		selectedCountry = country;
		query = '';
	}

	function clearSelectedCountry(): void {
		selectedCountry = null;
		query = '';
	}

	function formatRange(dateFrom: string, dateTo: string): string {
		return dateTo ? `${dateFrom} to ${dateTo}` : dateFrom;
	}

	function openLightbox(photos: PublicTripPhoto[], index: number): void {
		lightboxPhotos = photos;
		lightboxIndex = index;
	}

	function closeLightbox(): void {
		lightboxPhotos = [];
		lightboxIndex = 0;
	}
</script>

<section class="dashboard-page">
	<aside class="overview-panel" aria-label="Trip overview">
		<div class="overview-heading">
			<p class="eyebrow">Travel overview</p>
			<h1>{selectedCountry ? selectedCountry.name : 'Dashboard'}</h1>
			<p>{data.trips.length} recorded {data.trips.length === 1 ? 'trip' : 'trips'}</p>
		</div>

		<div class="trip-list" aria-label="Past trips">
			{#if visibleTrips.length}
				{#each visibleTrips as trip}
					<article class="trip-card">
						{#if trip.photos.length}
							<button class="trip-photo-preview" type="button" onclick={() => (galleryTrip = trip)}>
								<img src={trip.photos[0].url} alt={trip.photos[0].caption || `${trip.placeName} photo`} />
							</button>
						{/if}

						<div>
							<p class="trip-country">{trip.countryName}</p>
							<h2>{trip.placeName}</h2>
							<p class="trip-dates">{formatRange(trip.dateFrom, trip.dateTo)}</p>
							{#if trip.notes}
								<p class="trip-notes">{trip.notes}</p>
							{/if}
						</div>

						<div class="trip-actions">
							{#if trip.photos.length}
								<button class="button button-secondary" type="button" onclick={() => (galleryTrip = trip)}>
									View Gallery
								</button>
							{/if}
							<a class="button button-secondary" href={`/trip/${trip.id}/edit`}>Edit</a>
							<button class="button button-danger" type="button" onclick={() => (deleteCandidate = trip)}>
								Delete
							</button>
						</div>
					</article>
				{/each}
			{:else}
				<div class="empty-state">
					<h2>No trips yet</h2>
					<p>{selectedCountry ? `No trips recorded in ${selectedCountry.name}.` : 'Start by recording your first trip.'}</p>
				</div>
			{/if}
		</div>

		<div class="country-search">
			<label class="field">
				Country search
				<input
					class="input"
					bind:value={query}
					autocomplete="off"
					placeholder="Search by country or code"
				/>
			</label>

			{#if searchResults.length}
				<ul class="search-results" aria-label="Country search results">
					{#each searchResults as country}
						<li>
							<button type="button" onclick={() => selectCountry(country)}>
								<span>{country.name}</span>
								<span>{country.code}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			{#if selectedCountry}
				<div class="selected-country">
					<p>Selected country</p>
					<strong>{selectedCountry.name} ({selectedCountry.code})</strong>
					<a class="button button-primary" href={`/trip/new?country=${selectedCountry.code}`}>Record Trip</a>
					<button class="button button-secondary" type="button" onclick={clearSelectedCountry}>
						Clear Selection
					</button>
				</div>
			{/if}
		</div>
	</aside>

	<section class="map-panel" aria-label="World map">
		<WorldMap
			{visited}
			selected={selectedCountry?.code}
			onSelectCountry={(country) => selectCountry(country)}
		/>
	</section>
</section>

{#if form?.message}
	<p class="toast-error" role="alert">{form.message}</p>
{/if}

{#if deleteCandidate}
	<div class="modal-layer">
		<button
			class="modal-backdrop"
			type="button"
			aria-label="Cancel deletion"
			onclick={() => (deleteCandidate = null)}
		></button>
		<dialog
			open
			class="modal"
			aria-labelledby="delete-title"
		>
			<h2 id="delete-title">Delete this trip?</h2>
			<p>
				This will permanently delete the trip to {deleteCandidate.placeName},
				{deleteCandidate.countryName}.
			</p>
			<form method="POST" action="?/deleteTrip" class="modal-actions">
				<input type="hidden" name="tripId" value={deleteCandidate.id} />
				<button class="button button-secondary" type="button" onclick={() => (deleteCandidate = null)}>
					Cancel
				</button>
				<button class="button button-danger" type="submit">Delete Trip</button>
			</form>
		</dialog>
	</div>
{/if}

{#if galleryTrip}
	<div class="modal-layer">
		<button
			class="modal-backdrop"
			type="button"
			aria-label="Close gallery"
			onclick={() => (galleryTrip = null)}
		></button>
		<dialog open class="modal gallery-modal" aria-labelledby="gallery-title">
			<div class="modal-header">
				<div>
					<p class="eyebrow">{galleryTrip.countryName}</p>
					<h2 id="gallery-title">{galleryTrip.placeName} Gallery</h2>
				</div>
				<button class="button button-secondary" type="button" onclick={() => (galleryTrip = null)}>
					Close
				</button>
			</div>

			<PhotoGrid photos={galleryTrip.photos} onSelectPhoto={(index) => openLightbox(galleryTrip.photos, index)} />
		</dialog>
	</div>
{/if}

{#if lightboxPhotos.length}
	<PhotoLightbox photos={lightboxPhotos} initialIndex={lightboxIndex} onClose={closeLightbox} />
{/if}
