<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'idb-keyval';
	import sodium from 'libsodium-wrappers';
	import { shareFileWithRecipients } from '$lib/crypto/shareFile.ts';
	import { SvelteSet } from 'svelte/reactivity';
	import { getUsersFromEmails } from '$lib/helper/getUsersFromEmails.ts';
	import SharedFileItem from '$lib/Components/files/SharedFileItem.svelte';
	import OwnedFileItem from '$lib/Components/files/OwnedFileItem.svelte';
	import { createShareLink } from '$lib/crypto/createShareLink.ts';
	import { goto } from '$app/navigation';

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
	async function handleCreateShareLink(fileId: string, expireInSeconds: number) {
		sharing = true;
		status = "Creating share link...";
		try {
			const ownerPublicKeyB64 = user.publicKey!;
			const sharelinkOBJ = await createShareLink(fileId, ownerPublicKeyB64, privateKey, expireInSeconds);
			console.log(sharelinkOBJ);
			status = "Share link created successfully.";
		} catch (error) {
			console.error("Error creating share link:", error);
			status = "Error creating share link.";
		} finally {
			sharing = false;
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
		<button
			class="border px-3 py-1 hover:bg-gray-800 ml-auto"
			on:click={() => goto('/upload')}
		>
			Upload
		</button>
	</div>

	{#if !privateKey}
		<p class="text-red-500">No private key loaded. You cannot decrypt files.</p>
	{/if}

	<div class="max-w-2xl mx-auto">
		<ul class="space-y-4">
			{#if !showSharedFiles}
				{#if files.length === 0}
					<p>You have no files uploaded.</p>
				{/if}
				{#each files as file (file.id)}
					<OwnedFileItem
						{file}
						{user}
						{privateKey}
						{handleShare}
						{handleCreateShareLink}
					/>
				{/each}
			{:else}
				{#if sharedFiles.length === 0}
					<p>No files have been shared with you.</p>
				{/if}
				{#each sharedFiles as file (file.id)}
					<SharedFileItem {file} {user} {privateKey} />
				{/each}
			{/if}
		</ul>
	</div>


	{#if status}
		<p class="mt-4">{status}</p>
	{/if}
</div>