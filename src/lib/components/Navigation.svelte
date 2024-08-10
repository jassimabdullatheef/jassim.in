<script>
  import jassimImage from "$lib/images/jassim.jpg";

  import homeIcon from "$lib/icons/home.svelte";
  import aboutIcon from "$lib/icons/person.svelte";
  import penIcon from "$lib/icons/pen.svelte";
  import musicIcon from "$lib/icons/music.svelte";
  import cameraIcon from "$lib/icons/camera.svelte";
  import projectsIcon from "$lib/icons/projects.svelte";
  import contactIcon from "$lib/icons/contact.svelte";
  import bookIcon from "$lib/icons/book.svelte";
  import ArrowLeftIcon from "$lib/icons/arrow-left.svelte";

  import MenuItem from "./MenuItem.svelte";

  export let visible = true;

  const toggleVisibility = () => (visible = !visible);

  const navs = [
    { text: "Home", url: "/", icon: homeIcon },
    { text: "About", url: "/about", icon: aboutIcon },
    { text: "Projects", url: "/projects", icon: projectsIcon },
    { text: "Blog", url: "/blog", icon: penIcon },
    { text: "Library", url: "/library", icon: bookIcon },
    { text: "Music", url: "/music", icon: musicIcon },
    { text: "Photography", url: "/photography", icon: cameraIcon },
    { text: "Contact", url: "/contact", icon: contactIcon },
  ];
</script>

<nav
  class="columns is-flex-direction-column is-justify-content-space-between mt-0"
>
  <div class="column is-12">
    <div class="p-2">
      <div class="columns is-vcentered p-2">
        <div class="column logo-wrapper">
          <figure class="image is-32x32">
            <img src={jassimImage} alt="Logo" class="is-rounded" />
          </figure>
        </div>
        <div class="column pl-0">
          <h1 class="has-text-weight-bold">Jassim Abdul Latheef</h1>
        </div>
      </div>

      <aside class="menu mt-5">
        <!-- <p class="menu-label">Menu</p> -->
        <ul class="menu-list">
          {#each navs as { text, url, icon }, i}
            <li>
              <MenuItem {icon} {text} {url} />
            </li>
          {/each}
        </ul>
      </aside>
    </div>
  </div>

  <div class="column social-wrapper is-12">
    <!-- Social media links -->
    <div class="is-flex is-justify-content-right">
      <button class="button is-ghost" on:click={toggleVisibility}>
        <span class="icon">
          <svelte:component this={ArrowLeftIcon} />
        </span>
      </button>
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
    border-top: 1px solid var(--bulma-border);
  }
</style>
