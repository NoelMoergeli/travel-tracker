export interface PublicTripPhoto {
	id: string;
	url: string;
	caption: string;
	uploadedAt: string;
}

export interface PublicTrip {
	id: string;
	countryCode: string;
	countryName: string;
	placeName: string;
	dateFrom: string;
	dateTo: string;
	notes: string;
	images: string[];
	photos: PublicTripPhoto[];
}
