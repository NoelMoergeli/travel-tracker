<script lang="ts">
	import type { PublicTripPhoto } from '$lib/models/public';

	interface Props {
		photos: PublicTripPhoto[];
		onSelectPhoto?: (index: number) => void;
	}

	interface GalleryPhoto extends PublicTripPhoto {
		isBroken?: boolean;
	}

	let { photos, onSelectPhoto }: Props = $props();
	let galleryPhotos = $state<GalleryPhoto[]>([]);
	let appliedPhotos = '';

	$effect(() => {
		const nextPhotos = JSON.stringify(photos);
		if (nextPhotos === appliedPhotos) return;

		galleryPhotos = photos.map((photo) => ({ ...photo }));
		appliedPhotos = nextPhotos;
	});
</script>

<div class="photo-grid">
	{#each galleryPhotos as photo, index}
		<figure class="gallery-photo">
			<button
				type="button"
				aria-label={photo.caption ? `Open photo: ${photo.caption}` : 'Open photo'}
				onclick={() => onSelectPhoto?.(index)}
			>
				<img src={photo.url} alt={photo.caption} onerror={() => (photo.isBroken = true)} />
				{#if photo.isBroken}
					<span class="photo-fallback">Image unavailable</span>
				{/if}
			</button>
			{#if photo.caption}
				<figcaption>{photo.caption}</figcaption>
			{/if}
		</figure>
	{/each}
</div>
