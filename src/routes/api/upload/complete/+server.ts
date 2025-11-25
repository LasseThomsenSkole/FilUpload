import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request, locals }) {
	const session = await locals.auth.api.getSession();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = session.user;

	const { fileId, encryptedMetadata, keyPackets } = await request.json();

	if (!fileId || !encryptedMetadata || !Array.isArray(keyPackets)) {
		return json({ error: 'Invalid body' }, { status: 400 });
	}

	const file = await prisma.file.findUnique({
		where: { id: fileId }
	});

	if (!file) {
		return json({ error: 'File not found' }, { status: 404 });
	}

	if (file.ownerId !== user.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	// Save encrypted metadata
	await prisma.file.update({
		where: { id: fileId },
		data: {
			encryptedMetadata
		}
	});

	// Save each key-packet (encrypted FEK)
	for (const kp of keyPackets) {
		await prisma.fileKeyPacket.create({
			data: {
				fileId,
				recipientId: kp.recipientId,
				encryptedFek: kp.encryptedFek
			}
		});
	}

	return json({ ok: true });
}
