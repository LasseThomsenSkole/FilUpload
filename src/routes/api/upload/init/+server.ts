import { json } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '$lib/server/prisma';
import { s3 } from '$lib/S3/S3-client';
import { BUCKET_NAME } from '$env/static/private';



export async function POST({ request, locals }) {
	const session = await locals.auth.api.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = session.user;

	const { size, contentType } = await request.json();
	if (!size || !contentType) {
		return json({ error: 'Invalid body' }, { status: 400 });
	}

	const fileId = crypto.randomUUID();
	const s3Key = `uploads/${fileId}.bin`;

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: s3Key,
		ContentType: 'application/octet-stream'
	});

	const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

	// Create preliminary DB record
	await prisma.file.create({
		data: {
			id: fileId,
			ownerId: user.id,
			s3Key,
			encryptedMetadata: ''
		}
	});

	return json({ fileId, s3Key, uploadUrl });
}