export const PHOTO_CAPTION_MAX_LENGTH = 160;
export const IMAGE_URL_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

export function isValidImageUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) && IMAGE_URL_EXTENSIONS.test(url.pathname);
	} catch {
		return false;
	}
}
