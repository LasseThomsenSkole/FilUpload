import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth/auth.ts';

export async function POST({ request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = session.user;
	const body = await request.json();

	const { fileId, encryptedFek, nonce, expiresIn } = body;
	if (!fileId || !encryptedFek || !nonce || !expiresIn) {
		return json({ error: 'Invalid body' }, { status: 400 });
	}

	const file = await prisma.file.findUnique({
		where: { id: fileId }
	});

	if (!file) return json({ error: 'File not found' }, { status: 404 });
	if (file.ownerId !== user.id) return json({ error: 'Forbidden' }, { status: 403 });

	const share = await prisma.fileShare.create({
		data: {
			fileId,
			encryptedFek,
			nonce,
			expiresAt: new Date(Date.now() + expiresIn * 1000)
		}
	});

	return json({
		shareId: share.id
	});
}
