<script lang="ts">
	import type { PublicTrip } from '$lib/models/public';
	import TripCard from './TripCard.svelte';

	interface Props {
		trips: PublicTrip[];
		emptyMessage: string;
		recordTripHref?: string;
		onViewGallery: (trip: PublicTrip) => void;
		onDelete: (trip: PublicTrip) => void;
	}

	let { trips, emptyMessage, recordTripHref, onViewGallery, onDelete }: Props = $props();
</script>

<div class="trip-list" aria-label="Past trips">
	{#if trips.length}
		{#if recordTripHref}
			<a class="button button-primary trip-list-record-button" href={recordTripHref}>
				Record Trip
			</a>
		{/if}
		{#each trips as trip}
			<TripCard
				{trip}
				onViewGallery={() => onViewGallery(trip)}
				onDelete={() => onDelete(trip)}
			/>
		{/each}
	{:else}
		<div class="empty-state" class:empty-state-with-action={recordTripHref}>
			<div>
				<h2>No trips yet</h2>
				<p>{emptyMessage}</p>
			</div>
			{#if recordTripHref}
				<a class="button button-primary" href={recordTripHref}>Record Trip</a>
			{/if}
		</div>
	{/if}
</div>
