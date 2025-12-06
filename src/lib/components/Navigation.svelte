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
  import arrowLeftIcon from "$lib/icons/arrow-left.svelte";
  import closeIcon from "$lib/icons/close.svelte";

  import MenuItem from "./MenuItem.svelte";

  export let visible = true;
  export let isSmallScreen = false;

  const closeNavigation = () => {
    visible = !visible;
  };

  const navs = [
    { text: "Home", url: "/", icon: homeIcon },
    { text: "About", url: "/about", icon: aboutIcon },
    { text: "Projects", url: "/projects", icon: projectsIcon },
    { text: "Blog", url: "/blog", icon: penIcon },
    { text: "Library", url: "/library", icon: bookIcon },
    { text: "Music", url: "/music", icon: musicIcon },
    { text: "Photography", url: "/photography", icon: cameraIcon },
  ];

  const toggleVisibility = (isVisible = false) => {
    if (!isSmallScreen) {
      visible = isVisible;
    }
  };
</script>

<nav
  class="columns is-flex-direction-column is-justify-content-space-between mt-0"
  on:mouseover={() => toggleVisibility(true)}
  on:mouseout={() => toggleVisibility(false)}
  on:focus={() => toggleVisibility(true)}
  on:blur={() => toggleVisibility(false)}
  tabindex="0"
>
  <div class="column is-12">
    <div class="p-2">
      <div class="is-flex p-2">
        <div class="logo-wrapper">
          <figure class="image is-32x32">
            <img src={jassimImage} alt="Logo" class="is-rounded" />
          </figure>
        </div>
        <div class="extra-info">
          <h1 class="has-text-weight-bold ml-3 mt-1">Jassim Abdul Latheef</h1>
        </div>
        <div class="close-button">
          <button class="button is-large is-text" on:click={closeNavigation}>
            <span class="icon">
              <svelte:component this={closeIcon} />
            </span>
          </button>
        </div>
      </div>

      <aside class="menu mt-5">
        <!-- <p class="menu-label">Menu</p> -->
        <ul class="menu-list">
          {#each navs as { text, url, icon }, i}
            <li>
              <MenuItem
                {icon}
                {text}
                {url}
                focus={() => {
                  visible = true;
                }}
                blur={() => {
                  visible = false;
                }}
              />
            </li>
          {/each}
        </ul>
      </aside>
    </div>
  </div>
</nav>
