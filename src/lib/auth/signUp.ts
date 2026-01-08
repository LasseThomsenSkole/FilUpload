import { authClient } from '$lib/auth/auth-client';
import sodium from 'libsodium-wrappers';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { set as idbSet } from 'idb-keyval';

export async function signUp(name: string, email: string, password: string) {
	await sodium.ready;

	const mnemonic = generateMnemonic(wordlist, 128);

	const seed = sodium.crypto_generichash(32, new TextEncoder().encode(mnemonic));

	const keypair = sodium.crypto_box_seed_keypair(seed);

	const publicKeyBase64 = sodium.to_base64(keypair.publicKey);
	const privateKeyBase64 = sodium.to_base64(keypair.privateKey);

	const { data, error } = await authClient.signUp.email({
		email,
		password,
		name,
		publicKey: publicKeyBase64
	});

	if (error) {
		throw new Error(error.message);
	}
	await idbSet(`${name}_mnemonic`, mnemonic);
	await idbSet(`${name}_privateKey`, privateKeyBase64);

	return {
		user: data.user,
		mnemonic
	};
}
