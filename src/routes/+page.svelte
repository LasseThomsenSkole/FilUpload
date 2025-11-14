<script lang="ts">
    import { signIn} from "$lib/auth/signIn";
    import {signUp} from "$lib/auth/signUp.ts";
    let name = "";
    let email = "";
    let password = "";
    let _error: string | null = null;
    let isSignIn = true;
    let result = null;
    async function handleSubmit() {
        try {
            if (!isSignIn) {
                result = await signUp(name, email, password);
            }else{
                result = await signIn( email, password, false );
            }
        }catch (error: any) {
            _error = error.message;
            console.error("An unexpected error occurred:", error);
        }
    }
</script>
{#if isSignIn}
    <form onsubmit={handleSubmit} class="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-4">Sign In</h1>
        <div class="mb-4">
            <input type="checkbox" bind:checked={isSignIn} />

            <label for="email" class="block text-sm font-medium mb-1">Email</label>
            <input type="email" bind:value={email} id="email" name="email" class="border" />
            <label for="password" class="block text-sm font-medium mb-1">password</label>
            <input type="password" bind:value={password} id="password" name="password" class="border"/>
            <button class="">Sign In</button>
        </div>
        {#if _error}
            <p class="text-red-500 mb-4">{_error}</p>
        {/if}
    </form>

{:else}
    <form onsubmit={handleSubmit} class="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-4">Sign Up</h1>
        {#if result != null}
            <p class="text-green-500 mb-4">Sign up successful!</p>
        {/if}
        <div class="mb-4">
            <input type="checkbox" bind:checked={isSignIn} />
            <label for="name" class="block text-sm font-medium mb-1">Name</label>
            <input type="text" bind:value={name} id="email" name="email" class="border" />
            <label for="email" class="block text-sm font-medium mb-1 ">Email</label>
            <input type="email" bind:value={email} id="email" name="email" class="border" />
            <label for="password" class="block text-sm font-medium mb-1">password</label>
            <input type="password" bind:value={password} id="password" name="password" class="border" />
            <button class="">Sign Up</button>
        </div>
        {#if _error}
            <p class="text-red-500 mb-4">{_error}</p>
        {/if}
    </form>
{/if}