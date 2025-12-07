import sodium from 'libsodium-wrappers';


export async function shareFileWithRecipients(fileId: string, recipientIds: string[], ownerPublicKeyB64:string, ownerPrivateKeyB64:string) {
	await sodium.ready;

	const manifest = await fetch(`/api/file/${fileId}/manifest`).then(r => r.json());
	if (!manifest.keyPacket) throw new Error('Owner keyPacket missing');


	const ownerPub = sodium.from_base64(ownerPublicKeyB64);
	const ownerPriv = sodium.from_base64(ownerPrivateKeyB64);
	const sealed = sodium.from_base64(manifest.keyPacket);
	const fek = sodium.crypto_box_seal_open(sealed, ownerPub, ownerPriv);

	const recipients = [];
	for (const id of recipientIds) {
		const userRes = await fetch(`/api/user/${id}/public-key`);
		if (!userRes.ok) continue;
		const { publicKey: recipientPubB64 } = await userRes.json();
		const recipientPub = sodium.from_base64(recipientPubB64);
		const sealedForRecipient = sodium.crypto_box_seal(fek, recipientPub);
		recipients.push({
			recipientId: id,
			encryptedFek: sodium.to_base64(sealedForRecipient)
		});
	}


	const res = await fetch(`/api/file/${fileId}/share`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ recipients })
	});
	return res.ok ? await res.json() : Promise.reject(await res.text());
}
