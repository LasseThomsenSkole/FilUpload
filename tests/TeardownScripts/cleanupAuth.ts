import { auth } from '$lib/auth/auth.ts';
import { prisma } from '$lib/server/prisma.ts';
export default async function cleanupAuth() {
	console.log('Cleaning up authentication data...');
	const testUserId = await prisma.user.findFirstOrThrow({
		where: { email: { contains: 'e2e' } }
	});


	await auth.api.removeUser({
		body: {
			userId: testUserId,
		}
	});
}