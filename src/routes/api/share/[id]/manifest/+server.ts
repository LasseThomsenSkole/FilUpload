import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET({ params }) {
	const shareId = params.id;

	const share = await prisma.fileShare.findUnique({
		where: { id: shareId },
		include: {
			file: true
		}
	});

	if (!share) {
		return json({ error: 'Share link not found' }, { status: 404 });
	}

	if (share.expiresAt < new Date()) {
		return json({ error: 'Share link expired' }, { status: 410 });
	}

	const file = share.file;

	return json({
		fileId: file.id,
		s3Key: file.s3Key,
		encryptedMetadata: file.encryptedMetadata,
		metaNonce: file.metaNonce,
		encryptedFek: share.encryptedFek,
		shareNonce: share.nonce,
		fileNonce: file.nonce
	});
}
