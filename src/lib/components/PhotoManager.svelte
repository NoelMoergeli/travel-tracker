<script lang="ts">
	import type { PublicTripPhoto } from '$lib/models/public';
	import {
		PHOTO_CAPTION_MAX_LENGTH,
		PHOTO_MAX_PER_TRIP,
		photoSource,
		validatePhotoFile
	} from '$lib/photos';

	interface Props {
		photos?: PublicTripPhoto[];
	}

	interface PhotoDraft extends PublicTripPhoto {
		isBroken?: boolean;
	}

	let { photos = [] }: Props = $props();

	let photoRows = $state<PhotoDraft[]>([]);
	let photoFile = $state<File | null>(null);
	let photoCaption = $state('');
	let message = $state('');
	let removedPhoto = $state<PhotoDraft | null>(null);
	let appliedPhotos = '';
	let fileInput = $state<HTMLInputElement>();

	$effect(() => {
		const nextPhotos = JSON.stringify(photos);
		if (nextPhotos === appliedPhotos) return;

		photoRows = photos.map((photo) => ({ ...photo }));
		appliedPhotos = nextPhotos;
	});

	function handleFileChange(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		if (!file) {
			photoFile = null;
			message = '';
			return;
		}

		const validationMessage = validatePhotoFile(file);
		if (validationMessage) {
			photoFile = null;
			message = validationMessage;
			if (fileInput) fileInput.value = '';
			return;
		}

		photoFile = file;
		message = '';
	}

	async function addPhoto(): Promise<void> {
		const caption = photoCaption.trim();

		if (!photoFile) {
			message = 'Choose an image file first.';
			return;
		}

		if (photoRows.length >= PHOTO_MAX_PER_TRIP) {
			message = `Trips can have up to ${PHOTO_MAX_PER_TRIP} photos.`;
			return;
		}

		const validationMessage = validatePhotoFile(photoFile);
		if (validationMessage) {
			message = validationMessage;
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
				filename: photoFile.name,
				mimeType: photoFile.type,
				size: photoFile.size,
				data: await fileToBase64(photoFile),
				caption,
				uploadedAt: new Date().toISOString(),
			}
		];
		photoFile = null;
		photoCaption = '';
		if (fileInput) fileInput.value = '';
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

	async function fileToBase64(file: File): Promise<string> {
		const bytes = new Uint8Array(await file.arrayBuffer());
		let binary = '';
		const chunkSize = 0x8000;

		for (let index = 0; index < bytes.length; index += chunkSize) {
			binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
		}

		return btoa(binary);
	}
</script>

<section class="photo-manager" aria-labelledby="photo-manager-title">
	<div class="section-heading">
		<h2 id="photo-manager-title">Photos</h2>
	</div>

	<div class="photo-manager-block">
		<div class="photo-subheading">
			<h3>Existing photos</h3>
		</div>

		{#if photoRows.length}
			<div class="photo-manager-grid">
				{#each photoRows as photo}
					<article class="managed-photo">
						<input type="hidden" name="photoIds" value={photo.id} />
						<input type="hidden" name="photoFilenames" value={photo.filename} />
						<input type="hidden" name="photoMimeTypes" value={photo.mimeType} />
						<input type="hidden" name="photoSizes" value={photo.size} />
						<input type="hidden" name="photoData" value={photo.data} />
						<input type="hidden" name="photoCaptions" value={photo.caption} />
						<input type="hidden" name="photoUploadedAts" value={photo.uploadedAt} />
						{#if photo.legacyUrl}
							<input type="hidden" name="photoLegacyUrls" value={photo.legacyUrl} />
						{/if}

						<img src={photoSource(photo)} alt={photo.caption} onerror={() => (photo.isBroken = true)} />
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
	</div>

	<div class="photo-manager-block photo-add-block">
		<div class="photo-subheading">
			<h3>Add a photo</h3>
		</div>

		<div class="photo-add-grid">
			<label class="field">
				Photo file
				<input
					bind:this={fileInput}
					class="input file-input"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					onchange={handleFileChange}
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

			<div class="photo-add-actions">
				<button class="button button-primary" type="button" onclick={addPhoto}>Add Photo</button>
				{#if removedPhoto}
					<button class="button button-secondary" type="button" onclick={undoRemovePhoto}>Undo Remove</button>
				{/if}
			</div>
		</div>
	</div>

	{#if message}
		<p class="error">{message}</p>
	{/if}
</section>
