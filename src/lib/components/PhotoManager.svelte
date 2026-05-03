<script lang="ts">
	import type { PublicTripPhoto } from '$lib/models/public';
	import { PHOTO_CAPTION_MAX_LENGTH, isValidImageUrl } from '$lib/photos';

	interface Props {
		photos?: PublicTripPhoto[];
	}

	interface PhotoDraft extends PublicTripPhoto {
		isBroken?: boolean;
	}

	let { photos = [] }: Props = $props();

	let photoRows = $state<PhotoDraft[]>([]);
	let photoUrl = $state('');
	let photoCaption = $state('');
	let message = $state('');
	let removedPhoto = $state<PhotoDraft | null>(null);
	let appliedPhotos = '';

	$effect(() => {
		const nextPhotos = JSON.stringify(photos);
		if (nextPhotos === appliedPhotos) return;

		photoRows = photos.map((photo) => ({ ...photo }));
		appliedPhotos = nextPhotos;
	});

	function addPhoto(): void {
		const url = photoUrl.trim();
		const caption = photoCaption.trim();

		if (!url) {
			message = 'Photo URL is required.';
			return;
		}

		if (!isValidImageUrl(url)) {
			message = 'Use a direct image URL ending in AVIF, GIF, JPG, PNG, SVG, or WebP.';
			return;
		}

		if (caption.length > PHOTO_CAPTION_MAX_LENGTH) {
			message = `Captions must be ${PHOTO_CAPTION_MAX_LENGTH} characters or fewer.`;
			return;
		}

		photoRows = [
			...photoRows,
			{
				id: crypto.randomUUID(),
				url,
				caption,
				uploadedAt: new Date().toISOString()
			}
		];
		photoUrl = '';
		photoCaption = '';
		removedPhoto = null;
		message = '';
	}

	function removePhoto(photoId: string): void {
		removedPhoto = photoRows.find((photo) => photo.id === photoId) ?? null;
		photoRows = photoRows.filter((photo) => photo.id !== photoId);
		message = 'Photo removed. Save changes to confirm, or undo before saving.';
	}

	function undoRemovePhoto(): void {
		if (!removedPhoto) return;

		if (!photoRows.some((photo) => photo.id === removedPhoto?.id)) {
			photoRows = [...photoRows, removedPhoto];
		}

		removedPhoto = null;
		message = '';
	}
</script>

<section class="photo-manager" aria-labelledby="photo-manager-title">
	<div class="section-heading">
		<h2 id="photo-manager-title">Photos</h2>
	</div>

	{#if photoRows.length}
		<div class="photo-manager-grid">
			{#each photoRows as photo}
				<article class="managed-photo">
					<input type="hidden" name="photoIds" value={photo.id} />
					<input type="hidden" name="photoUrls" value={photo.url} />
					<input type="hidden" name="photoCaptions" value={photo.caption} />
					<input type="hidden" name="photoUploadedAts" value={photo.uploadedAt} />

					<img src={photo.url} alt={photo.caption} onerror={() => (photo.isBroken = true)} />
					{#if photo.isBroken}
						<div class="photo-fallback">Image unavailable</div>
					{/if}

					<div>
						<p>{photo.caption || 'No caption'}</p>
						<button class="button button-danger" type="button" onclick={() => removePhoto(photo.id)}>
							Remove Photo
						</button>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<p class="photo-empty">No gallery photos yet.</p>
	{/if}

	<div class="photo-add-grid">
		<label class="field">
			Photo URL
			<input
				class="input"
				type="url"
				bind:value={photoUrl}
				placeholder="https://example.com/photo.jpg"
			/>
		</label>

		<label class="field">
			Caption
			<input
				class="input"
				bind:value={photoCaption}
				maxlength={PHOTO_CAPTION_MAX_LENGTH}
				placeholder="Optional caption"
			/>
		</label>
	</div>

	<div class="photo-manager-actions">
		<button class="button button-secondary" type="button" onclick={addPhoto}>Add Photo</button>
		{#if removedPhoto}
			<button class="button button-secondary" type="button" onclick={undoRemovePhoto}>Undo Remove</button>
		{/if}
	</div>

	{#if message}
		<p class="error">{message}</p>
	{/if}
</section>
