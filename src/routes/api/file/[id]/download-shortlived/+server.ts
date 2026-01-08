import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/S3/S3-client';
import { BUCKET_NAME } from '$env/static/private';

export async function GET({ params }) {
	const share = await prisma.fileShare.findUnique({
		where: { id: params.id },
		include: {
			file: {
				select: { s3Key: true }
			}
		}
	});

	if (!share) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	if (share.expiresAt < new Date()) {
		return json({ error: 'Expired' }, { status: 410 });
	}

	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: share.file.s3Key
	});

	const url = await getSignedUrl(s3, command, { expiresIn: 60 });

	return json({
		url
	});
}
