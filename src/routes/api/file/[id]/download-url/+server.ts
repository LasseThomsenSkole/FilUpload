import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '$lib/S3/S3-client';
import { auth } from '$lib/auth/auth';
import { BUCKET_NAME } from '$env/static/private';

export async function GET({ params, request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = session.user;

	const file = await prisma.file.findUnique({
		where: { id: params.id },
		include: { keyPackets: true }
	});

	if (!file) return json({ error: 'Not found' }, { status: 404 });

	// Is user allowed?
	const allowed =
		file.ownerId === user.id || file.keyPackets.some((k) => k.recipientId === user.id);

	if (!allowed) {
		//todo: lav det til 404
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: file.s3Key
	});

	const url = await getSignedUrl(s3, command, { expiresIn: 300 });

	return json({ url });
}
