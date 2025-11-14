import { authClient} from "$lib/auth/auth-client";

export async function signUp(name: string,email: string, password: string) {
    const { data, error } = await authClient.signUp.email({
        email,
        password,
        name
    });
    if (error) {
        throw new Error(error.message);
    }

    return data;
}