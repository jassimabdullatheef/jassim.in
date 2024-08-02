<script>
  export let icon;
  export let text;
  export let url;

  import chevronRight from "$lib/icons/chevron-right.svelte";
</script>

<a
  href={url}
  class="is-flex is-justify-content-space-between is-align-items-center"
>
  <span class="icon-text is-align-items-center">
    <span class="icon is-small">
      <svelte:component this={icon} />
    </span>
    <span>{text}</span>
  </span>
  <span class="icon is-small">
    <svelte:component this={chevronRight} />
  </span>
</a>

<style lang="scss" scoped>
  a {
    background-color: transparent;

    &:hover {
      background-color: hsl(
        var(--bulma-menu-item-h),
        var(--bulma-menu-item-s),
        calc(
          var(--bulma-menu-item-background-l) +
            var(--bulma-menu-item-background-l-delta)
        )
      );
    }
  }
</style>
