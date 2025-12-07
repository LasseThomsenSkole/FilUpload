import { prisma } from '$lib/server/prisma';

export const GET = async ({ url }) => {
	const emailsParam = url.searchParams.get('emails'); // comma-separated

	if (!emailsParam) {
		return new Response(JSON.stringify([]), { status: 200 });
	}

	const emails = emailsParam.split(',');

	const users = await prisma.user.findMany({
		where: { email: { in: emails } },
		select: { id: true, name: true, email: true }
	});

	return new Response(JSON.stringify(users), { status: 200 });
}