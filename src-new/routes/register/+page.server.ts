import argon2 from 'argon2';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { COOKIE_NAME, createSession } from '$lib/auth/session';
import { getDb } from '$lib/db/mongo';
import { USERS_COLLECTION, type User } from '$lib/models/user';

const RegisterSchema = z.object({
	username: z.string().trim().min(3, 'Username must be at least 3 characters'),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
};

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		const form = Object.fromEntries(await request.formData());
		const result = RegisterSchema.safeParse(form);

		if (!result.success) {
			return fail(400, { message: result.error.issues[0]?.message ?? 'Invalid account details.' });
		}

		const db = await getDb();
		const existing = await db
			.collection<User>(USERS_COLLECTION)
			.findOne({ username: result.data.username });

		if (existing) {
			return fail(409, { message: 'That username is already taken.' });
		}

		const passwordHash = await argon2.hash(result.data.password);
		const insert = await db.collection<User>(USERS_COLLECTION).insertOne({
			username: result.data.username,
			passwordHash,
			createdAt: new Date()
		});

		const { sessionId, expiresAt } = await createSession(insert.insertedId);
		cookies.set(COOKIE_NAME, sessionId, {
			httpOnly: true,
			path: '/',
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			expires: expiresAt
		});

		throw redirect(303, '/dashboard');
	}
};
