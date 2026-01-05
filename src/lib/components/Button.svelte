<script lang="ts">
  import type { SvelteComponent } from "svelte";

  export let href: string | null = null;
  export let onClick: ((event: MouseEvent) => void) | null = null;
  export let icon: SvelteComponent | string | null = null;
  export let iconPosition: "left" | "right" = "left";
  export let variant: "default" | "reverse" | "primary" | "danger" = "default";
  export let disabled = false;
  export let type: "button" | "submit" | "reset" = "button";

  $: isLink = href !== null;
  $: isReverse = variant === "reverse";
  $: isPrimary = variant === "primary";
  $: isDanger = variant === "danger";

  function handleClick(event: MouseEvent) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  }
</script>

{#if isLink}
  <a
    {href}
    class="button-component"
    class:reverse={isReverse}
    class:primary={isPrimary}
    class:danger={isDanger}
    class:disabled
    role="button"
    tabindex={disabled ? -1 : 0}
  >
    {#if icon && iconPosition === "left"}
      <span class="button-icon">
        {#if typeof icon === "string"}
          {@html icon}
        {:else}
          <svelte:component this={icon} />
        {/if}
      </span>
    {/if}
    <span class="button-text"><slot /></span>
    {#if icon && iconPosition === "right"}
      <span class="button-icon">
        {#if typeof icon === "string"}
          {@html icon}
        {:else}
          <svelte:component this={icon} />
        {/if}
      </span>
    {/if}
  </a>
{:else}
  <button
    {type}
    class="button-component"
    class:reverse={isReverse}
    class:primary={isPrimary}
    class:danger={isDanger}
    class:disabled
    {disabled}
    on:click={handleClick}
  >
    {#if icon && iconPosition === "left"}
      <span class="button-icon">
        {#if typeof icon === "string"}
          {@html icon}
        {:else}
          <svelte:component this={icon} />
        {/if}
      </span>
    {/if}
    <span class="button-text"><slot /></span>
    {#if icon && iconPosition === "right"}
      <span class="button-icon">
        {#if typeof icon === "string"}
          {@html icon}
        {:else}
          <svelte:component this={icon} />
        {/if}
      </span>
    {/if}
  </button>
{/if}

<style scoped lang="scss">
  .button-component {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    position: relative;
    overflow: hidden;
    font-family: inherit;

    // Subtle shine effect on hover
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transition: left 0.5s ease;
    }

    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);

      &::before {
        left: 100%;
      }

      .button-icon {
        transform: scale(1.1);
      }
    }

    &:active:not(.disabled) {
      transform: translateY(0);
      transition: transform 0.1s ease;
    }

    &.reverse {
      flex-direction: row-reverse;

      &:hover:not(.disabled) .button-icon {
        transform: scale(1.1) translateX(2px);
      }
    }

    &.primary {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      color: rgba(147, 197, 253, 1);

      &:hover:not(.disabled) {
        background: rgba(59, 130, 246, 0.3);
        border-color: rgba(59, 130, 246, 0.6);
        box-shadow:
          0 4px 12px rgba(59, 130, 246, 0.3),
          inset 0 1px 0 rgba(147, 197, 253, 0.2);
      }
    }

    &.danger {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
      color: rgba(252, 165, 165, 1);

      &:hover:not(.disabled) {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.6);
        box-shadow:
          0 4px 12px rgba(239, 68, 68, 0.3),
          inset 0 1px 0 rgba(252, 165, 165, 0.2);
      }
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .button-icon {
      font-size: 1.1rem;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1rem;
    }

    .button-text {
      white-space: nowrap;

      &:not(:empty) {
        min-width: 1em;
      }
    }

    :global(svg) {
      width: 1em !important;
      height: 1em !important;
    }
  }
</style>
