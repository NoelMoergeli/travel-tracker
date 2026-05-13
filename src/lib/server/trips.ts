import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCountryName } from '$lib/countries';
import { getDb } from '$lib/db/mongo';
import type { PublicTrip, PublicTripPhoto } from '$lib/models/public';
import { TRIPS_COLLECTION, type Trip, type TripCoordinates, type TripPhoto } from '$lib/models/trip';
import { PHOTO_ALLOWED_MIME_TYPES, PHOTO_CAPTION_MAX_LENGTH, PHOTO_MAX_BYTES, PHOTO_MAX_PER_TRIP } from '$lib/photos';
import { buildGeocodingQuery, geocodeTripLocation, type GeocodingLookup } from '$lib/server/geocoding';
import type { TripFieldErrors, TripFormValues } from '$lib/trip-validation';

interface LoadTripsOptions {
	geocodeMissing?: boolean;
}

const GEOCODING_ERROR_RETRY_MS = 24 * 60 * 60 * 1000;

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
		uploadedAt: z.string().trim().optional()
	})
	.superRefine((photo, context) => {
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
		.filter((photo) => photo.id)
		.map((photo) => ({
			id: photo.id,
			filename: photo.filename,
			mimeType: photo.mimeType,
			size: photo.size,
			data: photo.data,
			caption: photo.caption ?? '',
			uploadedAt: dateToIsoString(photo.uploadedAt)
		}));
}

function normalizeTripCoordinates(coordinates: Trip['coordinates']): PublicTrip['coordinates'] {
	if (!coordinates) return null;

	const latitude = Number(coordinates.latitude);
	const longitude = Number(coordinates.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

	return { latitude, longitude };
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
		photos: normalizeTripPhotos(trip.photos),
		coordinates: normalizeTripCoordinates(trip.coordinates)
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

export function photoValuesFromForm(formData: FormData): PublicTripPhoto[] {
	const ids = formData.getAll('photoIds');
	const filenames = formData.getAll('photoFilenames');
	const mimeTypes = formData.getAll('photoMimeTypes');
	const sizes = formData.getAll('photoSizes');
	const data = formData.getAll('photoData');
	const captions = formData.getAll('photoCaptions');
	const uploadedAts = formData.getAll('photoUploadedAts');

	const rowCount = Math.max(
		filenames.length,
		data.length,
		captions.length
	);

	return Array.from({ length: rowCount })
		.map((_, index) => ({
			id: String(ids[index] ?? ''),
			filename: String(filenames[index] ?? ''),
			mimeType: String(mimeTypes[index] ?? ''),
			size: Number(sizes[index] ?? 0),
			data: String(data[index] ?? ''),
			caption: String(captions[index] ?? ''),
			uploadedAt: String(uploadedAts[index] ?? '')
		}))
		.filter((photo) => photo.id || photo.data || photo.caption || photo.uploadedAt);
}

export function photosFromForm(formData: FormData): TripPhoto[] {
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

export async function loadTripsForUser(userId: string, options: LoadTripsOptions = {}): Promise<PublicTrip[]> {
	if (!ObjectId.isValid(userId)) return [];

	const db = await getDb();
	let trips = await db
		.collection<Trip>(TRIPS_COLLECTION)
		.find({ userId: new ObjectId(userId) })
		.sort({ dateFrom: -1, createdAt: -1 })
		.toArray();

	if (options.geocodeMissing) {
		trips = await geocodeMissingTripCoordinates(userId, trips);
	}

	return trips.map(tripToPublic);
}

export async function createTrip(userId: string, formData: FormData): Promise<void> {
	const values = tripValuesFromForm(formData);
	const result = TripFormSchema.safeParse(values);

	if (!result.success) {
		const message = result.error.issues[0]?.message ?? 'Invalid trip details.';
		throw new TripValidationError(message, fieldErrorsFromZod(result.error));
	}

	const db = await getDb();
	const photos = photosFromForm(formData);
	const now = new Date();
	const geocoding = await geocodeTripLocation(result.data.countryCode, result.data.placeName);

	await db.collection<Trip>(TRIPS_COLLECTION).insertOne({
		userId: new ObjectId(userId),
		countryCode: result.data.countryCode.toUpperCase(),
		placeName: result.data.placeName,
		dateFrom: result.data.dateFrom,
		dateTo: result.data.dateTo || undefined,
		notes: result.data.notes || undefined,
		...(photos.length ? { photos } : {}),
		...tripGeocodingFields(geocoding, now),
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
	const photos = photosFromForm(formData);
	const existingTrip = await db.collection<Trip>(TRIPS_COLLECTION).findOne({
		_id: new ObjectId(tripId),
		userId: new ObjectId(userId)
	});

	if (!existingTrip) return false;

	const nextGeocodingQuery = buildGeocodingQuery(result.data.countryCode, result.data.placeName);
	const shouldGeocode =
		existingTrip.countryCode !== result.data.countryCode.toUpperCase() ||
		existingTrip.placeName !== result.data.placeName ||
		existingTrip.geocodingQuery !== nextGeocodingQuery;
	const geocoding = shouldGeocode ? await geocodeTripLocation(result.data.countryCode, result.data.placeName) : null;
	const tripUpdates = {
		countryCode: result.data.countryCode.toUpperCase(),
		placeName: result.data.placeName,
		dateFrom: result.data.dateFrom,
		dateTo: result.data.dateTo || undefined,
		notes: result.data.notes || undefined,
		...(photos.length ? { photos } : {}),
		...(geocoding ? tripGeocodingFields(geocoding, new Date()) : {}),
		updatedAt: new Date()
	};
	const unsetUpdates = {
		...(!photos.length ? { photos: '' } : {}),
		...(geocoding && geocoding.status !== 'found' ? { coordinates: '' } : {})
	};

	const update = await db.collection<Trip>(TRIPS_COLLECTION).updateOne(
		{
			_id: existingTrip._id ?? new ObjectId(tripId),
			userId: new ObjectId(userId)
		},
		{
			$set: tripUpdates,
			...(Object.keys(unsetUpdates).length ? { $unset: unsetUpdates } : {})
		}
	);

	return update.matchedCount > 0;
}

async function geocodeMissingTripCoordinates(userId: string, trips: Trip[]): Promise<Trip[]> {
	const db = await getDb();
	const userObjectId = new ObjectId(userId);

	for (const trip of trips) {
		if (!trip._id || !shouldGeocodeTrip(trip)) continue;

		const lookup = await geocodeTripLocation(trip.countryCode, trip.placeName);
		const now = new Date();
		const geocodingFields = tripGeocodingFields(lookup, now);

		await db.collection<Trip>(TRIPS_COLLECTION).updateOne(
			{ _id: trip._id, userId: userObjectId },
			{
				$set: geocodingFields,
				...(lookup.status !== 'found' ? { $unset: { coordinates: '' } } : {})
			}
		);

		Object.assign(trip, geocodingFields);
		if (lookup.status !== 'found') {
			delete trip.coordinates;
		}
	}

	return trips;
}

function shouldGeocodeTrip(trip: Trip): boolean {
	if (trip.coordinates) return false;

	const query = buildGeocodingQuery(trip.countryCode, trip.placeName);
	if (trip.geocodingQuery !== query || !trip.geocodingStatus) return true;
	if (trip.geocodingStatus !== 'error') return false;

	const geocodedAt = trip.geocodedAt instanceof Date ? trip.geocodedAt : new Date(trip.geocodedAt ?? 0);
	return Number.isNaN(geocodedAt.getTime()) || Date.now() - geocodedAt.getTime() > GEOCODING_ERROR_RETRY_MS;
}

function tripGeocodingFields(lookup: GeocodingLookup, now: Date): Partial<Trip> {
	if (lookup.status === 'found') {
		const coordinates: TripCoordinates = {
			latitude: lookup.result.latitude,
			longitude: lookup.result.longitude,
			source: lookup.result.source,
			query: lookup.result.query,
			updatedAt: now
		};

		return {
			coordinates,
			geocodingStatus: 'found',
			geocodingQuery: lookup.result.query,
			geocodedAt: now
		};
	}

	return {
		geocodingStatus: lookup.status,
		geocodingQuery: lookup.query,
		geocodedAt: now
	};
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
