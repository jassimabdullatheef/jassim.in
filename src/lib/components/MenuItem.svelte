<script>
  export let icon;
  export let text;
  export let url;
  export let focus;
  export let blur;

  import chevronRight from "$lib/icons/chevron-right.svelte";
</script>

<a
  href={url}
  class="is-flex is-justify-content-space-between menu-item is-align-items-center"
  on:focus={focus}
  on:blur={blur}
>
  <span class="icon-text is-align-items-center">
    <span class="icon is-small">
      <svelte:component this={icon} />
    </span>
    <span class="extra-info">{text}</span>
  </span>
  <span class="icon is-small extra-info">
    <svelte:component this={chevronRight} />
  </span>
</a>
