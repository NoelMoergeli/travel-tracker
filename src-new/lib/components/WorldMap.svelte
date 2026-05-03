<script lang="ts">
	import { onMount } from 'svelte';
	import { geoMercator, geoPath } from 'd3-geo';
	import { feature } from 'topojson-client';
	import { getCountryCode } from '$lib/countries';

	interface CountryFeature {
		id: string | number;
		properties?: {
			name?: string;
			NAME?: string;
			NAME_LONG?: string;
		};
		type: string;
	}

	interface MapCountry {
		feature: CountryFeature;
		name: string;
		code: string | null;
	}

	interface Props {
		visited?: string[];
		selected?: string | null;
		width?: number;
		height?: number;
		onSelectCountry?: (country: { code: string; name: string }) => void;
	}

	let {
		visited = [],
		selected = null,
		width = 920,
		height = 520,
		onSelectCountry
	}: Props = $props();

	let countries = $state<MapCountry[]>([]);
	let hovered = $state<string | null>(null);
	let error = $state<string | null>(null);

	const visitedSet = $derived(new Set(visited.map((code) => code.toUpperCase())));
	const selectedCode = $derived(selected?.toUpperCase() ?? null);
	const projection = $derived(geoMercator().scale(width / 6.7).translate([width / 2, height / 1.62]));
	const path = $derived(geoPath(projection));

	onMount(async () => {
		try {
			const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
			if (!response.ok) throw new Error('Map data could not be loaded.');

			const topo = (await response.json()) as {
				objects: { countries: unknown };
			};
			const collection = feature(topo, topo.objects.countries) as unknown as { features: CountryFeature[] };

			countries = collection.features.map((item) => {
				const name =
					item.properties?.name ?? item.properties?.NAME ?? item.properties?.NAME_LONG ?? String(item.id);
				return {
					feature: item,
					name,
					code: getCountryCode(name)
				};
			});
		} catch (mapError) {
			console.error(mapError);
			error = 'Unable to load the map right now.';
		}
	});

	function fillFor(code: string | null): string {
		if (code && code === selectedCode) return '#ffb703';
		if (code && visitedSet.has(code)) return '#176b87';
		return '#d9e1ea';
	}

	function selectCountry(country: MapCountry): void {
		if (!country.code) return;
		onSelectCountry?.({ code: country.code, name: country.name });
	}
</script>

<div class="world-map">
	{#if error}
		<p class="map-error">{error}</p>
	{:else}
		<svg {width} {height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Interactive world map">
			<g>
				{#each countries as country}
					{@const d = path(country.feature)}
					{#if d}
						<path
							d={d}
							fill={fillFor(country.code)}
							stroke="#ffffff"
							stroke-width="0.55"
							tabindex="0"
							role="button"
							aria-label={country.name}
							aria-disabled={country.code ? undefined : 'true'}
							class:selected={country.code === selectedCode}
							class:visited={country.code ? visitedSet.has(country.code) : false}
							onclick={() => selectCountry(country)}
							onkeydown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') selectCountry(country);
							}}
							onmouseenter={() => (hovered = country.name)}
							onmouseleave={() => (hovered = null)}
						/>
					{/if}
				{/each}
			</g>
		</svg>
		{#if hovered}
			<div class="tooltip">{hovered}</div>
		{/if}
	{/if}
</div>

<style>
	.world-map {
		position: relative;
		width: 100%;
		min-height: 320px;
		display: grid;
		place-items: center;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
	}

	path {
		cursor: pointer;
		transition:
			fill 120ms ease,
			transform 120ms ease;
		transform-box: fill-box;
		transform-origin: center;
	}

	path:hover,
	path:focus-visible {
		fill: #8ecae6;
		outline: none;
	}

	path.selected {
		stroke: #14213d;
		stroke-width: 1.2;
	}

	.tooltip {
		position: absolute;
		left: 16px;
		bottom: 16px;
		border-radius: 6px;
		background: rgba(20, 33, 61, 0.92);
		color: white;
		padding: 7px 10px;
		font-size: 0.88rem;
		font-weight: 700;
	}

	.map-error {
		margin: 0;
		color: #b42318;
		font-weight: 700;
	}
</style>
