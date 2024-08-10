<script>
  import githubIcon from "$lib/icons/social-github.svelte";
  import telegramIcon from "$lib/icons/social-telegram.svelte";
  import xIcon from "$lib/icons/social-x.svelte";
  import youtubeIcon from "$lib/icons/social-youtube.svelte";
  import linkedinIcon from "$lib/icons/social-linkedin.svelte";
  import soundcloudIcon from "$lib/icons/social-soundcloud.svelte";
</script>

<svelte:head>
  <title>Contact</title>
</svelte:head>

<div class="is-size-3">Coming Soon</div>

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
