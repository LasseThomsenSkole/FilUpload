<script lang="ts">
	import { onMount } from 'svelte';
	import sodium from 'libsodium-wrappers';

	export let data;
	const user = data.user;

	let file: File | null = null;
	let status = '';

	onMount(async () => {
		await sodium.ready;
	});

	async function handleUpload(e: SubmitEvent & { currentTarget: HTMLInputElement }) {
		e.preventDefault();
		if (!file) return;

		status = 'Encrypting...';

		const arrayBuffer = await file.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		const key = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES);

		const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

		// encrypt file
		const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
			bytes,
			null,
			null,
			nonce,
			key
		);

		// encrypt metadata
		const meta = {
			filename: file.name,
			contentType: file.type,
			size: file.size
		};
		const metaBytes = new TextEncoder().encode(JSON.stringify(meta));
		const metaNonce = sodium.randombytes_buf(24);

		const encryptedMetadata = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
			metaBytes,
			null,
			null,
			metaNonce,
			key
		);

		status = 'Requesting upload URL...';

		// get upload URL
		const initRes = await fetch('/api/upload/init', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				size: ciphertext.length,
				contentType: file.type
			})
		}).then((r) => r.json());

		const { fileId, uploadUrl } = initRes;

		status = 'Uploading encrypted file to S3...';

		const putRes = await fetch(uploadUrl, {
			// upload to S3
			method: 'PUT',
			headers: {
				'Content-Type': 'application/octet-stream'
			},
			body: new Blob([Uint8Array.from(ciphertext)], { type: 'application/octet-stream' })
		});

		if (!putRes.ok) {
			status = 'Upload failed!';
			return;
		}

		const userPub = sodium.from_base64(user.publicKey!);

		const sealedFek = sodium.crypto_box_seal(key, userPub);

		const keyPackets = [
			{
				recipientId: user.id,
				encryptedFek: sodium.to_base64(sealedFek)
			}
		];

		status = 'Saving manifest...';

		await fetch('/api/upload/complete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				fileId,
				encryptedMetadata: sodium.to_base64(encryptedMetadata),
				metaNonce: sodium.to_base64(metaNonce),
				nonce: sodium.to_base64(nonce),
				keyPackets
			})
		});

		status = 'Upload complete!';
	}
</script>

<header class="flex justify-between p-4">
	<a class="hover:text-red-500" href="/">Home</a>
	<a href="/download">Go to dashboard</a>
	<a class="hover:text-red-500" href="/login">Login</a>
</header>

<div class="flex min-h-screen flex-col items-center justify-center">
	<form
		class="flex flex-col items-center space-y-4 border p-6"
		on:submit|preventDefault={handleUpload}
	>
		<label for="file">Upload File</label>

		<input
			type="file"
			on:change={(e) => (file = e.currentTarget.files?.[0] ?? null)}
			required
			class="w-64 border p-2"
		/>

		<button class="border p-2 hover:border-red-500"> Upload </button>
	</form>

	{#if status}
		<p class="mt-4">{status}</p>
	{/if}
</div>
