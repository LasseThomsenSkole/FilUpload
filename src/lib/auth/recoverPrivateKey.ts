import { set as idbSet } from 'idb-keyval';
import sodium from 'libsodium-wrappers';

export async function recoverFromMnemonic(name: string, mnemonic: string) {
	await sodium.ready;

	const seed = sodium.crypto_generichash(32, new TextEncoder().encode(mnemonic));

	const keypair = sodium.crypto_box_seed_keypair(seed);

	await idbSet(`${name}_mnemonic`, sodium.to_base64(keypair.privateKey));
	await idbSet(`${name}_privateKey`, sodium.to_base64(keypair.privateKey));

	return keypair;
}
