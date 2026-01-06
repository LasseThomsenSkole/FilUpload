import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth/auth';

export const load = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		throw redirect(303, '/');
	}

	return {
		user: session.user
	};
};
