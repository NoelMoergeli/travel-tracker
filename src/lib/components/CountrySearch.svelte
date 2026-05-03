<script lang="ts">
	import type { CountryOption } from '$lib/countries';

	interface Props {
		query: string;
		searchResults: CountryOption[];
		selectedCountry: CountryOption | null;
		onQueryChange: (query: string) => void;
		onSelectCountry: (country: CountryOption) => void;
		onClearSelectedCountry: () => void;
	}

	let {
		query,
		searchResults,
		selectedCountry,
		onQueryChange,
		onSelectCountry,
		onClearSelectedCountry
	}: Props = $props();
</script>

<div class="country-search">
	<label class="field">
		Country search
		<input
			class="input"
			value={query}
			autocomplete="off"
			placeholder="Search by country or code"
			oninput={(event) => onQueryChange((event.currentTarget as HTMLInputElement).value)}
		/>
	</label>

	{#if searchResults.length}
		<ul class="search-results" aria-label="Country search results">
			{#each searchResults as country}
				<li>
					<button type="button" onclick={() => onSelectCountry(country)}>
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
			<div class="selected-country-actions">
				<a class="button button-primary" href={`/trip/new?country=${selectedCountry.code}`}>Record Trip</a>
				<button class="button button-secondary" type="button" onclick={onClearSelectedCountry}>
					Clear Selection
				</button>
			</div>
		</div>
	{/if}
</div>
