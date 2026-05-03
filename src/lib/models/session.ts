import type { ObjectId } from 'mongodb';

export interface Session {
	_id: string;
	userId: ObjectId;
	createdAt: Date;
	expiresAt: Date;
}

export const SESSIONS_COLLECTION = 'sessions';
