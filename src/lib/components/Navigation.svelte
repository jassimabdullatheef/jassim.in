<script>
  import jassimImage from "$lib/images/jassim.jpg";

  import homeIcon from "$lib/icons/home.svelte";

  import MenuItem from "./MenuItem.svelte";

  import githubIcon from "$lib/icons/social-github.svelte";
  import telegramIcon from "$lib/icons/social-telegram.svelte";
  import xIcon from "$lib/icons/social-x.svelte";
  import youtubeIcon from "$lib/icons/social-youtube.svelte";
  import linkedinIcon from "$lib/icons/social-linkedin.svelte";
  import soundcloudIcon from "$lib/icons/social-soundcloud.svelte";
</script>

<nav class="columns is-flex-direction-column is-justify-content-space-between">
  <div class="column">
    <div class="p-2">
      <div class="columns is-vcentered">
        <div class="column logo-wrapper">
          <figure class="image is-32x32">
            <img src={jassimImage} alt="Logo" class="is-rounded" />
          </figure>
        </div>
        <div class="column pl-0">
          <h1 class="has-text-weight-bold">Jassim Abdul Latheef</h1>
        </div>
      </div>

      <!-- Home -->
       <!-- Blog -->
        <!-- Photography -->
         <!-- Projects -->
          

      <aside class="menu mt-5">
        <p class="menu-label">General</p>
        <ul class="menu-list">
          <li>
            <MenuItem icon={homeIcon} text="Home" url="/" />
          </li>
          <li><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </aside>
    </div>
  </div>

  <div class="column social-wrapper">
    <!-- Social media links -->
    <div class="is-flex is-justify-content-center">
      <a href="#" class="p-2">
        <span class="icon has-text-grey-lighter">
          <svelte:component this={githubIcon} />
        </span>
      </a>
      <a href="#" class="p-2">
        <span class="icon has-text-grey-lighter">
          <svelte:component this={telegramIcon} />
        </span>
      </a>
      <a href="#" class="p-2">
        <span class="icon has-text-grey-lighter">
          <svelte:component this={xIcon} />
        </span>
      </a>
      <a href="#" class="p-2">
        <span class="icon has-text-grey-lighter">
          <svelte:component this={linkedinIcon} />
        </span>
      </a>
      <a href="#" class="p-2">
        <span class="icon has-text-grey-lighter">
          <svelte:component this={soundcloudIcon} />
        </span>
      </a>
      <a href="#" class="p-2">
        <span class="icon has-text-grey-lighter">
          <svelte:component this={youtubeIcon} />
        </span>
      </a>
    </div>
  </div>
</nav>

<style scoped lang="scss">
  nav {
    height: 100vh;
    background-color: hsla(0, 0%, 0%, 0.2);
  }

  .logo-wrapper {
    max-width: calc(var(--bulma-size-2) * 1.4);
  }

  .social-wrapper {
    max-height: calc(var(--bulma-size-2) * 1.3);
    border-top: 1px solid var(--bulma-border);
  }
</style>
