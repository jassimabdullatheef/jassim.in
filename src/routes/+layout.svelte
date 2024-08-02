<script>
  import 'bulma/css/bulma.css';
  import '$lib/style/root.scss';

  import Navigation from '$lib/components/Navigation.svelte';
</script>


<div class="columns mb-0">
  <div class="column nav-container">
    <Navigation />
  </div>
  <div class="column">
    <slot></slot>
  </div>
</div>


<style>
  .nav-container {
    height: calc(100vh + var(--bulma-column-gap));
    max-width: calc(var(--bulma-size-1) * 6);
  }
</style>