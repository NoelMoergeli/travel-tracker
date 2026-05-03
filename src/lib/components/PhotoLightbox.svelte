<script lang="ts">
	import type { PublicTripPhoto } from '$lib/models/public';

	interface Props {
		photos: PublicTripPhoto[];
		initialIndex?: number;
		onClose: () => void;
	}

	let { photos, initialIndex = 0, onClose }: Props = $props();
	let currentIndex = $state(0);
	let brokenPhotoIds = $state<string[]>([]);
	let appliedInitialIndex = -1;

	const currentPhoto = $derived(photos[currentIndex]);
	const hasMultiplePhotos = $derived(photos.length > 1);

	$effect(() => {
		if (initialIndex === appliedInitialIndex && currentIndex < photos.length) return;

		currentIndex = Math.min(Math.max(initialIndex, 0), Math.max(photos.length - 1, 0));
		appliedInitialIndex = initialIndex;
	});

	function showPrevious(): void {
		currentIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
	}

	function showNext(): void {
		currentIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			onClose();
		}

		if (event.key === 'ArrowLeft' && hasMultiplePhotos) {
			showPrevious();
		}

		if (event.key === 'ArrowRight' && hasMultiplePhotos) {
			showNext();
		}
	}

	function markPhotoBroken(photoId: string): void {
		if (brokenPhotoIds.includes(photoId)) return;
		brokenPhotoIds = [...brokenPhotoIds, photoId];
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if currentPhoto}
	<div class="photo-lightbox-layer" role="dialog" aria-modal="true" aria-label="Photo slideshow">
		<button class="photo-lightbox-backdrop" type="button" aria-label="Close slideshow" onclick={onClose}></button>

		<div class="photo-lightbox">
			<button class="photo-lightbox-close" type="button" onclick={onClose}>Close</button>

			{#if hasMultiplePhotos}
				<button class="photo-lightbox-nav photo-lightbox-prev" type="button" onclick={showPrevious}>
					Previous
				</button>
				<button class="photo-lightbox-nav photo-lightbox-next" type="button" onclick={showNext}>
					Next
				</button>
			{/if}

			{#if brokenPhotoIds.includes(currentPhoto.id)}
				<div class="photo-lightbox-fallback">Image unavailable</div>
			{:else}
				<img src={currentPhoto.url} alt={currentPhoto.caption} onerror={() => markPhotoBroken(currentPhoto.id)} />
			{/if}

			<div class="photo-lightbox-caption">
				{#if currentPhoto.caption}
					<p>{currentPhoto.caption}</p>
				{/if}
				<span>{currentIndex + 1} / {photos.length}</span>
			</div>
		</div>
	</div>
{/if}
