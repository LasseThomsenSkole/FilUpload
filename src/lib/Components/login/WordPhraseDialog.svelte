<script lang="ts">
	import { goto } from '$app/navigation';

	export let mnemonic: string;

	function copyToClipboard() {
		if (mnemonic) {
			navigator.clipboard
				.writeText(mnemonic)
				.then(() => {
					alert('Word phrase copied to clipboard');
				})
				.catch((err) => {
					console.error('Could not copy text: ', err);
				});
		}
	}
</script>

{#if mnemonic === null || mnemonic === undefined}
	<p>Loading...</p>
{:else}
	<div class="mx-auto flex h-64 w-64 flex-col border p-4">
		<div class="flex items-center justify-between">
			<h1 class="text-center">Your word phrase</h1>
			<button class="hover:text-red-600" on:click={copyToClipboard}> Copy </button>
		</div>
		<p class="mt-4 border p-2">
			{mnemonic}
		</p>
		<p class="mt-2 text-sm text-gray-300">
			Copy the phrase and keep it safe. You will need it to login on other devices.
		</p>
		<button
			on:click={async () => await goto('/upload')}
			class="mt-auto text-sm text-white underline hover:text-gray-300"
		>
			I have safely stored my word phrase
		</button>
	</div>
{/if}
