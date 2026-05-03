import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCountryName } from '$lib/countries';
import { getDb } from '$lib/db/mongo';
import type { PublicTrip, PublicTripPhoto } from '$lib/models/public';
import { TRIPS_COLLECTION, type Trip, type TripPhoto } from '$lib/models/trip';
import { uploadImages } from './uploads';

const PHOTO_CAPTION_MAX_LENGTH = 160;
const IMAGE_URL_EXTENSIONS = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

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

export interface TripFormValues {
	countryCode: string;
	placeName: string;
	dateFrom: string;
	dateTo: string;
	notes: string;
}

export const TripPhotoFormSchema = z.object({
	id: z.string().trim().optional(),
	url: z
		.string()
		.trim()
		.min(1, 'Photo URL is required.')
		.refine(isValidImageUrl, 'Use a direct image URL ending in AVIF, GIF, JPG, PNG, SVG, or WebP.'),
	caption: z.string().trim().max(PHOTO_CAPTION_MAX_LENGTH, 'Photo captions must be 160 characters or fewer.').optional(),
	uploadedAt: z.string().trim().optional()
});

function isValidImageUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol) && IMAGE_URL_EXTENSIONS.test(url.pathname);
	} catch {
		return false;
	}
}

function normalizeTripPhotos(photos: Trip['photos']): PublicTripPhoto[] {
	return (photos ?? []).map((photo) => ({
		id: photo.id,
		url: photo.url,
		caption: photo.caption ?? '',
		uploadedAt: dateToIsoString(photo.uploadedAt)
	}));
}

function dateToIsoString(value: Date): string {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
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
	const urls = formData.getAll('photoUrls');
	const captions = formData.getAll('photoCaptions');
	const uploadedAts = formData.getAll('photoUploadedAts');

	return urls
		.map((value, index) => ({
			id: String(ids[index] ?? ''),
			url: String(value ?? ''),
			caption: String(captions[index] ?? ''),
			uploadedAt: String(uploadedAts[index] ?? '')
		}))
		.filter((photo) => photo.id || photo.url || photo.caption || photo.uploadedAt);
}

export function photosFromForm(formData: FormData): TripPhoto[] {
	return photoValuesFromForm(formData).map((photo) => {
		const result = TripPhotoFormSchema.safeParse(photo);

		if (!result.success) {
			throw new Error(result.error.issues[0]?.message ?? 'Invalid photo details.');
		}

		const uploadedAt = result.data.uploadedAt ? new Date(result.data.uploadedAt) : new Date();

		return {
			id: result.data.id || randomUUID(),
			url: result.data.url,
			caption: result.data.caption || undefined,
			uploadedAt: Number.isNaN(uploadedAt.getTime()) ? new Date() : uploadedAt
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
		throw new Error(result.error.issues[0]?.message ?? 'Invalid trip details.');
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
		throw new Error(result.error.issues[0]?.message ?? 'Invalid trip details.');
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
