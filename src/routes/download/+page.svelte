<script lang="ts">
	import { downloadFile } from '$lib/crypto/downloadFile.ts';
	import { onMount } from 'svelte';
	import { get } from 'idb-keyval';
	import sodium from 'libsodium-wrappers';
	import { shareFileWithRecipients } from '$lib/crypto/shareFile.ts';
	import { SvelteSet } from 'svelte/reactivity';
	import ShareInput from '$lib/Components/share/ShareInput.svelte';
	import { getUsersFromEmails } from '$lib/helper/getUsersFromEmails.ts';
	import SharedFileItem from '$lib/Components/files/SharedFileItem.svelte';
	import OwnedFileItem from '$lib/Components/files/OwnedFileItem.svelte';

	export let data;

	let user = data.user;
	let files = data.files;
	let sharedFiles = data.sharedFiles;

	let privateKey: string = "";
	let status = "";
	let loading = false;
	let sharing = false;
	let showSharedFiles = false;
	
	let openShareMenuForFile: string | null = null;
	let selectedRecipients: Record<string, Set<string>> = {};


	onMount(async () => {
		await sodium.ready;
		privateKey = await get(`${user.name}_privateKey`) || "";
		if (!privateKey) {
			status = "No private key found. You must import your recovery phrase.";
		}
	});

	function toggleShareMenu(fileId: string) {
		openShareMenuForFile = openShareMenuForFile === fileId ? null : fileId;
		selectedRecipients[fileId] ||= new SvelteSet();
	}

	async function handleShare(fileId: string, emails: string[]) {
		sharing = true;
		status = "Sharing file...";
		try {
			const recipientsId = await getUsersFromEmails(emails)
			const ownerPublicKeyB64 = user.publicKey!;
			await shareFileWithRecipients(fileId, recipientsId, ownerPublicKeyB64, privateKey);
			status = "File shared successfully.";
		} catch (error) {
			console.error("Error sharing file:", error);
			status = "Error sharing file.";
		} finally {
			sharing = false;
			openShareMenuForFile = null;
		}
	}
</script>


<div class="p-4">
	<div class="flex items-baseline gap-4 mb-4">
		<button
			on:click={() => showSharedFiles = false}
			class="text-2xl font-bold hover:text-white"
			class:text-gray-500={showSharedFiles}
		>
			Your Files
		</button>

		<button
			on:click={() => showSharedFiles = true}
			class="text-xl hover:text-white"
			class:text-gray-500={!showSharedFiles}
		>
			Shared with you
		</button>
	</div>

	{#if !privateKey}
		<p class="text-red-500">No private key loaded. You cannot decrypt files.</p>
	{/if}

	<ul class="space-y-4">
		{#if !showSharedFiles}
			{#each files as file (file.id)}
				<OwnedFileItem {file} {user} {privateKey} {handleShare} />
			{/each}
		{:else}
			{#each sharedFiles as file (file.id)}
				<SharedFileItem {file} {user} {privateKey} />
			{/each}
		{/if}
	</ul>

	{#if status}
		<p class="mt-4">{status}</p>
	{/if}
</div>