<script lang="ts">
	import { signIn } from '$lib/auth/signIn';
	import { signUp } from '$lib/auth/signUp';
	import { get as idbGet } from 'idb-keyval';
	import WordPhraseDialog from '$lib/Components/login/WordPhraseDialog.svelte';
	import RecoverPrivateKey from '$lib/Components/login/RecoverPrivateKey.svelte';
	import { goto } from '$app/navigation';

	let step: 'signin' | 'signup' | 'mnemonic' | 'recover' = 'signin';

	let name = '';
	let email = '';
	let password = '';
	let mnemonic: string | null = null;
	let error: string | null = null;
	let loading = false;

	async function handleSignIn() {
		error = null;
		loading = true;

		try {
			const session = await signIn(email, password, false);
			name = session.user.name;
			if ((await idbGet(`${name}_privateKey`)) === undefined) {
				step = 'recover';
			} else {
				await goto('/download');
			}
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function handleSignUp() {
		error = null;
		loading = true;

		try {
			const result = await signUp(name, email, password);
			mnemonic = result.mnemonic;
			step = 'mnemonic';
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	}
</script>

{#if step === 'signin'}
	<form onsubmit={handleSignIn} class="mx-auto mt-10 max-w-md border p-6">
		<h1 class="mb-4 text-2xl font-bold">Sign In</h1>
		<div class="mb-4">
			<label for="email" class="mb-1 block text-sm font-medium">Email</label>
			<input type="email" bind:value={email} id="email" name="email" class="border" />
			<label for="password" class="mb-1 block text-sm font-medium">Password</label>
			<input type="password" bind:value={password} id="password" name="password" class="border" />
			<button class="">Sign In</button>

			<p class="mt-3 text-sm">
				Dont have an account?
				<button class="hover:text-red-600" type="button" onclick={() => (step = 'signup')}>
					Register here
				</button>
			</p>
		</div>
		{#if error}
			<p class="mb-4 text-red-500">{error}</p>
		{/if}
	</form>
{:else if step === 'signup'}
	<form onsubmit={handleSignUp} class="mx-auto mt-10 max-w-md border p-6">
		<h1 class="mb-4 text-2xl font-bold">Sign Up</h1>
		<div class="mb-4">
			<label for="name" class="mb-1 block text-sm font-medium">Name</label>
			<input type="text" bind:value={name} id="email" name="email" class="border" />
			<label for="email" class="mb-1 block text-sm font-medium">Email</label>
			<input type="email" bind:value={email} id="email" name="email" class="border" />
			<label for="password" class="mb-1 block text-sm font-medium">password</label>
			<input type="password" bind:value={password} id="password" name="password" class="border" />
			<button class="">Sign Up</button>
			<p class="mt-3 text-sm">
				Already have an account?
				<button type="button" onclick={() => (step = 'signin')}> Sign in </button>
			</p>
		</div>
		{#if error}
			<p class="mb-4 text-red-500">{error}</p>
		{/if}
	</form>
{/if}
{#if step === 'mnemonic' && mnemonic}
	<div class="mx-auto mt-10 max-w-md">
		<WordPhraseDialog {mnemonic} />
	</div>
{/if}
{#if step === 'recover'}
	<div class="mx-auto mt-10 max-w-md">
		<RecoverPrivateKey username={name} onRecovered={() => goto('/download')} />
	</div>
{/if}
