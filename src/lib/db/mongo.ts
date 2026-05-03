import dotenv from 'dotenv';
import { Db, MongoClient } from 'mongodb';

dotenv.config({ path: '.env' });

const MONGODB_URI =
	process.env.MONGODB_URI ?? process.env.DB_URI ?? process.env.DB_URL ?? 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB ?? process.env.DB_NAME ?? 'travel-tracker';

declare global {
	var __travel_tracker_mongo__:
		| {
				client: MongoClient;
				db: Db;
		  }
		| undefined;
}

let cached = globalThis.__travel_tracker_mongo__;

export async function connectToDatabase(): Promise<Db> {
	if (cached) return cached.db;

	const client = new MongoClient(MONGODB_URI);
	await client.connect();

	const db = client.db(DB_NAME);
	cached = { client, db };
	globalThis.__travel_tracker_mongo__ = cached;

	return db;
}

export async function getDb(): Promise<Db> {
	return cached?.db ?? connectToDatabase();
}

export async function getClient(): Promise<MongoClient> {
	if (cached) return cached.client;
	await connectToDatabase();
	return cached!.client;
}

export default connectToDatabase;
