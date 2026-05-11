import type { ObjectId } from 'mongodb';

export interface TripPhoto {
	id: string;
	filename: string;
	mimeType: string;
	size: number;
	data: string;
	caption?: string;
	uploadedAt: Date;
}

export interface Trip {
	_id?: ObjectId;
	userId: ObjectId;
	countryCode: string;
	placeName: string;
	dateFrom: string;
	dateTo?: string;
	notes?: string;
	photos?: TripPhoto[];
	createdAt?: Date;
	updatedAt?: Date;
}

export const TRIPS_COLLECTION = 'trips';
