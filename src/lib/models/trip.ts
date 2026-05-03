import type { ObjectId } from 'mongodb';

export interface Trip {
	_id?: ObjectId;
	userId: ObjectId;
	countryCode: string;
	placeName: string;
	dateFrom: string;
	dateTo?: string;
	notes?: string;
	images?: string[];
	createdAt?: Date;
	updatedAt?: Date;
}

export const TRIPS_COLLECTION = 'trips';
