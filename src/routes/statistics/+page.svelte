<script lang="ts">
	import { createTravelStatistics, type CountBucket, type TripWithDuration } from '$lib/statistics';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const statistics = $derived(createTravelStatistics(data.trips));
	const yearMax = $derived(getMaxCount(statistics.tripsPerYear));
	const continentMax = $derived(getMaxCount(statistics.countriesPerContinent));

	function getMaxCount(buckets: CountBucket[]): number {
		return Math.max(1, ...buckets.map((bucket) => bucket.count));
	}

	function formatDays(days: number): string {
		const rounded = Number.isInteger(days) ? String(days) : days.toFixed(1);
		return `${rounded} ${days === 1 ? 'day' : 'days'}`;
	}

	function formatTripDuration(value: TripWithDuration | null): string {
		return value ? formatDays(value.durationDays) : 'No trips yet';
	}

	function formatTripLabel(value: TripWithDuration | null): string {
		if (!value) return 'Add your first trip to unlock this insight.';
		return `${value.trip.placeName}, ${value.trip.countryName}`;
	}

	function formatDateRange(value: TripWithDuration | null): string {
		if (!value) return '';
		const { trip } = value;
		return trip.dateTo ? `${trip.dateFrom} to ${trip.dateTo}` : trip.dateFrom;
	}

	function barWidth(count: number, max: number): string {
		return `${Math.max(8, (count / max) * 100)}%`;
	}
</script>

<section class="statistics-page">
	<div class="statistics-heading">
		<div>
			<p class="eyebrow">Travel insights</p>
			<h1>Statistics</h1>
			<p>Patterns and milestones from your recorded trips.</p>
		</div>
		<a class="button button-primary" href="/trip/new">Add Trip</a>
	</div>

	{#if data.trips.length}
		<div class="stat-grid" aria-label="Travel key figures">
			<article class="stat-card">
				<span>Total Trips</span>
				<strong>{statistics.totalTrips}</strong>
				<p>{statistics.totalTrips === 1 ? 'recorded journey' : 'recorded journeys'}</p>
			</article>
			<article class="stat-card">
				<span>Countries</span>
				<strong>{statistics.visitedCountryCount}</strong>
				<p>{statistics.visitedCountryCount === 1 ? 'country visited' : 'countries visited'}</p>
			</article>
			<article class="stat-card">
				<span>Continents</span>
				<strong>{statistics.visitedContinentCount}</strong>
				<p>{statistics.visitedContinentCount === 1 ? 'continent reached' : 'continents reached'}</p>
			</article>
			<article class="stat-card">
				<span>Average Duration</span>
				<strong>{formatDays(statistics.averageDurationDays)}</strong>
				<p>per recorded trip</p>
			</article>
		</div>

		<div class="insight-grid">
			<article class="insight-card">
				<p class="eyebrow">Longest trip</p>
				<h2>{formatTripDuration(statistics.longestTrip)}</h2>
				<p>{formatTripLabel(statistics.longestTrip)}</p>
				<span>{formatDateRange(statistics.longestTrip)}</span>
			</article>
			<article class="insight-card">
				<p class="eyebrow">Shortest trip</p>
				<h2>{formatTripDuration(statistics.shortestTrip)}</h2>
				<p>{formatTripLabel(statistics.shortestTrip)}</p>
				<span>{formatDateRange(statistics.shortestTrip)}</span>
			</article>
			<article class="insight-card">
				<p class="eyebrow">Top country</p>
				<h2>{statistics.mostVisitedCountry?.label ?? 'No trips yet'}</h2>
				<p>
					{statistics.mostVisitedCountry
						? `${statistics.mostVisitedCountry.count} ${statistics.mostVisitedCountry.count === 1 ? 'trip' : 'trips'}`
						: 'Add more trips to compare destinations.'}
				</p>
			</article>
		</div>

		<div class="statistics-charts">
			<section class="chart-panel" aria-labelledby="trips-by-year-title">
				<div class="chart-heading">
					<div>
						<p class="eyebrow">Timeline</p>
						<h2 id="trips-by-year-title">Trips per Year</h2>
					</div>
					<span>{statistics.tripsPerYear.length} years</span>
				</div>

				<div class="bar-list">
					{#each statistics.tripsPerYear as bucket}
						<div class="bar-row">
							<span>{bucket.label}</span>
							<div class="bar-track" aria-hidden="true">
								<div class="bar-fill" style={`--bar-width: ${barWidth(bucket.count, yearMax)}`}></div>
							</div>
							<strong>{bucket.count}</strong>
						</div>
					{/each}
				</div>
			</section>

			<section class="chart-panel" aria-labelledby="countries-by-continent-title">
				<div class="chart-heading">
					<div>
						<p class="eyebrow">Reach</p>
						<h2 id="countries-by-continent-title">Countries per Continent</h2>
					</div>
					<span>{statistics.visitedContinentCount} continents</span>
				</div>

				<div class="bar-list">
					{#each statistics.countriesPerContinent as bucket}
						<div class="bar-row">
							<span>{bucket.label}</span>
							<div class="bar-track" aria-hidden="true">
								<div class="bar-fill bar-fill-accent" style={`--bar-width: ${barWidth(bucket.count, continentMax)}`}></div>
							</div>
							<strong>{bucket.count}</strong>
						</div>
					{/each}
				</div>
			</section>
		</div>
	{:else}
		<div class="empty-state empty-state-with-action statistics-empty">
			<div>
				<h2>No trips recorded yet</h2>
				<p>Once you add trips, this page will show your countries, continents, durations, and yearly travel rhythm.</p>
			</div>
			<a class="button button-primary" href="/trip/new">Add Trip</a>
		</div>
	{/if}
</section>
