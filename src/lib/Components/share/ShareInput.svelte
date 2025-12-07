<script lang="ts">
	export let onShare: (recipients: string[]) => void;

	let recipients: string[] = [];
	let inputValue = "";

	function addRecipient() {
		if (!inputValue) return;

		const email = inputValue.trim().toLowerCase();

		if (!email.includes("@")) {
			inputValue = "";
			return;
		}

		if (!recipients.includes(email)) {
			recipients = [...recipients, email];
		}

		inputValue = "";
	}

	function removeRecipient(email: string) {
		recipients = recipients.filter((r) => r !== email);
	}

	function submit() {
		if (inputValue) addRecipient();
		if (recipients.length > 0) {
			onShare(recipients);
		}
	}
</script>

<div class="p-3 border bg-black w-72">
	<p class="text-sm mb-2">Share with:</p>

	<div
		class="flex flex-wrap items-center gap-2 p-2 border"
	>
		{#each recipients as email (email)}
			<div class="flex items-center px-2 py-1 rounded text-sm border">
				{email}
				<button
					class="ml-1 text-red-400 hover:text-red-300"
					on:click={() => removeRecipient(email)}
				>
					x
				</button>
			</div>
		{/each}

		<input
			class="bg-transparent focus:outline-none text-sm flex-1"
			placeholder="Enter email…"
			bind:value={inputValue}
			on:keydown={(e) => e.key === "Enter" && addRecipient()}
		/>
	</div>

	<button
		class="mt-3 w-full border px-3 py-2 hover:bg-gray-800 rounded"
		on:click={submit}
	>
		Share
	</button>
</div>
