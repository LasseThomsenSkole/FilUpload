<script lang="ts">
	export let onCreateShareLink: (expireInSeconds: number) => Promise<void>;

	let expireInMinutes: number = 15;

	function submit() {
		const expireInSeconds = expireInMinutes * 60;

		if (expireInSeconds <= 0) return;

		onCreateShareLink(expireInSeconds);
	}
</script>

<div class="p-3 border bg-black w-72 rounded">
	<p class="text-sm mb-2 text-gray-300">Link expires in (minutes):</p>

	<div class="flex items-center gap-2 p-2 border border-gray-700 rounded bg-gray-800">
		<input
			type="number"
			min="1"
			class="bg-transparent focus:outline-none text-sm flex-1"
			placeholder="Expiration in minutes…"
			bind:value={expireInMinutes}
		/>
		<span class="text-gray-400 text-sm">min</span>
	</div>

	<button
		class="mt-3 w-full border px-3 py-2 hover:bg-gray-700 rounded"
		on:click={submit}
	>
		Create Share Link
	</button>
</div>
