import { authClient } from '$lib/auth/auth-client';

export async function signIn(email: string, password: string, rememberMe: boolean) {
	const { data, error } = await authClient.signIn.email({
		email,

		password,

		rememberMe
	});
	if (error) {
		throw new Error(error.message);
	}

	return data;
}
