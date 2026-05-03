<script lang="ts">
	import WorldMap from '$lib/components/WorldMap.svelte';
	import { getCountryOptions, type CountryOption } from '$lib/countries';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const countries = getCountryOptions();
	const visited = $derived(Array.from(new Set(data.trips.map((trip) => trip.countryCode))));

	let query = $state('');
	let selectedCountry = $state<CountryOption | null>(null);

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

	function formatRange(dateFrom: string, dateTo: string): string {
		return dateTo ? `${dateFrom} to ${dateTo}` : dateFrom;
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
						<div>
							<p class="trip-country">{trip.countryName}</p>
							<h2>{trip.placeName}</h2>
							<p class="trip-dates">{formatRange(trip.dateFrom, trip.dateTo)}</p>
							{#if trip.notes}
								<p class="trip-notes">{trip.notes}</p>
							{/if}
						</div>

						<div class="trip-actions">
							<a class="button button-secondary" href={`/trip/${trip.id}/edit`}>Edit</a>
							<button class="button button-danger" type="button">Delete</button>
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
