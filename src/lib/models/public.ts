export interface PublicTripPhoto {
	id: string;
	filename: string;
	mimeType: string;
	size: number;
	data: string;
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
	photos: PublicTripPhoto[];
}
