import sodium from 'libsodium-wrappers';


export async function createShareLink(
	fileId: string,
	ownerPublicKey: string,
	ownerPrivateKey: string,
	expiresInSeconds = 60 * 15 // 15 minutes
) {
	await sodium.ready;

	const manifest = await fetch(`/api/file/${fileId}/manifest`).then((r) => {
		if (!r.ok) throw new Error('Failed to load file manifest');
		return r.json();
	});

	if (!manifest.keyPacket) {
		throw new Error('Owner keyPacket not found. Owner cannot unwrap FEK.');
	}

	const encryptedFekOwner = sodium.from_base64(manifest.keyPacket);


	const ownerPub = sodium.from_base64(ownerPublicKey);

	const ownerPriv = sodium.from_base64(ownerPrivateKey);

	const FEK = sodium.crypto_box_seal_open(encryptedFekOwner, ownerPub, ownerPriv);

	if (!FEK) throw new Error('Failed to unwrap FEK');


	const shareKey = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);


	const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

	const encryptedFekForShare = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
		FEK,
		null,
		null,
		nonce,
		shareKey
	);


	const share = await fetch('/api/share/create', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			fileId,
			encryptedFek: sodium.to_base64(encryptedFekForShare),
			nonce: sodium.to_base64(nonce),
			expiresIn: expiresInSeconds
		})
	}).then((r) => {
		if (!r.ok) throw new Error('Share creation failed');
		return r.json();
	});

	if (!share.shareId) throw new Error('Server did not return shareId');


	const shareUrl = `${window.location.origin}/shared/${share.shareId}#key=${sodium.to_base64(
		shareKey
	)}`;

	return {
		shareId: share.shareId,
		shareUrl,
		expiresAt: Date.now() + expiresInSeconds * 1000
	};
}
