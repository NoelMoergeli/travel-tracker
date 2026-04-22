import { ObjectId } from 'mongodb';

export interface Session {
  _id: string; // session id
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export const SESSIONS_COLLECTION = 'sessions';

