<script lang="ts">
	import type { CountryOption } from '$lib/countries';

	interface Props {
		query: string;
		searchResults: CountryOption[];
		onQueryChange: (query: string) => void;
		onSelectCountry: (country: CountryOption) => void;
	}

	let {
		query,
		searchResults,
		onQueryChange,
		onSelectCountry
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

</div>
