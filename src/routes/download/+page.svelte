<script lang="ts">
	import sodium from "libsodium-wrappers";

	async function downloadFile(fileId, myPublicKey, myPrivateKey) {
		await sodium.ready;

		const manifest = await fetch(`/api/file/${fileId}/manifest`).then(r => r.json());

		const encryptedFek = sodium.from_base64(manifest.keyPacket);

		const fileKey = sodium.crypto_box_seal_open(
			encryptedFek,
			myPublicKey,
			myPrivateKey
		);

		const { url } = await fetch(`/api/file/${fileId}/download-url`).then(r => r.json());

		const ciphertext = new Uint8Array(await fetch(url).then(r => r.arrayBuffer()));

		const nonce = sodium.from_base64(manifest.nonce); //decrypt

		const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
			null,
			ciphertext,
			null,
			nonce,
			fileKey
		);


		const blob = new Blob([plaintext]); //convert

		const metaNonce = sodium.from_base64(manifest.metaNonce);
		const metaCt = sodium.from_base64(manifest.encryptedMetadata);
		const meta = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
			null,
			metaCt,
			null,
			metaNonce,
			fileKey
		);
		const metadata = JSON.parse(new TextDecoder().decode(meta));

		//trigger save
		const urlObject = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = urlObject;
		a.download = metadata.filename || "file.bin";
		a.click();
	}

</script>