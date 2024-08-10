<script>
  import { fade, slide } from "svelte/transition";
  import "bulma/css/bulma.css";
  import "$lib/style/root.scss";

  import Navigation from "$lib/components/Navigation.svelte";
  import PageTransition from "$lib/components/Transition.svelte";

  export let data;
  let visible = true;
  const delay = 250;
</script>

<div class="columns mb-0">
  {#if visible}
    <div
      class="column nav-container"
      in:slide={{ axis: "x", delay }}
      out:slide={{ axis: "x", delay }}
    >
      <Navigation bind:visible />
    </div>
  {/if}
  <div class="column">
    <div class="container mt-5">
      <PageTransition key={data.url}>
        <slot></slot>
      </PageTransition>
    </div>
  </div>
</div>

<style>
  .nav-container {
    height: calc(100vh + var(--bulma-column-gap));
    max-width: calc(var(--bulma-size-1) * 6);
  }
</style>

