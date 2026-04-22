import { ObjectId } from 'mongodb';

export interface Trip {
  _id?: ObjectId;
  userId: ObjectId;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g. 'DE')
  placeName: string;
  dateFrom: string; // ISO date string
  dateTo?: string; // ISO date string
  notes?: string;
  images?: string[]; // simple URLs or filenames
  createdAt?: Date;
  updatedAt?: Date;
}

export const TRIPS_COLLECTION = 'trips';

