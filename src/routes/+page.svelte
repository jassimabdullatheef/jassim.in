<script>
  import { onMount } from "svelte";
  import { scale } from "svelte/transition";

  let ready = false;
  onMount(() => (ready = true));
</script>

<svelte:head>
  <title>Jassim Abdul Latheef</title>
</svelte:head>

<div
  class="title-wrapper is-flex is-justify-content-center is-flex-direction-column is-align-items-center"
>
  {#if ready}
    <h1 class="title" in:scale={{ start: 0.8, delay: 0, duration: 1500 }}>
      &#60;Hello World!&#62;
    </h1>
    <h2>Hi, Im Jassim.</h2>
  {/if}
</div>

<style scoped style="scss">
  .title-wrapper {
    position: relative;
    min-height: 80vh;
  }

  .title {
    position: relative;
    font-size: 8em;
    font-weight: var(--bulma-title-weight);
    background-image: url($lib/images/gradient-bg.webp);
    -webkit-background-clip: text;
    background-clip: text;
    background-size: cover;
    color: transparent;
    -webkit-animation: motion 3s infinite alternate;
    animation: motion 3s infinite alternate;

    &:before,
    &:after {
      position: absolute;
      content: "<Hello World!>";
      top: 0;
      left: 0;
      z-index: -1;
      transform: translate(0%, 0%);
    }

    &:before {
      color: rgba(0, 0, 255, 0.8);
    }
    &:after {
      color: rgba(255, 255, 0, 0.4);
    }

    &:before {
      animation-name: distort1;
      animation-duration: 10s;
      animation-iteration-count: infinite;
    }
    &:after {
      animation-name: distort2;
      animation-duration: 10s;
      animation-delay: 0.2s;
      animation-iteration-count: infinite;
    }
  }
</style>
