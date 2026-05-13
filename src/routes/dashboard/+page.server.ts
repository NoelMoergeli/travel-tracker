import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { deleteTrip, loadTripsForUser } from '$lib/server/trips';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	return {
		trips: await loadTripsForUser(locals.user.id, { geocodeMissing: true })
	};
};

export const actions: Actions = {
	deleteTrip: async ({ locals, request }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const tripId = String(formData.get('tripId') ?? '');
		const deleted = await deleteTrip(locals.user.id, tripId);

		if (!deleted) {
			return fail(404, { message: 'Trip could not be deleted.' });
		}

		return { deleted: true };
	}
};
