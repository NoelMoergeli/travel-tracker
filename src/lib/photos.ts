import type { PublicTripPhoto } from '$lib/models/public';

export const PHOTO_CAPTION_MAX_LENGTH = 160;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_MAX_PER_TRIP = 10;
export const PHOTO_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function photoSource(photo: PublicTripPhoto): string {
	if (photo.mimeType && photo.data) {
		return `data:${photo.mimeType};base64,${photo.data}`;
	}

	return photo.legacyUrl ?? '';
}
