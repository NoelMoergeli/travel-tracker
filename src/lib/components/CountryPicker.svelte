<script lang="ts">
	import { getCountryOptions, type CountryOption } from '$lib/countries';

	interface Props {
		value?: string;
		label?: string;
		name?: string;
		placeholder?: string;
	}

	let {
		value = '',
		label = 'Country',
		name = 'countryCode',
		placeholder = 'Search by country or code'
	}: Props = $props();

	const countries = getCountryOptions();
	let appliedValue = '';

	let query = $state('');
	let selectedCode = $state('');
	let searchInput = $state<HTMLInputElement>();

	const selectedCountry = $derived(
		countries.find((country) => country.code === selectedCode) ?? null
	);

	const searchResults = $derived.by(() => {
		const normalized = query.trim().toLowerCase();
		const selectedLabel = selectedCountry?.name.toLowerCase();

		if (!normalized || normalized === selectedLabel || normalized === selectedCountry?.code.toLowerCase()) {
			return [];
		}

		return countries
			.filter(
				(country) =>
					country.name.toLowerCase().includes(normalized) ||
					country.code.toLowerCase().includes(normalized)
			)
			.slice(0, 8);
	});

	$effect(() => {
		const nextCode = value.toUpperCase();
		if (nextCode === appliedValue) return;

		const country = countries.find((option) => option.code === nextCode) ?? null;
		selectedCode = country?.code ?? '';
		query = country ? formatCountryLabel(country) : nextCode;
		appliedValue = nextCode;
	});

	$effect(() => {
		searchInput?.setCustomValidity(
			query.trim() && !selectedCode ? 'Choose a country from the list.' : ''
		);
	});

	function selectCountry(country: CountryOption): void {
		selectedCode = country.code;
		query = formatCountryLabel(country);
	}

	function formatCountryLabel(country: CountryOption): string {
		return `${country.name} (${country.code})`;
	}

	function updateQuery(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		query = input.value;

		const normalized = query.trim().toLowerCase();
		const labelCountry = countries.find(
			(country) => formatCountryLabel(country).toLowerCase() === normalized
		);
		const exactCountry =
			labelCountry ??
			countries.find((country) => country.code.toLowerCase() === normalized) ??
			countries.find((country) => country.name.toLowerCase() === normalized);

		selectedCode = exactCountry?.code ?? '';
	}
</script>

<div class="field country-picker">
	<label for={`${name}-search`}>{label}</label>
	<input type="hidden" {name} value={selectedCode} />
	<input
		id={`${name}-search`}
		bind:this={searchInput}
		class="input"
		value={query}
		autocomplete="off"
		placeholder={placeholder}
		required
		oninput={updateQuery}
	/>

	{#if searchResults.length}
		<ul class="search-results" aria-label={`${label} search results`}>
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
</div>
