import { auth } from '$lib/auth/auth.ts';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';


export const load = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		throw redirect(303, '/');
	}
	const files = await prisma.file.findMany({
		where: {
			ownerId: session.user.id,
			encryptedMetadata: {
				not: "",
			},
		},
	});
	const sharedFiles = await prisma.file.findMany({
		where: {
			ownerId: { not: session.user.id },
			keyPackets: {
				some: {
					recipientId: session.user.id,
				},
			},
		},
		include: {
			keyPackets: {
				where: { recipientId: session.user.id },
			},
		},
	});

	return {
		user: session.user,
		files,
		sharedFiles,
	};
};