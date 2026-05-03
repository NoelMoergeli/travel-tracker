import { redirect, type RequestHandler } from '@sveltejs/kit';
import { COOKIE_NAME, deleteSession } from '$lib/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get(COOKIE_NAME);
	if (sessionId) await deleteSession(sessionId);

	cookies.delete(COOKIE_NAME, { path: '/' });
	throw redirect(303, '/login');
};
