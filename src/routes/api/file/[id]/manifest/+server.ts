import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth/auth.ts';

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

	if (!file) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	// Check if user is either:
	// - owner, OR
	// - has a keyPacket
	const allowed =
		file.ownerId === user.id || file.keyPackets.some((kp) => kp.recipientId === user.id);

	if (!allowed) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const keyPacket = file.keyPackets.find((kp) => kp.recipientId === user.id);

	return json({
		fileId: file.id,
		s3Key: file.s3Key,
		encryptedMetadata: file.encryptedMetadata,
		keyPacket: keyPacket ? keyPacket.encryptedFek : null,
		nonce: file.nonce,
		metaNonce: file.metaNonce
	});
}
