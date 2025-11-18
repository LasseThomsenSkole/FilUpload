import { auth } from "$lib/auth/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

export const handle = async ({ event, resolve }) => {
    const response = await auth.api.getSession({
        headers: event.request.headers,
    });

    if (response) {
        event.locals.session = response.session;
        event.locals.user = response.user;
    }

    return svelteKitHandler({ event, resolve, auth, building });
};
