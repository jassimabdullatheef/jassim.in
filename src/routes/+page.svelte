<script>
  import { onMount } from "svelte";
  import { scale } from "svelte/transition";
  import { gsap } from "gsap";
  import helloImage from "$lib/images/hello.png";

  import { GooCursor } from "$lib/utils/cursor.js";

  import svelteLogo from "$lib/icons/svelte.svelte";
  import bulmaLogo from "$lib/icons/bulma.svelte";
  import aboutIcon from "$lib/icons/person.svelte";
  import penIcon from "$lib/icons/pen.svelte";
  import musicIcon from "$lib/icons/music.svelte";
  import cameraIcon from "$lib/icons/camera.svelte";
  import projectsIcon from "$lib/icons/projects.svelte";
  import bookIcon from "$lib/icons/book.svelte";

  const navLinks = [
    { text: "About", url: "/about", icon: aboutIcon },
    { text: "Projects", url: "/projects", icon: projectsIcon },
    { text: "Blog", url: "/blog", icon: penIcon },
    { text: "Library", url: "/library", icon: bookIcon },
    { text: "Music", url: "/music", icon: musicIcon },
    { text: "Photography", url: "/photography", icon: cameraIcon },
  ];

  let ready = false;
  let cursorEl = null;
  let goo = null;

  onMount(() => {
    ready = true;
  });

  const handleCursorClick = () => {
    console.log("clicked");
    if (!goo) {
      goo = new GooCursor(cursorEl);
    }


    gsap
      .timeline()
      .addLabel("start", 0)
      .to(
        goo.DOM.cells,
        {
          duration: 1,
          ease: "power4",
          opacity: 1,
          stagger: {
            from: [...goo.DOM.cells].indexOf(goo.getCellAtCursor()),
            each: 0.02,
            grid: [goo.rows, goo.columns],
          },
        },
        "start"
      )
      .to(
        goo.DOM.cells,
        {
          duration: 1,
          ease: "power1",
          opacity: 0,
          stagger: {
            from: [...goo.DOM.cells].indexOf(goo.getCellAtCursor()),
            each: 0.03,
            grid: [goo.rows, goo.columns],
          },
        },
        "start+=0.3"
      );
  };

  $: if (cursorEl && typeof window !== "undefined") {
    goo = new GooCursor(cursorEl);
  }
</script>

<svelte:head>
  <title>Jassim Abdul Latheef</title>
</svelte:head>

<div>
  <div
    class="title-wrapper is-flex is-justify-content-center is-flex-direction-column is-align-items-center mb-6"
  >
    {#if ready}
      <h1 class="title" in:scale={{ start: 0.8, delay: 0, duration: 1500 }}>
        &#60;Hello World!&#62;
      </h1>
    {/if}
    <div class="cursor" bind:this={cursorEl} on:click={handleCursorClick}>
      <div class="cursor__inner">
        <!-- cursor__inner-box elements come here -->
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="gooey">
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation="3.2"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
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

  <section class="block nav-section">
    <div class="columns is-multiline">
      {#each navLinks as { text, url, icon }}
        <div class="column is-4-desktop is-6-tablet is-12-mobile">
          <a href={url} class="nav-card">
            <span class="nav-card-icon">
              <svelte:component this={icon} />
            </span>
            <span class="nav-card-label">{text}</span>
          </a>
        </div>
      {/each}
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

  :root {
    --primary_blue: rgba(0, 0, 255, 0.8);
    --secondary_yellow: rgba(255, 255, 0, 0.4);
    --page-padding: 1rem;
    --columns: 20;
    --cursor-radius: 0;
    --color-text: #cdbcbc;
    --color-bg: #000;
    --color-link: #fff;
    --color-link-hover: #fff;
    --cursor-bg: rgb(195, 163, 227);
    --cursor-blend-mode: exclusion;
    --gradient-text-1: var(--secondary_yellow);
    --gradient-text-2: var(--primary_blue);
  }

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
      color: var(--primary_blue);
    }
    &:after {
      color: var(--secondary_yellow);
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

  .nav-section {
    padding: 0 1.5rem;
  }

  .nav-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-radius: 8px;
    background: linear-gradient(160deg, rgb(142 136 156 / 6%), rgb(44 25 113 / 12%));
    border: 1px solid rgba(255, 255, 255, 0.06);
    text-decoration: none;
    color: inherit;
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: linear-gradient(160deg, rgb(142 136 156 / 14%), rgb(44 25 113 / 24%));
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
      color: inherit;
    }
  }

  .nav-card-icon {
    display: flex;
    align-items: center;
    opacity: 0.7;
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;

    :global(svg) {
      width: 100%;
      height: 100%;
    }
  }

  .nav-card-label {
    font-size: 1.1rem;
    font-weight: 500;
  }

  .cursor {
    height: 100%;
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
    pointer-events: auto;
    border-radius: 20px;
    overflow: hidden;
    z-index: 10;
    mix-blend-mode: var(--cursor-blend-mode);
    --size: calc((100vw - 160px) / var(--columns));
    background-image: url("$lib/images/home-bg.jpg");
    background-size: contain;
    background-position: bottom;
    background-repeat: no-repeat;
    background-color: var(--color-bg);

    @include mixins.mobile {
      --size: calc((100vw - 40px) / var(--columns));
    }

    .cursor__inner {
      display: grid;
      grid-template-columns: repeat(var(--columns), var(--size));
    }
    :global(.cursor__inner-box) {
      width: var(--size);
      height: var(--size);
      background: var(--cursor-bg);
      opacity: 0;
      border-radius: var(--cursor-radius);
      mix-blend-mode: difference;
    }
  }
</style>
