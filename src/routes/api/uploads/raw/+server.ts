import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'node:stream';
import { getDb } from '$lib/db/mongo';
import { TRIPS_COLLECTION, type Trip } from '$lib/models/trip';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const id = url.searchParams.get('id') ?? '';
	if (!ObjectId.isValid(id)) throw error(400, 'Invalid upload id');

	const fileId = new ObjectId(id);
	const db = await getDb();
	const imageUrl = `/api/uploads/raw?id=${id}`;

	const trip = await db.collection<Trip>(TRIPS_COLLECTION).findOne({
		userId: new ObjectId(locals.user.id),
		images: imageUrl
	});

	if (!trip) throw error(404, 'Upload not found');

	const file = await db.collection('uploads.files').findOne({ _id: fileId });
	if (!file) throw error(404, 'Upload not found');

	const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
	const stream = bucket.openDownloadStream(fileId);
	const body = Readable.toWeb(stream) as unknown as ReadableStream;
	const contentType =
		typeof file.metadata?.contentType === 'string' ? file.metadata.contentType : 'application/octet-stream';

	return new Response(body, {
		headers: {
			'Content-Type': contentType,
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
