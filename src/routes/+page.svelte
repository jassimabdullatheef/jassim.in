<script>
  import { onMount } from "svelte";
  import { scale } from "svelte/transition";
  import helloImage from "$lib/images/hello.png";

  import svelteLogo from "$lib/icons/svelte.svelte";
  import bulmaLogo from "$lib/icons/bulma.svelte";

  let ready = false;
  onMount(() => (ready = true));
</script>

<svelte:head>
  <title>Jassim Abdul Latheef</title>
</svelte:head>

<div>
  <div
    class="title-wrapper is-flex is-justify-content-center is-flex-direction-column is-align-items-center"
  >
    {#if ready}
      <h1 class="title" in:scale={{ start: 0.8, delay: 0, duration: 1500 }}>
        &#60;Hello World!&#62;
      </h1>
    {/if}
  </div>
  <section class="block">
    <div class="box">
      <div class="is-flex-tablet">
        <div class="mr-5 pt-3 hello-image">
          <img src={helloImage} alt="Hello" />
        </div>
        <div>
          <h2 class="is-size-1-tablet is-size-3-mobile mb-6">Hi, Im Jassim.</h2>
          <p class="is-size-4-mobile is-size-3-tablet content">
            Welcome to my corner of the web. I’m a curious tech enthusiast who
            enjoys exploring a wide range of interests. This space is more of a
            personal archive, a place where I jot down discoveries and
            experiments as I navigate through various projects and ideas.
          </p>
          <p></p>
          <p class="is-size-4-mobile is-size-3-tablet content">
            This space here is just to share what I’m working on and learning as
            I go. Feel free to browse around and see what I’ve been up to. Who
            knows, maybe you’ll find something interesting too.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="block">
    <div class="is-flex attributions">
      <div class="is-flex is-align-items-center">
        <p>Built with</p>
        <a href="https://bulma.io/" class="p-4" target="_blank">
          <svelte:component this={bulmaLogo} />
        </a>
        <a href="https://svelte.dev/" class="p-4" target="_blank">
          <svelte:component this={svelteLogo} />
        </a>
      </div>
    </div>
  </section>
</div>

<style scoped lang="scss">
  @use "bulma/sass/utilities/mixins";
  .title-wrapper {
    position: relative;
    min-height: 90vh;

    @include mixins.mobile {
      min-height: 60vh;
    }
  }

  .title {
    position: relative;
    font-size: 8vw;
    font-weight: var(--bulma-title-weight);
    background-image: url("$lib/images/gradient-bg.webp");
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

  .box {
    box-shadow: none;
    padding: 6em;
    background: linear-gradient(
      160deg,
      rgb(142 136 156 / 8%),
      rgb(44 25 113 / 18%)
    );
    box-sizing: content-box;

    @include mixins.mobile {
      padding: 1em;
    }

    .hello-image {
      width: var(--bulma-size-1);
      min-width: var(--bulma-size-1);
    }
  }
</style>
