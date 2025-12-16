<script lang="ts">
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import sodium from "libsodium-wrappers";

	let loading = true;
	let error: string | null = null;
	let metadata: any = null;
	let readyToDownload = false;

	let decryptedFileBlob: Blob | null = null;

	onMount(async () => { //todo extract to function
		try {
			await sodium.ready;


			const hash = window.location.hash;
			const fragment = new URLSearchParams(hash.slice(1));
			const shareKeyB64 = fragment.get("key");

			if (!shareKeyB64) {
				error = "Missing share decryption key.";
				loading = false;
				return;
			}

			const shareKey = sodium.from_base64(shareKeyB64);


			const shareId = page.params.id;

			const manifest = await fetch(`/api/share/${shareId}/manifest`).then((r) => {
				if (!r.ok) throw new Error("Invalid or expired share link.");
				return r.json();
			});

			const {
				encryptedFek,
				shareNonce,
				encryptedMetadata,
				metaNonce,
				fileId,
				fileNonce
			} = manifest;



			const fek = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
				null,
				sodium.from_base64(encryptedFek),
				null,
				sodium.from_base64(shareNonce),
				shareKey
			);


			const metadataBytes = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
				null,
				sodium.from_base64(encryptedMetadata),
				null,
				sodium.from_base64(metaNonce),
				fek
			);

			metadata = JSON.parse(new TextDecoder().decode(metadataBytes));

			const { url } = await fetch(`/api/file/${fileId}/download-url`).then(r => r.json());

			const response = await fetch(url);
			const ab = await response.arrayBuffer();
			const ciphertext = new Uint8Array(ab);

			const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
				null,
				ciphertext,
				null,
				sodium.from_base64(fileNonce),
				fek
			);


			decryptedFileBlob = new Blob([Uint8Array.from(plaintext)]);

			readyToDownload = true;
			loading = false;
		} catch (err: any) {
			console.error(err);
			error = err.message ?? "Unknown error occurred.";
			loading = false;
		}
	});

	function saveFile() {
		if (!decryptedFileBlob) return;

		const a = document.createElement("a");
		const url = URL.createObjectURL(decryptedFileBlob);
		a.href = url;
		a.download = metadata?.filename || "file.bin";
		a.click();
		URL.revokeObjectURL(url);
	}
</script>


<div class="flex flex-col items-center mt-20">

	{#if loading}
		<p class="text-lg">Decrypting shared file...</p>
	{/if}

	{#if error}
		<p class="text-red-500 text-lg">{error}</p>
	{/if}

	{#if metadata && !error}
		<h1 class="text-2xl font-bold mb-4">Shared File</h1>

		<div class="mb-6 text-center">
			<p class="text-xl">{metadata.filename}</p>
			<p class="text-sm text-gray-400">{metadata.mimeType}</p>
			<p class="text-sm text-gray-400">{metadata.size} bytes</p>
		</div>

		{#if readyToDownload}
			<button
				on:click={saveFile}
				class="px-4 py-2 hover:bg-gray-700 border"
			>
				Download File
			</button>
		{/if}
	{/if}
</div>
