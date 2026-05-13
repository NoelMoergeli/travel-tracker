import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadTripsForUser } from '$lib/server/trips';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	return {
		trips: await loadTripsForUser(locals.user.id)
	};
};
