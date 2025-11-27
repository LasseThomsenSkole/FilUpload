import { authClient } from "$lib/auth/auth-client";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from '@scure/bip39/wordlists/english.js';

import { set as idbSet } from "idb-keyval";

import sodium from 'libsodium-wrappers';
export async function signUp(name: string, email: string, password: string) {
	await sodium.ready;

	// X25519
	const keypair = sodium.crypto_box_keypair();

	const publicKeyBase64 = sodium.to_base64(keypair.publicKey);
	const privateKeyBase64 = sodium.to_base64(keypair.privateKey);

	// mnemonic backup
	const mnemonic = generateMnemonic(wordlist, 128);


	const { data, error } = await authClient.signUp.email({
		email,
		password,
		name,
		publicKey: publicKeyBase64,

	});

	if (error) {
		throw new Error(error.message);
	}


	await idbSet("privateKey", privateKeyBase64);
	await idbSet("mnemonic", mnemonic);

	return {
		user: data.user,
		mnemonic  // todo: vis det
	};
}
