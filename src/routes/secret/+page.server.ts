import { redirect } from '@sveltejs/kit';

export const load = ({ locals }) => {
    if (!locals.user) {
        throw redirect(303, '/');
    }

    if (locals.user.role == 'admin') {
        throw redirect(303, '/not-authorized');
    }
    return locals.user;
};
