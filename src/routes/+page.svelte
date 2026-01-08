<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/auth-client.ts';

	export let data;
	const user = data.user;
</script>

<div class="flex min-h-screen items-center justify-center px-6">
	<div class="w-full max-w-xl text-center">
		<h1 class="mb-4 text-3xl font-bold">
			Secure file sharing.
			<span class="block text-gray-400"> End-to-end encrypted. </span>
		</h1>

		<p class="mb-8 text-gray-400">
			Upload, share, and manage confidential files. Only you and your recipients can read them not
			even the server.
		</p>

		{#if user}
			<div class="flex flex-col justify-center gap-3 sm:flex-row">
				<button class="border px-5 py-2 hover:bg-gray-800" on:click={() => goto('/download')}>
					Go to your files
				</button>

				<button class="border px-5 py-2 hover:bg-gray-800" on:click={() => goto('/upload')}>
					Upload a file
				</button>
			</div>
			<button
				class="mt-4 text-sm text-gray-400 hover:text-white"
				on:click={async () =>
					await authClient.signOut({
						fetchOptions: {
							onSuccess: () => {
								window.location.reload();
							}
						}
					})}
			>
				Log out
			</button>
		{:else}
			<div class="flex flex-col justify-center gap-3 sm:flex-row">
				<button class="border px-5 py-2 hover:bg-gray-800" on:click={() => goto('/register')}>
					Get started
				</button>

				<button class="border px-5 py-2 hover:bg-gray-800" on:click={() => goto('/login')}>
					Log in
				</button>
			</div>
		{/if}
	</div>
</div>
