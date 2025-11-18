<script>
    export let data;
    const user = data.user;
</script>

{#if user?.role === "ADMIN"}
    ADMIN ADMIN ADMIN
{/if}
{#if user?.role === "USER"}
   user user user
{/if}
{user?.name}
