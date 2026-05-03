<script lang="ts">
	import type { PublicTripPhoto } from '$lib/models/public';

	interface Props {
		photos?: PublicTripPhoto[];
	}

	interface PhotoDraft extends PublicTripPhoto {
		isBroken?: boolean;
	}

	const CAPTION_MAX_LENGTH = 160;
	const IMAGE_URL_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

	let { photos = [] }: Props = $props();

	let photoRows = $state<PhotoDraft[]>([]);
	let photoUrl = $state('');
	let photoCaption = $state('');
	let message = $state('');
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

		if (caption.length > CAPTION_MAX_LENGTH) {
			message = `Captions must be ${CAPTION_MAX_LENGTH} characters or fewer.`;
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
		message = '';
	}

	function removePhoto(photoId: string): void {
		photoRows = photoRows.filter((photo) => photo.id !== photoId);
		message = '';
	}

	function isValidImageUrl(value: string): boolean {
		try {
			const url = new URL(value);
			return ['http:', 'https:'].includes(url.protocol) && IMAGE_URL_EXTENSIONS.test(url.pathname);
		} catch {
			return false;
		}
	}
</script>

<section class="photo-manager" aria-labelledby="photo-manager-title">
	<div class="section-heading">
		<h2 id="photo-manager-title">Photos</h2>
		<p>Add direct image URLs and optional captions for this trip.</p>
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
							Delete Photo
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
				maxlength={CAPTION_MAX_LENGTH}
				placeholder="Optional caption"
			/>
		</label>
	</div>

	<button class="button button-secondary" type="button" onclick={addPhoto}>Add Photo</button>

	{#if message}
		<p class="error">{message}</p>
	{/if}
</section>
