<script lang="ts">
	export let onCreateShareLink: (expireInSeconds: number) => Promise<void>;

	let expireInMinutes: number = 15;

	function submit() {
		const expireInSeconds = expireInMinutes * 60;

		if (expireInSeconds <= 0) return;

		onCreateShareLink(expireInSeconds);
	}
</script>

<div class="w-72 border bg-black p-3">
	<p class="mb-2 text-sm">Link expires in:</p>

	<div class="flex items-center gap-2 border p-2">
		<input
			type="number"
			min="1"
			class="flex-1 bg-transparent text-sm focus:outline-none"
			placeholder="Expiration in minutes…"
			bind:value={expireInMinutes}
		/>
		<span class="text-sm">min</span>
	</div>

	<button class="mt-3 w-full border px-3 py-2 hover:bg-gray-700" on:click={submit}>
		Create and Copy Share Link
	</button>
</div>
