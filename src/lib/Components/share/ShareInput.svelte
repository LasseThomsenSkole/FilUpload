<script lang="ts">
	export let onShare: (recipients: string[]) => void;

	let recipients: string[] = [];
	let inputValue = '';

	function addRecipient() {
		if (!inputValue) return;

		const email = inputValue.trim().toLowerCase();

		if (!email.includes('@')) {
			inputValue = '';
			return;
		}

		if (!recipients.includes(email)) {
			recipients = [...recipients, email];
		}

		inputValue = '';
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

<div class="w-72 border bg-black p-3">
	<p class="mb-2 text-sm">Share with:</p>

	<div class="flex flex-wrap items-center gap-2 border p-2">
		{#each recipients as email (email)}
			<div class="flex items-center rounded border px-2 py-1 text-sm">
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
			class="flex-1 bg-transparent text-sm focus:outline-none"
			placeholder="Enter email…"
			bind:value={inputValue}
			on:keydown={(e) => e.key === 'Enter' && addRecipient()}
		/>
	</div>

	<button class="mt-3 w-full rounded border px-3 py-2 hover:bg-gray-800" on:click={submit}>
		Share
	</button>
</div>
