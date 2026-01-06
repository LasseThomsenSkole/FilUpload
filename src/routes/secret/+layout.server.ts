import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/');
	}

	if (locals.user.role == 'user') {
		throw redirect(303, '/not-authorized');
	}
	return {
		user: locals.user
	};
};
