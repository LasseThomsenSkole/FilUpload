<script lang="ts">
	import { downloadFile } from '$lib/crypto/downloadFile.ts';
	import { onMount } from 'svelte';
	import { get } from 'idb-keyval';
	import sodium from 'libsodium-wrappers';
	import { shareFileWithRecipients } from '$lib/crypto/shareFile.ts';
	import { SvelteSet } from 'svelte/reactivity';
	import ShareInput from '$lib/Components/share/ShareInput.svelte';

	export let data;

	let user = data.user;
	let files = data.files;

	let privateKey: string = "";
	let status = "";
	let loading = false;
	let sharing = false;

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

	async function handleShare(fileId: string) { //todo brug emails
		sharing = true;
		status = "Sharing file...";
		try {
			const recipientsId = Array.from(selectedRecipients[fileId]?.values() || []);
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
	<h1 class="text-2xl font-bold mb-4">Your Files</h1>

	{#if !privateKey}
		<p class="text-red-500">No private key loaded. You cannot decrypt files.</p>
	{/if}

	<ul class="space-y-4">
		{#each files as file (file.id)}
			<li class="border p-3">
				<div class="flex justify-between items-center">
					<div>
						<p class="font-semibold">{file.id}</p>
						<p class="text-sm text-gray-400">{file.createdAt.toLocaleDateString()}</p>
					</div>
					<div class="relative">
						<button
							class="border px-3 py-1 hover:bg-gray-800"
							on:click={() => downloadFile(file.id, user.publicKey, privateKey )}
							disabled={loading}
						>
							Download
						</button>

						{#if file.ownerId === user.id}
							<div class="relative inline-block">
								<button
									class="ml-2 border px-3 py-1 hover:bg-gray-800"
									on:click={() => toggleShareMenu(file.id)}
								>
									Share
								</button>
								{#if openShareMenuForFile === file.id}
									<div class="absolute right-0 mt-2 z-10">
										<ShareInput onShare={(emails) => handleShare(file.id, emails)} />
									</div>
								{/if}
							</div>

						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ul>

	{#if status}
		<p class="mt-4">{status}</p>
	{/if}
</div>