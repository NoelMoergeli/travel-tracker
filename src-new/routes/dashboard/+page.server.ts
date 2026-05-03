import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ObjectId } from 'mongodb';
import { getDb } from '$lib/db/mongo';
import { TRIPS_COLLECTION, type Trip } from '$lib/models/trip';
import { deleteTrip, tripToPublic } from '$lib/server/trips';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = await getDb();
	const trips = await db
		.collection<Trip>(TRIPS_COLLECTION)
		.find({ userId: new ObjectId(locals.user.id) })
		.sort({ dateFrom: -1, createdAt: -1 })
		.toArray();

	return {
		trips: trips.map(tripToPublic)
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
