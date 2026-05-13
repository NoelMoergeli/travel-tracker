import { env } from '$env/dynamic/private';
import { getCountryName } from '$lib/countries';

export interface GeocodingResult {
	latitude: number;
	longitude: number;
	query: string;
	source: 'nominatim';
}

export type GeocodingLookup =
	| { status: 'found'; result: GeocodingResult }
	| { status: 'not_found' | 'error'; query: string };

interface NominatimPlace {
	lat?: string;
	lon?: string;
}

const NOMINATIM_SEARCH_URL = env.NOMINATIM_SEARCH_URL ?? 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT =
	env.NOMINATIM_USER_AGENT ?? 'TravelTrackerStudentProject/1.0 (local development)';
const REQUEST_DELAY_MS = 1100;

const cache = new Map<string, GeocodingLookup>();
let lastRequestAt = 0;

export function buildGeocodingQuery(countryCode: string, placeName: string): string {
	return `${placeName.trim()}, ${getCountryName(countryCode)}`.trim();
}

export async function geocodeTripLocation(
	countryCode: string,
	placeName: string
): Promise<GeocodingLookup> {
	const query = buildGeocodingQuery(countryCode, placeName);
	const normalizedKey = `${countryCode.toUpperCase()}|${query.toLowerCase()}`;

	if (cache.has(normalizedKey)) {
		return cache.get(normalizedKey) as GeocodingLookup;
	}

	await waitForRateLimit();

	const url = new URL(NOMINATIM_SEARCH_URL);
	url.searchParams.set('format', 'jsonv2');
	url.searchParams.set('limit', '1');
	url.searchParams.set('q', query);
	url.searchParams.set('countrycodes', countryCode.toLowerCase());

	try {
		const response = await fetch(url, {
			headers: {
				Accept: 'application/json',
				'User-Agent': NOMINATIM_USER_AGENT
			}
		});

		if (!response.ok) {
			throw new Error(`Nominatim returned ${response.status}`);
		}

		const results = (await response.json()) as NominatimPlace[];
		const firstResult = results[0];
		const latitude = Number(firstResult?.lat);
		const longitude = Number(firstResult?.lon);
		const lookup: GeocodingLookup =
			Number.isFinite(latitude) && Number.isFinite(longitude)
				? { status: 'found', result: { latitude, longitude, query, source: 'nominatim' } }
				: { status: 'not_found', query };

		cache.set(normalizedKey, lookup);
		return lookup;
	} catch (error) {
		console.error('Unable to geocode trip location.', error);
		const lookup: GeocodingLookup = { status: 'error', query };
		cache.set(normalizedKey, lookup);
		return lookup;
	}
}

async function waitForRateLimit(): Promise<void> {
	const elapsed = Date.now() - lastRequestAt;
	const waitMs = Math.max(0, REQUEST_DELAY_MS - elapsed);

	if (waitMs > 0) {
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	lastRequestAt = Date.now();
}
