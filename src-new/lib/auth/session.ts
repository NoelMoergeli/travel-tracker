import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '$lib/db/mongo';
import { SESSIONS_COLLECTION, type Session } from '$lib/models/session';

export const COOKIE_NAME = process.env.COOKIE_NAME ?? 'sessionId';

const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? '30');

export async function createSession(userId: ObjectId): Promise<{ sessionId: string; expiresAt: Date }> {
	const db = await getDb();
	const sessionId = uuidv4();
	const createdAt = new Date();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

	await db.collection<Session>(SESSIONS_COLLECTION).insertOne({
		_id: sessionId,
		userId,
		createdAt,
		expiresAt
	});

	return { sessionId, expiresAt };
}

export async function getSession(sessionId: string | undefined): Promise<Session | null> {
	if (!sessionId) return null;

	const db = await getDb();
	return db.collection<Session>(SESSIONS_COLLECTION).findOne({ _id: sessionId });
}

export async function deleteSession(sessionId: string): Promise<void> {
	const db = await getDb();
	await db.collection<Session>(SESSIONS_COLLECTION).deleteOne({ _id: sessionId });
}
