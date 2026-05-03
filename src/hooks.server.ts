import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/db/mongo';
import { COOKIE_NAME } from '$lib/auth/session';
import { SESSIONS_COLLECTION, type Session } from '$lib/models/session';
import { USERS_COLLECTION, type User } from '$lib/models/user';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const sessionId = event.cookies.get(COOKIE_NAME);
	if (!sessionId) return resolve(event);

	try {
		const db = await getDb();
		const session = await db.collection<Session>(SESSIONS_COLLECTION).findOne({ _id: sessionId });

		if (!session || session.expiresAt <= new Date()) {
			event.cookies.delete(COOKIE_NAME, { path: '/' });
			return resolve(event);
		}

		const user = await db.collection<User>(USERS_COLLECTION).findOne({ _id: session.userId });
		if (user?._id) {
			event.locals.user = {
				id: user._id.toString(),
				username: user.username
			};
		}
	} catch (error) {
		console.error('Session load failed', error);
	}

	return resolve(event);
};
