<script lang="ts">
	import '../app.css';
	import logo from '$lib/assets/logo.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={logo} />
	<title>EE2E filupload</title>
</svelte:head>

{@render children()}
