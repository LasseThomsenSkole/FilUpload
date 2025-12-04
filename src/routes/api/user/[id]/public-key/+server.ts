import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { auth } from '$lib/auth/auth';

export async function GET({ params, request }) {
	
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const user = await prisma.user.findUnique({
		where: { id: params.id },
		select: { publicKey: true }
	});
	if (!user) return json({ error: 'Not found' }, { status: 404 });
	return json({ publicKey: user.publicKey });
}
