export interface TripFormValues {
	countryCode: string;
	placeName: string;
	dateFrom: string;
	dateTo: string;
	notes: string;
}

export type TripFormField = keyof TripFormValues;
export type TripFieldErrors = Partial<Record<TripFormField | 'photos', string>>;

export function validateCountrySelection(countryCode: string, query: string): string {
	if (!countryCode && query.trim()) return 'Choose a country from the list.';
	if (!countryCode) return 'Country is required';
	if (countryCode.trim().length !== 2) return 'Use an ISO alpha-2 country code';
	return '';
}

export function validateTripField(
	field: TripFormField,
	values: TripFormValues
): TripFieldErrors {
	const errors: TripFieldErrors = {};

	if (field === 'countryCode') {
		const countryError = validateCountrySelection(values.countryCode, values.countryCode);
		if (countryError) errors.countryCode = countryError;
	}

	if (field === 'placeName' && !values.placeName.trim()) {
		errors.placeName = 'Place is required';
	}

	if (field === 'dateFrom' && !values.dateFrom.trim()) {
		errors.dateFrom = 'Start date is required';
	}

	if ((field === 'dateFrom' || field === 'dateTo') && values.dateFrom && values.dateTo) {
		if (values.dateTo < values.dateFrom) {
			errors.dateTo = 'End date must be after the start date';
		}
	}

	return errors;
}
