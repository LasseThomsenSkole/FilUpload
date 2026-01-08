<script lang="ts">
	import { recoverFromMnemonic } from '$lib/auth/recoverPrivateKey.ts';

	export let username: string;
	export let onRecovered: () => void;

	let phrase = '';
	let error: string | null = null;
	let loading = false;

	async function recover() {
		error = null;
		loading = true;

		try {
			await recoverFromMnemonic(username, phrase);
			onRecovered();
		} catch (e) {
			console.error(e);
			error = 'Invalid recovery phrase';
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto mt-10 max-w-md rounded border p-6">
	<h1 class="mb-2 text-xl font-bold">Recover your account</h1>

	<p class="mb-3 text-sm text-gray-400">
		Enter your 12-word recovery phrase to unlock your files on this device.
	</p>

	<textarea
		class="w-full border p-2 font-mono text-sm"
		rows="4"
		bind:value={phrase}
		placeholder="word1 word2 word3 ..."
		disabled={loading}
	>
	</textarea>

	{#if error}
		<p class="mt-2 text-sm text-red-500">{error}</p>
	{/if}

	<button
		class="mt-4 w-full border px-3 py-2 hover:bg-gray-800 disabled:opacity-50"
		on:click={recover}
		disabled={loading}
	>
		{loading ? 'Recovering…' : 'Recover'}
	</button>
</div>
