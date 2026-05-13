import type { PublicTrip } from '$lib/models/public';

export interface TripWithDuration {
	trip: PublicTrip;
	durationDays: number;
}

export interface CountBucket {
	label: string;
	count: number;
}

export interface TravelStatistics {
	totalTrips: number;
	visitedCountryCount: number;
	visitedContinentCount: number;
	averageDurationDays: number;
	longestTrip: TripWithDuration | null;
	shortestTrip: TripWithDuration | null;
	mostVisitedCountry: CountBucket | null;
	tripsPerYear: CountBucket[];
	countriesPerContinent: CountBucket[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const continentByCountryCode = new Map<string, string>([
	['AD', 'Europe'],
	['AE', 'Asia'],
	['AF', 'Asia'],
	['AG', 'North America'],
	['AI', 'North America'],
	['AL', 'Europe'],
	['AM', 'Asia'],
	['AO', 'Africa'],
	['AQ', 'Antarctica'],
	['AR', 'South America'],
	['AS', 'Oceania'],
	['AT', 'Europe'],
	['AU', 'Oceania'],
	['AW', 'North America'],
	['AX', 'Europe'],
	['AZ', 'Asia'],
	['BA', 'Europe'],
	['BB', 'North America'],
	['BD', 'Asia'],
	['BE', 'Europe'],
	['BF', 'Africa'],
	['BG', 'Europe'],
	['BH', 'Asia'],
	['BI', 'Africa'],
	['BJ', 'Africa'],
	['BL', 'North America'],
	['BM', 'North America'],
	['BN', 'Asia'],
	['BO', 'South America'],
	['BQ', 'North America'],
	['BR', 'South America'],
	['BS', 'North America'],
	['BT', 'Asia'],
	['BV', 'Antarctica'],
	['BW', 'Africa'],
	['BY', 'Europe'],
	['BZ', 'North America'],
	['CA', 'North America'],
	['CC', 'Asia'],
	['CD', 'Africa'],
	['CF', 'Africa'],
	['CG', 'Africa'],
	['CH', 'Europe'],
	['CI', 'Africa'],
	['CK', 'Oceania'],
	['CL', 'South America'],
	['CM', 'Africa'],
	['CN', 'Asia'],
	['CO', 'South America'],
	['CR', 'North America'],
	['CU', 'North America'],
	['CV', 'Africa'],
	['CW', 'North America'],
	['CX', 'Asia'],
	['CY', 'Asia'],
	['CZ', 'Europe'],
	['DE', 'Europe'],
	['DJ', 'Africa'],
	['DK', 'Europe'],
	['DM', 'North America'],
	['DO', 'North America'],
	['DZ', 'Africa'],
	['EC', 'South America'],
	['EE', 'Europe'],
	['EG', 'Africa'],
	['EH', 'Africa'],
	['ER', 'Africa'],
	['ES', 'Europe'],
	['ET', 'Africa'],
	['FI', 'Europe'],
	['FJ', 'Oceania'],
	['FK', 'South America'],
	['FM', 'Oceania'],
	['FO', 'Europe'],
	['FR', 'Europe'],
	['GA', 'Africa'],
	['GB', 'Europe'],
	['GD', 'North America'],
	['GE', 'Asia'],
	['GF', 'South America'],
	['GG', 'Europe'],
	['GH', 'Africa'],
	['GI', 'Europe'],
	['GL', 'North America'],
	['GM', 'Africa'],
	['GN', 'Africa'],
	['GP', 'North America'],
	['GQ', 'Africa'],
	['GR', 'Europe'],
	['GS', 'Antarctica'],
	['GT', 'North America'],
	['GU', 'Oceania'],
	['GW', 'Africa'],
	['GY', 'South America'],
	['HK', 'Asia'],
	['HM', 'Antarctica'],
	['HN', 'North America'],
	['HR', 'Europe'],
	['HT', 'North America'],
	['HU', 'Europe'],
	['ID', 'Asia'],
	['IE', 'Europe'],
	['IL', 'Asia'],
	['IM', 'Europe'],
	['IN', 'Asia'],
	['IO', 'Asia'],
	['IQ', 'Asia'],
	['IR', 'Asia'],
	['IS', 'Europe'],
	['IT', 'Europe'],
	['JE', 'Europe'],
	['JM', 'North America'],
	['JO', 'Asia'],
	['JP', 'Asia'],
	['KE', 'Africa'],
	['KG', 'Asia'],
	['KH', 'Asia'],
	['KI', 'Oceania'],
	['KM', 'Africa'],
	['KN', 'North America'],
	['KP', 'Asia'],
	['KR', 'Asia'],
	['KW', 'Asia'],
	['KY', 'North America'],
	['KZ', 'Asia'],
	['LA', 'Asia'],
	['LB', 'Asia'],
	['LC', 'North America'],
	['LI', 'Europe'],
	['LK', 'Asia'],
	['LR', 'Africa'],
	['LS', 'Africa'],
	['LT', 'Europe'],
	['LU', 'Europe'],
	['LV', 'Europe'],
	['LY', 'Africa'],
	['MA', 'Africa'],
	['MC', 'Europe'],
	['MD', 'Europe'],
	['ME', 'Europe'],
	['MF', 'North America'],
	['MG', 'Africa'],
	['MH', 'Oceania'],
	['MK', 'Europe'],
	['ML', 'Africa'],
	['MM', 'Asia'],
	['MN', 'Asia'],
	['MO', 'Asia'],
	['MP', 'Oceania'],
	['MQ', 'North America'],
	['MR', 'Africa'],
	['MS', 'North America'],
	['MT', 'Europe'],
	['MU', 'Africa'],
	['MV', 'Asia'],
	['MW', 'Africa'],
	['MX', 'North America'],
	['MY', 'Asia'],
	['MZ', 'Africa'],
	['NA', 'Africa'],
	['NC', 'Oceania'],
	['NE', 'Africa'],
	['NF', 'Oceania'],
	['NG', 'Africa'],
	['NI', 'North America'],
	['NL', 'Europe'],
	['NO', 'Europe'],
	['NP', 'Asia'],
	['NR', 'Oceania'],
	['NU', 'Oceania'],
	['NZ', 'Oceania'],
	['OM', 'Asia'],
	['PA', 'North America'],
	['PE', 'South America'],
	['PF', 'Oceania'],
	['PG', 'Oceania'],
	['PH', 'Asia'],
	['PK', 'Asia'],
	['PL', 'Europe'],
	['PM', 'North America'],
	['PN', 'Oceania'],
	['PR', 'North America'],
	['PS', 'Asia'],
	['PT', 'Europe'],
	['PW', 'Oceania'],
	['PY', 'South America'],
	['QA', 'Asia'],
	['RE', 'Africa'],
	['RO', 'Europe'],
	['RS', 'Europe'],
	['RU', 'Europe'],
	['RW', 'Africa'],
	['SA', 'Asia'],
	['SB', 'Oceania'],
	['SC', 'Africa'],
	['SD', 'Africa'],
	['SE', 'Europe'],
	['SG', 'Asia'],
	['SH', 'Africa'],
	['SI', 'Europe'],
	['SJ', 'Europe'],
	['SK', 'Europe'],
	['SL', 'Africa'],
	['SM', 'Europe'],
	['SN', 'Africa'],
	['SO', 'Africa'],
	['SR', 'South America'],
	['SS', 'Africa'],
	['ST', 'Africa'],
	['SV', 'North America'],
	['SX', 'North America'],
	['SY', 'Asia'],
	['SZ', 'Africa'],
	['TC', 'North America'],
	['TD', 'Africa'],
	['TF', 'Antarctica'],
	['TG', 'Africa'],
	['TH', 'Asia'],
	['TJ', 'Asia'],
	['TK', 'Oceania'],
	['TL', 'Asia'],
	['TM', 'Asia'],
	['TN', 'Africa'],
	['TO', 'Oceania'],
	['TR', 'Asia'],
	['TT', 'North America'],
	['TV', 'Oceania'],
	['TW', 'Asia'],
	['TZ', 'Africa'],
	['UA', 'Europe'],
	['UG', 'Africa'],
	['UM', 'Oceania'],
	['US', 'North America'],
	['UY', 'South America'],
	['UZ', 'Asia'],
	['VA', 'Europe'],
	['VC', 'North America'],
	['VE', 'South America'],
	['VG', 'North America'],
	['VI', 'North America'],
	['VN', 'Asia'],
	['VU', 'Oceania'],
	['WF', 'Oceania'],
	['WS', 'Oceania'],
	['YE', 'Asia'],
	['YT', 'Africa'],
	['ZA', 'Africa'],
	['ZM', 'Africa'],
	['ZW', 'Africa']
]);

export function createTravelStatistics(trips: PublicTrip[]): TravelStatistics {
	const tripsWithDurations = trips.map((trip) => ({
		trip,
		durationDays: getTripDurationDays(trip)
	}));
	const validDurations = tripsWithDurations.filter((trip) => trip.durationDays > 0);
	const visitedCountryCodes = new Set(trips.map((trip) => trip.countryCode.toUpperCase()));
	const visitedContinents = new Set(
		Array.from(visitedCountryCodes)
			.map((countryCode) => getContinentForCountry(countryCode))
			.filter((continent): continent is string => Boolean(continent))
	);

	return {
		totalTrips: trips.length,
		visitedCountryCount: visitedCountryCodes.size,
		visitedContinentCount: visitedContinents.size,
		averageDurationDays: getAverageDuration(validDurations),
		longestTrip: getDurationExtreme(validDurations, 'longest'),
		shortestTrip: getDurationExtreme(validDurations, 'shortest'),
		mostVisitedCountry: getTopCountBucket(trips.map((trip) => trip.countryName)),
		tripsPerYear: getTripsPerYear(trips),
		countriesPerContinent: getCountriesPerContinent(visitedCountryCodes)
	};
}

export function getTripDurationDays(trip: PublicTrip): number {
	const start = parseDateOnly(trip.dateFrom);
	const end = parseDateOnly(trip.dateTo || trip.dateFrom);

	if (start === null || end === null || end < start) return 0;
	return Math.floor((end - start) / DAY_MS) + 1;
}

export function getContinentForCountry(countryCode: string): string | null {
	return continentByCountryCode.get(countryCode.toUpperCase()) ?? null;
}

function parseDateOnly(value: string): number | null {
	if (!value) return null;

	const timestamp = new Date(`${value.slice(0, 10)}T00:00:00.000Z`).getTime();
	return Number.isNaN(timestamp) ? null : timestamp;
}

function getAverageDuration(tripsWithDurations: TripWithDuration[]): number {
	if (!tripsWithDurations.length) return 0;

	const totalDays = tripsWithDurations.reduce((sum, trip) => sum + trip.durationDays, 0);
	return Math.round((totalDays / tripsWithDurations.length) * 10) / 10;
}

function getDurationExtreme(
	tripsWithDurations: TripWithDuration[],
	mode: 'longest' | 'shortest'
): TripWithDuration | null {
	if (!tripsWithDurations.length) return null;

	return tripsWithDurations.reduce((selected, candidate) => {
		if (mode === 'longest') {
			return candidate.durationDays > selected.durationDays ? candidate : selected;
		}

		return candidate.durationDays < selected.durationDays ? candidate : selected;
	});
}

function getTopCountBucket(labels: string[]): CountBucket | null {
	const counts = new Map<string, number>();

	for (const label of labels) {
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))[0] ?? null;
}

function getTripsPerYear(trips: PublicTrip[]): CountBucket[] {
	const counts = new Map<string, number>();

	for (const trip of trips) {
		const year = trip.dateFrom.slice(0, 4);
		if (!/^\d{4}$/.test(year)) continue;
		counts.set(year, (counts.get(year) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => a.label.localeCompare(b.label));
}

function getCountriesPerContinent(countryCodes: Set<string>): CountBucket[] {
	const continentCountries = new Map<string, Set<string>>();

	for (const countryCode of countryCodes) {
		const continent = getContinentForCountry(countryCode);
		if (!continent) continue;

		const countries = continentCountries.get(continent) ?? new Set<string>();
		countries.add(countryCode);
		continentCountries.set(continent, countries);
	}

	return Array.from(continentCountries.entries())
		.map(([label, countries]) => ({ label, count: countries.size }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
