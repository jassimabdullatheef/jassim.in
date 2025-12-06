<script>
  import { navigating } from "$app/stores";
  import "bulma/css/bulma.css";
  import "$lib/style/root.scss";

  import menuIcon from "$lib/icons/menu.svelte";

  import Navigation from "$lib/components/Navigation.svelte";
  import PageTransition from "$lib/components/Transition.svelte";

  export let data;
  let visible = false;
  let innerHeight;
  let innerWidth;

  $: isSmallScreen = innerWidth < 768;

  // On route change
  const onRouteChange = () => {
    visible = false;
  };

  $: if ($navigating) onRouteChange();
</script>

<svelte:window bind:innerHeight bind:innerWidth />

{#if !visible}
  <button
    class="button is-text is-large nav-button"
    on:click={() => (visible = !visible)}
  >
    <span class="icon">
      <svelte:component this={menuIcon} />
    </span>
  </button>
{/if}
<div class="columns mb-0 main-layout">
  <div class={`column nav-container ${visible ? "expanded" : ""}`}>
    <Navigation bind:visible bind:isSmallScreen />
  </div>
  <div class={`column content-container ${visible ? "" : "expanded"}`}>
    <div class="container mt-5">
      <PageTransition key={data.url}>
        <slot></slot>
      </PageTransition>
    </div>
  </div>
</div>

<style scoped lang="scss">
  .nav-container {
    z-index: 100;
  }
</style>
