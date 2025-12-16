<script lang="ts">
	import { signIn } from "$lib/auth/signIn";
	import { signUp } from "$lib/auth/signUp";
	import { get as idbGet } from 'idb-keyval';
	import WordPhraseDialog from '$lib/Components/login/WordPhraseDialog.svelte';
	import RecoverPrivateKey from '$lib/Components/login/RecoverPrivateKey.svelte';
	import { goto } from '$app/navigation';

	let step: 'signin' | 'signup' | 'mnemonic' | 'recover' = 'recover';

	let name = "";
	let email = "";
	let password = "";
	let mnemonic: string | null = null;
	let error: string | null = null;
	let loading = false;

	async function handleSignIn() {
		error = null;
		loading = true;

		try {
			const session = await signIn(email, password, false);
			name = session.user.name;
			if (await idbGet(`${name}_privateKey`) === undefined) {
				step = 'recover';
			}else{
				await goto('/download')
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
{#if step === "signin"}
	<form onsubmit={handleSignIn} class="max-w-md mx-auto mt-10 p-6 border">
		<h1 class="text-2xl font-bold mb-4">Sign In</h1>
		<div class="mb-4">
			<label for="email" class="block text-sm font-medium mb-1">Email</label>
			<input type="email" bind:value={email} id="email" name="email" class="border" />
			<label for="password" class="block text-sm font-medium mb-1">Password</label>
			<input type="password" bind:value={password} id="password" name="password" class="border"/>
			<button class="">Sign In</button>

			<p class="text-sm mt-3">
				Dont have an account?
				<button class="hover:text-red-600" type="button" onclick={() => step = 'signup'}>
					Register here
				</button>
			</p>
		</div>
		{#if error}
			<p class="text-red-500 mb-4">{error}</p>
		{/if}
	</form>

{:else if step === "signup"}
	<form onsubmit={handleSignUp} class="max-w-md mx-auto mt-10 p-6 border">
		<h1 class="text-2xl font-bold mb-4">Sign Up</h1>
		<div class="mb-4">
			<label for="name" class="block text-sm font-medium mb-1">Name</label>
			<input type="text" bind:value={name} id="email" name="email" class="border" />
			<label for="email" class="block text-sm font-medium mb-1 ">Email</label>
			<input type="email" bind:value={email} id="email" name="email" class="border" />
			<label for="password" class="block text-sm font-medium mb-1">password</label>
			<input type="password" bind:value={password} id="password" name="password" class="border" />
			<button class="">Sign Up</button>
			<p class="text-sm mt-3">
				Already have an account?
				<button type="button" onclick={() => step = 'signin'}>
					Sign in
				</button>
			</p>
		</div>
		{#if error}
			<p class="text-red-500 mb-4">{error}</p>
		{/if}
	</form>
{/if}
{#if step === "mnemonic" && mnemonic}
	<div class="mt-10 mx-auto max-w-md">
		<WordPhraseDialog {mnemonic} />
	</div>
{/if}
{#if step === "recover"}
	<div class="mt-10 mx-auto max-w-md">
		<RecoverPrivateKey username={name} onRecovered={() => goto('/download')} />
	</div>
{/if}