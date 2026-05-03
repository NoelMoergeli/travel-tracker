<script lang="ts">
	import type { PublicTrip } from '$lib/models/public';

	interface Props {
		trip: PublicTrip;
		onViewGallery: () => void;
		onDelete: () => void;
	}

	let { trip, onViewGallery, onDelete }: Props = $props();
	let previewBroken = $state(false);

	const previewPhoto = $derived(trip.photos[0]);

	function formatRange(dateFrom: string, dateTo: string): string {
		return dateTo ? `${dateFrom} to ${dateTo}` : dateFrom;
	}
</script>

<article class="trip-card">
	{#if previewPhoto}
		<button class="trip-photo-preview" type="button" onclick={onViewGallery}>
			{#if previewBroken}
				<span class="trip-photo-fallback">Image unavailable</span>
			{:else}
				<img
					src={previewPhoto.url}
					alt={previewPhoto.caption || `${trip.placeName} photo`}
					onerror={() => (previewBroken = true)}
				/>
			{/if}
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
			<button class="button button-secondary" type="button" onclick={onViewGallery}>
				View Gallery
			</button>
		{/if}
		<a class="button button-secondary" href={`/trip/${trip.id}/edit`}>Edit</a>
		<button class="button button-danger" type="button" onclick={onDelete}>
			Delete
		</button>
	</div>
</article>
