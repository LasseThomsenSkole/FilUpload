<script lang="ts">
	export let file;
	export let user;
	export let privateKey;
	export let loading = false;

	import { downloadFile } from '$lib/crypto/downloadFile.ts';
</script>

<li class="border p-3 bg-gray-800/30">
	<div class="flex justify-between items-center">
		<div>
			<p class="font-semibold">{file.id}</p>
			<p class="text-sm text-gray-400">Shared by {file.ownerId}</p>
		</div>

		<div>
			<button
				class="border px-3 py-1 hover:bg-gray-800"
				on:click={() => downloadFile(file.id, user.publicKey, privateKey)}
				disabled={loading}
			>
				Download
			</button>
		</div>
	</div>
</li>
