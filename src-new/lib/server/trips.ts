import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getCountryName } from '$lib/countries';
import { getDb } from '$lib/db/mongo';
import type { PublicTrip } from '$lib/models/public';
import { TRIPS_COLLECTION, type Trip } from '$lib/models/trip';
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

export interface TripFormValues {
	countryCode: string;
	placeName: string;
	dateFrom: string;
	dateTo: string;
	notes: string;
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
		images: trip.images ?? []
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

export async function createTrip(userId: string, formData: FormData): Promise<void> {
	const values = tripValuesFromForm(formData);
	const result = TripFormSchema.safeParse(values);

	if (!result.success) {
		throw new Error(result.error.issues[0]?.message ?? 'Invalid trip details.');
	}

	const db = await getDb();
	const images = await uploadImages(db, imagesFromForm(formData));
	const now = new Date();

	await db.collection<Trip>(TRIPS_COLLECTION).insertOne({
		userId: new ObjectId(userId),
		countryCode: result.data.countryCode.toUpperCase(),
		placeName: result.data.placeName,
		dateFrom: result.data.dateFrom,
		dateTo: result.data.dateTo || undefined,
		notes: result.data.notes || undefined,
		images,
		createdAt: now,
		updatedAt: now
	});
}
