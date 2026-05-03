import { GridFSBucket, type Db } from 'mongodb';
import { Readable } from 'node:stream';

const MAX_FILES = Number(process.env.UPLOAD_MAX_FILES ?? '5');
const MAX_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? String(5 * 1024 * 1024));
const ALLOWED_MIME_PREFIX = process.env.UPLOAD_ALLOWED_PREFIX ?? 'image/';

export async function uploadImages(db: Db, files: File[]): Promise<string[]> {
	if (!files.length) return [];
	if (files.length > MAX_FILES) throw new Error(`Too many files. Max ${MAX_FILES}.`);

	const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
	const urls: string[] = [];

	for (const file of files) {
		if (file.size > MAX_BYTES) {
			throw new Error(`File ${file.name} exceeds max size of ${MAX_BYTES} bytes.`);
		}

		if (!file.type || !file.type.startsWith(ALLOWED_MIME_PREFIX)) {
			throw new Error(`Invalid file type for ${file.name}.`);
		}

		const nodeStream = Readable.fromWeb(file.stream());
		const uploadStream = bucket.openUploadStream(file.name, {
			metadata: { contentType: file.type }
		});

		await new Promise<void>((resolve, reject) => {
			nodeStream.pipe(uploadStream).on('finish', resolve).on('error', reject);
		});

		urls.push(`/api/uploads/raw?id=${uploadStream.id.toString()}`);
	}

	return urls;
}
