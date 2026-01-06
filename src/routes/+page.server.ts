import type { PageServerLoad } from './$types';
import { auth } from '$lib/auth/auth.ts';

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});
	return {
		user: session?.user || null
	};
};
