import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth/auth';

export async function POST({ params, request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const owner = session.user;
	const fileId = params.id;
	const body = await request.json();
	// body: { recipients: [ { recipientId, encryptedFek } ] }
	if (!Array.isArray(body?.recipients)) {
		return json({ error: 'Invalid body' }, { status: 400 });
	}

	const file = await prisma.file.findUnique({ where: { id: fileId } });
	if (!file) return json({ error: 'Not found' }, { status: 404 });
	if (file.ownerId !== owner.id) return json({ error: 'Forbidden' }, { status: 403 });


	const created = [];
	for (const kp of body.recipients) {

		const user = await prisma.user.findUnique({ where: { id: kp.recipientId } });
		if (!user) continue;

		const existing = await prisma.fileKeyPacket.findFirst({
			where: { fileId, recipientId: kp.recipientId }
		});
		if (existing) {
			await prisma.fileKeyPacket.update({
				where: { id: existing.id },
				data: { encryptedFek: kp.encryptedFek }
			});
			created.push({ recipientId: kp.recipientId, updated: true });
		} else {
			await prisma.fileKeyPacket.create({
				data: {
					fileId,
					recipientId: kp.recipientId,
					encryptedFek: kp.encryptedFek
				}
			});
			created.push({ recipientId: kp.recipientId, created: true });
		}
	}

	return json({ ok: true, created });
}
