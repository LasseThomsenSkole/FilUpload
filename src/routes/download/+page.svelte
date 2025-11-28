<script lang="ts">
import { downloadFile} from '$lib/crypto/downloadFile.ts';
import { onMount } from 'svelte';
import { get } from "idb-keyval";
import sodium from 'libsodium-wrappers';

export let data; // comes from +page.server.ts
let user = data.user;
let files = data.files;

let privateKey: string = "";
let status = "";
let loading = false;

onMount(async () => {
	await sodium.ready;

	privateKey = await get(`${user.name}_privateKey`) || "";
	if (!privateKey || privateKey.length === 0) {
		status = "No private key found. You must import your recovery phrase.";
	}
});


</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Your Files</h1>

	{#if !privateKey}
		<p class="text-red-500">No private key loaded. You cannot decrypt files.</p>
	{/if}

	<ul class="space-y-4">
		{#each files as file (file.id)}
			<li class="border p-3 flex justify-between items-center">
				<div>
					<p class="font-semibold">{file.name}</p>
					<p class="text-sm text-gray-400">{file.id}</p>
				</div>

				<button
					class="border px-3 py-1 hover:bg-gray-800"
					on:click={() => downloadFile(file.id, user.publicKey, privateKey )}
					disabled={loading}
				>
					Download
				</button>
			</li>
		{/each}
	</ul>

	{#if status}
		<p class="mt-4">{status}</p>
	{/if}
</div>