<script lang="ts">
	import { onMount } from 'svelte';
	import { geoMercator, geoPath } from 'd3-geo';
	import { feature } from 'topojson-client';
	import { getCountryCode } from '$lib/countries';
	import type { PublicTrip } from '$lib/models/public';

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
		trips?: PublicTrip[];
		selected?: string | null;
		width?: number;
		height?: number;
		onSelectCountry?: (country: { code: string; name: string }) => void;
	}

	let {
		visited = [],
		trips = [],
		selected = null,
		width = 920,
		height = 520,
		onSelectCountry
	}: Props = $props();

	let countries = $state<MapCountry[]>([]);
	let hovered = $state<string | null>(null);
	let error = $state<string | null>(null);
	let svgElement = $state<SVGSVGElement | null>(null);
	let zoom = $state(1);
	let pan = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	let lastPointer = $state<{ x: number; y: number } | null>(null);
	let dragDistance = $state(0);
	let suppressCountryClick = $state(false);
	let activePointerId = $state<number | null>(null);

	const visitedSet = $derived(new Set(visited.map((code) => code.toUpperCase())));
	const selectedCode = $derived(selected?.toUpperCase() ?? null);
	const projection = $derived(geoMercator().scale(width / 6.7).translate([width / 2, height / 1.62]));
	const path = $derived(geoPath(projection));
	const mapTransform = $derived(`translate(${pan.x} ${pan.y}) scale(${zoom})`);
	const tripPins = $derived.by(() =>
		trips
			.map((trip) => {
				if (!trip.coordinates) return null;
				const projected = projection([trip.coordinates.longitude, trip.coordinates.latitude]);
				if (!projected) return null;

				return {
					trip,
					x: projected[0],
					y: projected[1]
				};
			})
			.filter((pin): pin is { trip: PublicTrip; x: number; y: number } => Boolean(pin))
	);

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
		if (suppressCountryClick) return;
		if (!country.code) return;
		onSelectCountry?.({ code: country.code, name: country.name });
	}

	function selectTripPin(trip: PublicTrip): void {
		if (suppressCountryClick) return;
		onSelectCountry?.({ code: trip.countryCode, name: trip.countryName });
	}

	function clamp(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, value));
	}

	function clampPan(nextPan: { x: number; y: number }, nextZoom = zoom): { x: number; y: number } {
		if (nextZoom <= 1) return { x: 0, y: 0 };

		return {
			x: clamp(nextPan.x, width - width * nextZoom, 0),
			y: clamp(nextPan.y, height - height * nextZoom, 0)
		};
	}

	function pointFromEvent(event: PointerEvent | WheelEvent): { x: number; y: number } | null {
		if (!svgElement) return null;

		const rect = svgElement.getBoundingClientRect();
		if (!rect.width || !rect.height) return null;

		return {
			x: ((event.clientX - rect.left) / rect.width) * width,
			y: ((event.clientY - rect.top) / rect.height) * height
		};
	}

	function zoomAt(point: { x: number; y: number }, nextZoom: number): void {
		const clampedZoom = clamp(nextZoom, 1, 6);
		const mapPoint = {
			x: (point.x - pan.x) / zoom,
			y: (point.y - pan.y) / zoom
		};

		zoom = clampedZoom;
		pan = clampPan(
			{
				x: point.x - mapPoint.x * clampedZoom,
				y: point.y - mapPoint.y * clampedZoom
			},
			clampedZoom
		);
	}

	function handleWheel(event: WheelEvent): void {
		event.preventDefault();
		const point = pointFromEvent(event);
		if (!point) return;

		zoomAt(point, zoom * Math.exp(-event.deltaY * 0.0015));
	}

	function zoomFromCenter(multiplier: number): void {
		zoomAt({ x: width / 2, y: height / 2 }, zoom * multiplier);
	}

	function resetView(): void {
		zoom = 1;
		pan = { x: 0, y: 0 };
	}

	function startPan(event: PointerEvent): void {
		if (event.button !== 0) return;

		const point = pointFromEvent(event);
		if (!point) return;

		isDragging = false;
		lastPointer = point;
		dragDistance = 0;
		activePointerId = event.pointerId;
	}

	function movePan(event: PointerEvent): void {
		if (activePointerId !== event.pointerId || !lastPointer) return;

		const point = pointFromEvent(event);
		if (!point) return;

		const deltaX = point.x - lastPointer.x;
		const deltaY = point.y - lastPointer.y;
		dragDistance += Math.hypot(deltaX, deltaY);

		if (dragDistance > 8 && !isDragging) {
			isDragging = true;
			suppressCountryClick = true;
			svgElement?.setPointerCapture(event.pointerId);
		}

		if (isDragging) {
			pan = clampPan({ x: pan.x + deltaX, y: pan.y + deltaY });
		}

		lastPointer = point;
	}

	function endPan(event: PointerEvent): void {
		if (activePointerId !== event.pointerId) return;

		isDragging = false;
		lastPointer = null;
		activePointerId = null;
		if (svgElement?.hasPointerCapture(event.pointerId)) {
			svgElement.releasePointerCapture(event.pointerId);
		}

		window.setTimeout(() => {
			suppressCountryClick = false;
		}, 0);
	}
</script>

<div class="world-map">
	{#if error}
		<p class="map-error">{error}</p>
	{:else}
		<div class="map-controls" aria-label="Map zoom controls">
			<button type="button" aria-label="Zoom in" onclick={() => zoomFromCenter(1.35)}>+</button>
			<button type="button" aria-label="Zoom out" onclick={() => zoomFromCenter(1 / 1.35)}>-</button>
			<button type="button" aria-label="Reset map view" onclick={resetView}>Reset</button>
		</div>
		<svg
			bind:this={svgElement}
			{width}
			{height}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label="Interactive world map"
			onwheel={handleWheel}
			onpointerdown={startPan}
			onpointermove={movePan}
			onpointerup={endPan}
			onpointercancel={endPan}
			class:dragging={isDragging}
		>
			<g transform={mapTransform}>
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
				{#each tripPins as pin (pin.trip.id)}
					<g
						class="trip-pin"
						transform={`translate(${pin.x} ${pin.y})`}
						tabindex="0"
						role="button"
						aria-label={`Trip to ${pin.trip.placeName}, ${pin.trip.countryName}`}
						onclick={() => selectTripPin(pin.trip)}
						onkeydown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') selectTripPin(pin.trip);
						}}
						onmouseenter={() => (hovered = `${pin.trip.placeName}, ${pin.trip.countryName}`)}
						onmouseleave={() => (hovered = null)}
						onfocus={() => (hovered = `${pin.trip.placeName}, ${pin.trip.countryName}`)}
						onblur={() => (hovered = null)}
					>
						<circle class="trip-pin-shadow" r={9 / zoom}></circle>
						<circle class="trip-pin-dot" r={5.2 / zoom}></circle>
						<circle class="trip-pin-core" r={2.1 / zoom}></circle>
					</g>
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
		overflow: hidden;
		touch-action: none;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		cursor: grab;
		user-select: none;
	}

	svg.dragging {
		cursor: grabbing;
	}

	g {
		transition: transform 90ms ease-out;
	}

	svg.dragging g {
		transition: none;
	}

	path {
		cursor: pointer;
		outline: none;
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

	path:focus {
		outline: none;
	}

	path.selected {
		stroke: #14213d;
		stroke-width: 1.2;
	}

	.trip-pin {
		outline: none;
		pointer-events: auto;
	}

	.trip-pin-shadow {
		fill: rgba(20, 33, 61, 0.22);
	}

	.trip-pin-dot {
		fill: #ffb703;
		stroke: #14213d;
		stroke-width: 1.7;
		vector-effect: non-scaling-stroke;
	}

	.trip-pin-core {
		fill: #14213d;
	}

	.trip-pin:hover .trip-pin-dot,
	.trip-pin:focus-visible .trip-pin-dot {
		fill: #8ecae6;
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
		pointer-events: none;
	}

	.map-error {
		margin: 0;
		color: #b42318;
		font-weight: 700;
	}

	.map-controls {
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 2;
		display: inline-flex;
		gap: 6px;
		border: 1px solid #d9e1ea;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.92);
		padding: 6px;
		box-shadow: 0 12px 30px rgba(20, 33, 61, 0.12);
	}

	.map-controls button {
		min-width: 34px;
		min-height: 34px;
		border: 1px solid #c5d0dc;
		border-radius: 6px;
		background: white;
		color: #14213d;
		padding: 6px 9px;
		font-weight: 800;
		cursor: pointer;
	}

	.map-controls button:hover,
	.map-controls button:focus-visible {
		border-color: #176b87;
		color: #176b87;
		outline: none;
	}

	@media (max-width: 720px) {
		.map-controls {
			top: 10px;
			right: 10px;
		}

		.map-controls button {
			min-width: 32px;
			min-height: 32px;
			padding: 5px 8px;
		}
	}
</style>
