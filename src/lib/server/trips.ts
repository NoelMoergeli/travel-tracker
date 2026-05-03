import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCountryName } from '$lib/countries';
import { getDb } from '$lib/db/mongo';
import type { PublicTrip, PublicTripPhoto } from '$lib/models/public';
import { TRIPS_COLLECTION, type LegacyTripPhoto, type StoredTripPhoto, type Trip, type TripPhoto } from '$lib/models/trip';
import { PHOTO_ALLOWED_MIME_TYPES, PHOTO_CAPTION_MAX_LENGTH, PHOTO_MAX_BYTES, PHOTO_MAX_PER_TRIP } from '$lib/photos';
import type { TripFieldErrors, TripFormValues } from '$lib/trip-validation';
import { uploadImages } from './uploads';

export const TripFormSchema = z
	.object({
		countryCode: z.string().trim().min(2, 'Country is required').max(2, 'Use an ISO alpha-2 country code'),
		placeName: z.string().trim().min(1, 'Place is required'),
		dateFrom: z.string().trim().min(1, 'Start date is required'),
		dateTo: z.string().trim().optional(),
		notes: z.string().trim().optional()
	})
	.refine((data) => !data.dateTo || data.dateTo >= data.dateFrom, {
		message: 'End date must be after the start date',
		path: ['dateTo']
	});

const tripErrorFields = new Set<keyof TripFieldErrors>([
	'countryCode',
	'placeName',
	'dateFrom',
	'dateTo',
	'notes',
	'photos'
]);

export class TripValidationError extends Error {
	constructor(
		message: string,
		public errors: TripFieldErrors
	) {
		super(message);
		this.name = 'TripValidationError';
	}
}

export const TripPhotoFormSchema = z
	.object({
		id: z.string().trim().optional(),
		filename: z.string().trim().optional(),
		mimeType: z.string().trim().optional(),
		size: z.coerce.number().optional(),
		data: z.string().trim().optional(),
		caption: z.string().trim().max(PHOTO_CAPTION_MAX_LENGTH, 'Photo captions must be 160 characters or fewer.').optional(),
		uploadedAt: z.string().trim().optional(),
		legacyUrl: z.string().trim().optional()
	})
	.superRefine((photo, context) => {
		if (photo.legacyUrl && !photo.data) return;

		if (!photo.filename) {
			context.addIssue({ code: z.ZodIssueCode.custom, message: 'Photo filename is required.', path: ['filename'] });
		}

		if (!photo.mimeType || !PHOTO_ALLOWED_MIME_TYPES.includes(photo.mimeType as (typeof PHOTO_ALLOWED_MIME_TYPES)[number])) {
			context.addIssue({ code: z.ZodIssueCode.custom, message: 'Only JPEG, PNG, and WebP photos are supported.', path: ['mimeType'] });
		}

		if (!photo.size || photo.size <= 0 || photo.size > PHOTO_MAX_BYTES) {
			context.addIssue({ code: z.ZodIssueCode.custom, message: 'Each photo must be 2 MB or smaller.', path: ['size'] });
		}

		if (!photo.data) {
			context.addIssue({ code: z.ZodIssueCode.custom, message: 'Photo data is required.', path: ['data'] });
		}
	});

function normalizeTripPhotos(photos: Trip['photos']): PublicTripPhoto[] {
	return (photos ?? [])
		.filter((photo) => photo.id && (isTripPhoto(photo) || isLegacyTripPhoto(photo)))
		.map((photo) => ({
			id: photo.id,
			filename: isTripPhoto(photo) ? photo.filename : 'External image',
			mimeType: isTripPhoto(photo) ? photo.mimeType : '',
			size: isTripPhoto(photo) ? photo.size : 0,
			data: isTripPhoto(photo) ? photo.data : '',
			caption: photo.caption ?? '',
			uploadedAt: dateToIsoString(photo.uploadedAt),
			...(isLegacyTripPhoto(photo) ? { legacyUrl: photo.url } : {})
		}));
}

function isTripPhoto(photo: StoredTripPhoto): photo is TripPhoto {
	return 'data' in photo && 'mimeType' in photo && 'filename' in photo;
}

function isLegacyTripPhoto(photo: StoredTripPhoto): photo is LegacyTripPhoto {
	return 'url' in photo;
}

function dateToIsoString(value: Date): string {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function fieldErrorsFromZod(error: z.ZodError): TripFieldErrors {
	const errors: TripFieldErrors = {};

	for (const issue of error.issues) {
		const field = issue.path[0];
		if (typeof field !== 'string' || !tripErrorFields.has(field as keyof TripFieldErrors)) continue;
		const key = field as keyof TripFieldErrors;
		if (errors[key]) continue;
		errors[key] = issue.message;
	}

	return errors;
}

export function tripToPublic(trip: Trip): PublicTrip {
	return {
		id: trip._id?.toString() ?? '',
		countryCode: trip.countryCode.toUpperCase(),
		countryName: getCountryName(trip.countryCode),
		placeName: trip.placeName,
		dateFrom: trip.dateFrom,
		dateTo: trip.dateTo ?? '',
		notes: trip.notes ?? '',
		images: trip.images ?? [],
		photos: normalizeTripPhotos(trip.photos)
	};
}

export function tripValuesFromForm(formData: FormData): TripFormValues {
	return {
		countryCode: String(formData.get('countryCode') ?? '').toUpperCase(),
		placeName: String(formData.get('placeName') ?? ''),
		dateFrom: String(formData.get('dateFrom') ?? ''),
		dateTo: String(formData.get('dateTo') ?? ''),
		notes: String(formData.get('notes') ?? '')
	};
}

export function imagesFromForm(formData: FormData): File[] {
	return formData
		.getAll('images')
		.filter((value): value is File => value instanceof File && value.size > 0);
}

export function existingImagesFromForm(formData: FormData): string[] {
	return formData
		.getAll('existingImages')
		.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export function photoValuesFromForm(formData: FormData): PublicTripPhoto[] {
	const ids = formData.getAll('photoIds');
	const filenames = formData.getAll('photoFilenames');
	const mimeTypes = formData.getAll('photoMimeTypes');
	const sizes = formData.getAll('photoSizes');
	const data = formData.getAll('photoData');
	const captions = formData.getAll('photoCaptions');
	const uploadedAts = formData.getAll('photoUploadedAts');
	const legacyUrls = formData.getAll('photoLegacyUrls').length
		? formData.getAll('photoLegacyUrls')
		: formData.getAll('photoUrls');

	const rowCount = Math.max(
		filenames.length,
		data.length,
		captions.length,
		legacyUrls.length
	);

	return Array.from({ length: rowCount })
		.map((_, index) => ({
			id: String(ids[index] ?? ''),
			filename: String(filenames[index] ?? ''),
			mimeType: String(mimeTypes[index] ?? ''),
			size: Number(sizes[index] ?? 0),
			data: String(data[index] ?? ''),
			caption: String(captions[index] ?? ''),
			uploadedAt: String(uploadedAts[index] ?? ''),
			legacyUrl: String(legacyUrls[index] ?? '') || undefined
		}))
		.filter((photo) => photo.id || photo.data || photo.legacyUrl || photo.caption || photo.uploadedAt);
}

export function photosFromForm(formData: FormData): StoredTripPhoto[] {
	const photoValues = photoValuesFromForm(formData);

	if (photoValues.length > PHOTO_MAX_PER_TRIP) {
		throw new TripValidationError(`Trips can have up to ${PHOTO_MAX_PER_TRIP} photos.`, {
			photos: `Trips can have up to ${PHOTO_MAX_PER_TRIP} photos.`
		});
	}

	return photoValues.map((photo) => {
		const result = TripPhotoFormSchema.safeParse(photo);

		if (!result.success) {
			const message = result.error.issues[0]?.message ?? 'Invalid photo details.';
			throw new TripValidationError(message, { photos: message });
		}

		const uploadedAt = result.data.uploadedAt ? new Date(result.data.uploadedAt) : new Date();
		const normalizedUploadedAt = Number.isNaN(uploadedAt.getTime()) ? new Date() : uploadedAt;

		if (result.data.legacyUrl && !result.data.data) {
			return {
				id: result.data.id || randomUUID(),
				url: result.data.legacyUrl,
				caption: result.data.caption || undefined,
				uploadedAt: normalizedUploadedAt
			};
		}

		return {
			id: result.data.id || randomUUID(),
			filename: result.data.filename || 'photo',
			mimeType: result.data.mimeType ?? 'image/jpeg',
			size: result.data.size ?? 0,
			data: result.data.data ?? '',
			caption: result.data.caption || undefined,
			uploadedAt: normalizedUploadedAt
		};
	});
}

export async function loadTripForUser(userId: string, tripId: string): Promise<PublicTrip | null> {
	if (!ObjectId.isValid(tripId)) return null;

	const db = await getDb();
	const trip = await db.collection<Trip>(TRIPS_COLLECTION).findOne({
		_id: new ObjectId(tripId),
		userId: new ObjectId(userId)
	});

	return trip ? tripToPublic(trip) : null;
}

export async function createTrip(userId: string, formData: FormData): Promise<void> {
	const values = tripValuesFromForm(formData);
	const result = TripFormSchema.safeParse(values);

	if (!result.success) {
		const message = result.error.issues[0]?.message ?? 'Invalid trip details.';
		throw new TripValidationError(message, fieldErrorsFromZod(result.error));
	}

	const db = await getDb();
	const images = await uploadImages(db, imagesFromForm(formData));
	const photos = photosFromForm(formData);
	const now = new Date();

	await db.collection<Trip>(TRIPS_COLLECTION).insertOne({
		userId: new ObjectId(userId),
		countryCode: result.data.countryCode.toUpperCase(),
		placeName: result.data.placeName,
		dateFrom: result.data.dateFrom,
		dateTo: result.data.dateTo || undefined,
		notes: result.data.notes || undefined,
		images,
		...(photos.length ? { photos } : {}),
		createdAt: now,
		updatedAt: now
	});
}

export async function updateTrip(userId: string, tripId: string, formData: FormData): Promise<boolean> {
	if (!ObjectId.isValid(tripId)) return false;

	const values = tripValuesFromForm(formData);
	const result = TripFormSchema.safeParse(values);

	if (!result.success) {
		const message = result.error.issues[0]?.message ?? 'Invalid trip details.';
		throw new TripValidationError(message, fieldErrorsFromZod(result.error));
	}

	const db = await getDb();
	const newImages = await uploadImages(db, imagesFromForm(formData));
	const images = [...existingImagesFromForm(formData), ...newImages];
	const photos = photosFromForm(formData);
	const tripUpdates = {
		countryCode: result.data.countryCode.toUpperCase(),
		placeName: result.data.placeName,
		dateFrom: result.data.dateFrom,
		dateTo: result.data.dateTo || undefined,
		notes: result.data.notes || undefined,
		images,
		...(photos.length ? { photos } : {}),
		updatedAt: new Date()
	};

	const update = await db.collection<Trip>(TRIPS_COLLECTION).updateOne(
		{
			_id: new ObjectId(tripId),
			userId: new ObjectId(userId)
		},
		{
			$set: tripUpdates,
			...(!photos.length ? { $unset: { photos: '' } } : {})
		}
	);

	return update.matchedCount > 0;
}

export async function deleteTrip(userId: string, tripId: string): Promise<boolean> {
	if (!ObjectId.isValid(tripId)) return false;

	const db = await getDb();
	const result = await db.collection<Trip>(TRIPS_COLLECTION).deleteOne({
		_id: new ObjectId(tripId),
		userId: new ObjectId(userId)
	});

	return result.deletedCount > 0;
}
