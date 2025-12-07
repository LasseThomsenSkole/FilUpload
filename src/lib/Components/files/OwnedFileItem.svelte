<script lang="ts">
	export let file;
	export let user;
	export let privateKey;
	export let loading = false;

	import { downloadFile } from '$lib/crypto/downloadFile.ts';
	import ShareInput from '$lib/Components/share/ShareInput.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	export let handleShare: (fileId: string, emails: string[]) => Promise<void>;
	let openShareMenu = false;
	let recipients = new SvelteSet<string>();

	function toggleShareMenu() {
		openShareMenu = !openShareMenu;
	}

</script>

<li class="border p-3">
	<div class="flex justify-between items-center">
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
				<button
					class="border px-3 py-1 hover:bg-gray-800"
					on:click={toggleShareMenu}
				>
					Share
				</button>

				{#if openShareMenu}
					<div class="absolute right-0 mt-2 z-10">
						<ShareInput onShare={(emails) => handleShare(file.id, emails)} />
					</div>
				{/if}
			</div>
		</div>
	</div>
</li>
