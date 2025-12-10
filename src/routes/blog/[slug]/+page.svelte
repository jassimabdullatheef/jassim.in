<script>
  import { onMount } from "svelte";

  import Button from "$lib/components/Button.svelte";

  export let data;

  let scrolled = false;
  let scrollThreshold = 200; // Show buttons after scrolling 200px

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleScroll() {
    scrolled = window.scrollY > scrollThreshold;
  }

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });
</script>

<svelte:head>
  <title>{data.post.frontmatter.title} | Blog</title>
  {#if data.post.frontmatter.excerpt}
    <meta name="description" content={data.post.frontmatter.excerpt} />
  {/if}
</svelte:head>

<section class="container article-container">
  <article>
    <Button href="/blog" icon="←" iconPosition="left">Back to Blog</Button>

    <div
      class="is-flex is-justify-content-space-between is-align-items-start mb-4"
    >
      <h1 class="is-size-1-tablet is-size-3-mobile mb-0">
        {data.post.frontmatter.title}
      </h1>
      {#if data.post.frontmatter.category}
        <span class="tag is-primary ml-3">
          {data.post.frontmatter.category}
        </span>
      {/if}
    </div>

    {#if data.post.frontmatter.date}
      <p class="is-size-6 has-text-grey mb-5">
        {new Date(data.post.frontmatter.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    {/if}

    <hr class="mb-6" />

    <div class="content blog-content">
      {@html data.post.content}
    </div>
  </article>
</section>

{#if scrolled}
  <div class="post-navigation">
    <div class="nav-container">
      <Button onClick={scrollToTop} icon="↑" iconPosition="left">
        Back to Top
      </Button>
      {#if data.nextPost}
        <Button href="/blog/{data.nextPost.slug}" icon="→" iconPosition="right">
          Read Next
        </Button>
      {/if}
    </div>
  </div>
{/if}

<style scoped lang="scss">
  .article-container {
    padding-bottom: 7rem;
  }
  .blog-content {
    line-height: 1.75em;

    :global(h1) {
      font-size: 2em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    :global(h2) {
      font-size: 1.75em;
      margin-top: 1.25em;
      margin-bottom: 0.5em;
    }

    :global(h3) {
      font-size: 1.5em;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    :global(p) {
      margin-bottom: 1em;
    }

    :global(ul),
    :global(ol) {
      font-size: 1.2em;
      margin-left: 2em;
      margin-bottom: 1em;
    }

    :global(li) {
      margin-bottom: 0.5em;
    }

    :global(code) {
      background-color: rgba(0, 0, 0, 0.1);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: "Courier New", monospace;
      font-size: 0.9em;
    }

    :global(pre) {
      background-color: rgba(0, 0, 0, 0.1);
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1em;
    }

    :global(pre code) {
      background-color: transparent;
      padding: 0;
    }

    :global(blockquote) {
      border-left: 4px solid var(--color-blue);
      padding-left: 1em;
      margin-left: 0;
      margin-bottom: 1em;
      font-style: italic;
    }

    :global(a) {
      color: hsl(var(--bulma-link-h), var(--bulma-link-s), 50%);
      background: var(--color-blue);
      background: linear-gradient(
        45deg,
        var(--color-blue) 0%,
        var(--color-yellow) 100%
      );
      background-clip: text;
      background-fill-color: transparent;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-decoration: none;
      transition: all 0.2s ease-in-out;
      display: inline-block;
      position: relative;
    }

    :global(a::before) {
      content: "";
      position: absolute;
      width: 100%;
      height: 2px;
      bottom: 0;
      left: 0;
      background: linear-gradient(
        45deg,
        var(--color-blue) 0%,
        var(--color-yellow) 100%
      );
      visibility: hidden;
      transform: scaleX(0);
      transition: all 0.2s ease-in-out;
    }

    :global(a:hover) {
      background: linear-gradient(
        230deg,
        var(--color-blue) 0%,
        var(--color-yellow) 100%
      );
      background-clip: text;
      background-fill-color: transparent;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0px 0px 4px rgba(255, 255, 255, 0.5);
    }

    :global(a:hover::before) {
      visibility: visible;
      transform: scaleX(1);
      background: linear-gradient(
        90deg,
        var(--color-blue) 0%,
        var(--color-yellow) 100%
      );
    }

    :global(img) {
      max-width: 100%;
      height: auto;
      border-radius: 5px;
      margin: 1.5em 0;
    }

    /* Sidenote styles */
    :global(.sidenote-ref) {
      position: relative;
      display: inline;
      cursor: help;
    }

    :global(.sidenote-marker) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-blue);
      cursor: help;
      margin-left: 0.3em;
      vertical-align: super;
      transition: color 0.2s ease-in-out;
      line-height: 1;
    }

    :global(.sidenote-marker .sidenote-icon) {
      width: 1em;
      height: 1em;
      display: inline-block;
      vertical-align: middle;
    }

    :global(.sidenote-ref:hover .sidenote-marker) {
      color: var(--color-yellow);
    }

    :global(.sidenote-content) {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-8px);
      background: rgba(0, 0, 0, 0.9);
      color: #fff;
      padding: 0.75em 1em;
      border-radius: 6px;
      font-size: 0.85em;
      line-height: 1.5;
      white-space: normal;
      width: 280px;
      max-width: 90vw;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition:
        opacity 0.2s ease-in-out,
        visibility 0.2s ease-in-out,
        transform 0.2s ease-in-out;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    /* Allow links in sidenotes to be clickable and styled */
    :global(.sidenote-content a) {
      pointer-events: auto;
      color: #77d2ff;
      text-decoration: underline;
      transition: color 0.2s ease-in-out;
    }

    :global(.sidenote-content a:hover) {
      color: #fde72d;
    }

    /* Arrow pointing down */
    :global(.sidenote-content::after) {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.9);
    }

    :global(.sidenote-ref:hover .sidenote-content) {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(-12px);
    }

    /* Mobile: show sidenotes inline instead of on hover */
    @media (max-width: 768px) {
      :global(.sidenote-content) {
        position: static;
        display: block;
        opacity: 1;
        visibility: visible;
        transform: none;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
        width: 100%;
        max-width: 100%;
      }

      :global(.sidenote-content::after) {
        display: none;
      }

      :global(.sidenote-marker) {
        display: none;
      }

      :global(.sidenote-ref) {
        display: block;
      }
    }

    /* PS Note styles - personalized feel */
    :global(.ps-note) {
      margin: 3em 0 2em 0;
      padding: 2em 2.5em;
      background: linear-gradient(
        135deg,
        rgba(119, 210, 255, 0.08) 0%,
        rgba(253, 231, 45, 0.05) 100%
      );
      border-left: 4px solid var(--color-blue);
      border-radius: 8px;
      position: relative;
      font-style: italic;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease-in-out;

      &:hover {
        box-shadow: 0 4px 16px rgba(119, 210, 255, 0.15);
        transform: translateX(4px);
      }

      &::before {
        content: "";
        position: absolute;
        top: -2px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: radial-gradient(
          circle,
          rgba(119, 210, 255, 0.2) 0%,
          transparent 70%
        );
        border-radius: 50%;
        opacity: 0.6;
      }
    }

    :global(.ps-label) {
      font-family: "Courier New", "Georgia", serif;
      font-size: 1.1em;
      font-weight: bold;
      color: var(--color-blue);
      margin-bottom: 0.8em;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-style: normal;
      display: flex;
      align-items: center;

      &::after {
        content: "";
        flex: 1;
        height: 1px;
        background: linear-gradient(
          to right,
          var(--color-blue) 0%,
          transparent 100%
        );
        margin-left: 1em;
        opacity: 0.3;
      }
    }

    :global(.ps-content) {
      font-size: 1.05em;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.9);
      position: relative;
      padding-left: 0.5em;

      &::before {
        content: '"';
        position: absolute;
        left: -0.3em;
        top: -0.2em;
        font-size: 3em;
        color: var(--color-blue);
        opacity: 0.2;
        font-family: Georgia, serif;
        line-height: 1;
      }
    }

    /* Mobile adjustments for PS notes */
    @media (max-width: 768px) {
      :global(.ps-note) {
        margin: 2em 0 1.5em 0;
        padding: 1.5em 1.5em;

        &:hover {
          transform: none;
        }
      }

      :global(.ps-label) {
        font-size: 1em;
      }

      :global(.ps-content) {
        font-size: 1em;
      }
    }
  }

  .post-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 1rem;
    pointer-events: none;
    animation: slideUp 0.3s ease-out;

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .nav-container {
      position: relative;
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      pointer-events: auto;
      width: fit-content;
      height: auto;

      // Apple liquid glass effect
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 20px;
      padding: 1rem 1.5rem;
      box-shadow:
        0 8px 32px 0 rgba(0, 0, 0, 0.37),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.05);

      // Subtle gradient overlay for depth
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.2) 50%,
          transparent
        );
        border-radius: 20px 20px 0 0;
      }
    }
  }

  @media (max-width: 768px) {
    .post-navigation {
      padding: 0.75rem;

      .nav-container {
        flex-direction: column;
        padding: 1rem;
        gap: 0.75rem;
        border-radius: 16px;
      }
    }
  }

  // Ensure content doesn't get hidden behind sticky nav
  section {
    padding-bottom: 2rem;
  }
</style>
