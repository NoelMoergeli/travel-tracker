import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	TripValidationError,
	loadTripForUser,
	photoValuesFromForm,
	tripValuesFromForm,
	updateTrip
} from '$lib/server/trips';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(302, '/login');

	const trip = await loadTripForUser(locals.user.id, params.id);
	if (!trip) throw error(404, 'Trip not found');

	return { trip };
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		let updated = false;

		try {
			updated = await updateTrip(locals.user.id, params.id, formData);
		} catch (updateError) {
			const validationErrors = updateError instanceof TripValidationError ? updateError.errors : {};

			return fail(400, {
				message: updateError instanceof Error ? updateError.message : 'Unable to update trip.',
				errors: validationErrors,
				values: tripValuesFromForm(formData),
				images: formData
					.getAll('existingImages')
					.filter((value): value is string => typeof value === 'string'),
				photos: photoValuesFromForm(formData)
			});
		}

		if (!updated) throw error(404, 'Trip not found');

		throw redirect(303, '/dashboard');
	}
};
