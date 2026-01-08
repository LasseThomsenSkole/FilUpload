<script lang="ts">
	import CreateShareLink from '$lib/Components/share/CreateShareLink.svelte';

	export let file;
	export let user;
	export let privateKey;
	export let loading = false;

	import { downloadFile } from '$lib/crypto/downloadFile.ts';
	import ShareInput from '$lib/Components/share/ShareInput.svelte';
	export let handleShare: (fileId: string, emails: string[]) => Promise<void>;
	export let handleCreateShareLink: (fileId: string, expireIn: number) => Promise<void>;
	let openShareMenu = false;
	let openCreateShareLinkMenu = false;

	function toggleShareMenu() {
		openCreateShareLinkMenu = false;
		openShareMenu = !openShareMenu;
	}
	function toggleCreateShareLinkMenu() {
		openShareMenu = false;
		openCreateShareLinkMenu = !openCreateShareLinkMenu;
	}
</script>

<li class="border p-3">
	<div class="flex items-center justify-between">
		<div>
			<p class="font-semibold">{file.id}</p>
			<p class="text-sm text-gray-400">{file.createdAt.toLocaleDateString()}</p>
		</div>

		<div class="relative flex items-center gap-2">
			<button
				class="border px-3 py-1 hover:bg-gray-800"
				on:click={() => downloadFile(file.id, user.publicKey, privateKey)}
				disabled={loading}
			>
				Download
			</button>

			<div class="relative inline-block">
				<button class="border px-3 py-1 hover:bg-gray-800" on:click={toggleShareMenu}>
					Share
				</button>
				<button class="border px-3 py-1 hover:bg-gray-800" on:click={toggleCreateShareLinkMenu}>
					Create Share Link
				</button>

				{#if openShareMenu}
					<div class="absolute right-0 z-10 mt-2">
						<ShareInput onShare={(emails) => handleShare(file.id, emails)} />
					</div>
				{/if}
				{#if openCreateShareLinkMenu}
					<div class="absolute right-0 z-10 mt-2">
						<CreateShareLink
							onCreateShareLink={(minutes) => handleCreateShareLink(file.id, minutes)}
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>
</li>
