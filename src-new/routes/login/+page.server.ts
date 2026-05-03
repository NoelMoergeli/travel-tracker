import argon2 from 'argon2';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { COOKIE_NAME, createSession } from '$lib/auth/session';
import { getDb } from '$lib/db/mongo';
import { USERS_COLLECTION, type User } from '$lib/models/user';

const LoginSchema = z.object({
	username: z.string().trim().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required')
});

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/dashboard');
};

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		const form = Object.fromEntries(await request.formData());
		const result = LoginSchema.safeParse(form);

		if (!result.success) {
			return fail(400, { message: 'Enter your username and password.' });
		}

		const db = await getDb();
		const user = await db.collection<User>(USERS_COLLECTION).findOne({ username: result.data.username });

		if (!user?._id || !(await argon2.verify(user.passwordHash, result.data.password))) {
			return fail(401, { message: 'Invalid username or password.' });
		}

		const { sessionId, expiresAt } = await createSession(user._id);
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
