<script lang="ts">
	export let data;
	const user = data.user;
</script>
<div class="flex justify-between">
	<a class="ml-2 hover:text-red-500" href="/">Home</a>
	<p>{user.name}</p>
	<a class="mr-2 hover:text-red-500" href="/login">Login</a>
</div>
<div class="flex flex-col items-center justify-center min-h-screen">
	<form method="POST"  enctype="multipart/form-data" class="flex flex-col items-center space-y-4 border border-white p-6">
		<label for="file">Upload File</label>
		<input type="file" name="file" accept="*/*" required class="w-3/4 h-3/4 border hover:border-red-500 p-8">
		<button class="border hover:border-red-500 p-2" type="submit">Upload</button>
	</form>
</div>

