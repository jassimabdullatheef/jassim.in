<script>
  import { slide, blur } from "svelte/transition";

  export let key;
  export let duration = 200;
</script>

{#key key}
  <div in:blur={{ duration, delay: duration }} out:blur={{ duration }}>
    <slot />
  </div>
{/key}

<style scoped>
  div {
    position: absolute;
    inset: 0;
  }
</style>
