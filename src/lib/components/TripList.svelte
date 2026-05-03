<script lang="ts">
	import type { PublicTrip } from '$lib/models/public';
	import TripCard from './TripCard.svelte';

	interface Props {
		trips: PublicTrip[];
		emptyMessage: string;
		onViewGallery: (trip: PublicTrip) => void;
		onDelete: (trip: PublicTrip) => void;
	}

	let { trips, emptyMessage, onViewGallery, onDelete }: Props = $props();
</script>

<div class="trip-list" aria-label="Past trips">
	{#if trips.length}
		{#each trips as trip}
			<TripCard
				{trip}
				onViewGallery={() => onViewGallery(trip)}
				onDelete={() => onDelete(trip)}
			/>
		{/each}
	{:else}
		<div class="empty-state">
			<h2>No trips yet</h2>
			<p>{emptyMessage}</p>
		</div>
	{/if}
</div>
