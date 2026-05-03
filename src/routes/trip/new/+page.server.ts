import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	TripValidationError,
	createTrip,
	photoValuesFromForm,
	tripValuesFromForm
} from '$lib/server/trips';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	return {
		countryCode: url.searchParams.get('country')?.toUpperCase() ?? ''
	};
};

export const actions: Actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();

		try {
			await createTrip(locals.user.id, formData);
		} catch (error) {
			const validationErrors = error instanceof TripValidationError ? error.errors : {};

			return fail(400, {
				message: error instanceof Error ? error.message : 'Unable to create trip.',
				errors: validationErrors,
				values: tripValuesFromForm(formData),
				photos: photoValuesFromForm(formData)
			});
		}

		throw redirect(303, '/dashboard');
	}
};
