import type { PublicTripPhoto } from '$lib/models/public';

export const PHOTO_CAPTION_MAX_LENGTH = 160;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_MAX_PER_TRIP = 10;
export const PHOTO_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function validatePhotoFile(file: File): string | null {
	if (!PHOTO_ALLOWED_MIME_TYPES.includes(file.type as (typeof PHOTO_ALLOWED_MIME_TYPES)[number])) {
		return 'Choose a JPEG, PNG, or WebP image.';
	}

	if (file.size > PHOTO_MAX_BYTES) {
		return `Photos must be ${formatBytes(PHOTO_MAX_BYTES)} or smaller.`;
	}

	return null;
}

export function formatBytes(bytes: number): string {
	const megabytes = bytes / (1024 * 1024);
	return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}

export function photoSource(photo: PublicTripPhoto): string {
	return `data:${photo.mimeType};base64,${photo.data}`;
}
