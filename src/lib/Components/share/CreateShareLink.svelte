<script lang="ts">
	export let onCreateShareLink: (expireInSeconds: number) => Promise<void>;

	let expireInMinutes: number = 15;

	function submit() {
		const expireInSeconds = expireInMinutes * 60;

		if (expireInSeconds <= 0) return;

		onCreateShareLink(expireInSeconds);
	}
</script>

<div class="p-3 border bg-black w-72">
	<p class="text-sm mb-2">Link expires in: </p>

	<div class="flex items-center gap-2 p-2 border">
		<input
			type="number"
			min="1"
			class="bg-transparent focus:outline-none text-sm flex-1"
			placeholder="Expiration in minutes…"
			bind:value={expireInMinutes}
		/>
		<span class="text-sm">min</span>
	</div>

	<button
		class="mt-3 w-full border px-3 py-2 hover:bg-gray-700"
		on:click={submit}
	>
		Create and Copy Share Link
	</button>
</div>
