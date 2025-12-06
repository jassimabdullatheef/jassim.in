<script lang="ts">
  export let href: string | null = null;
  export let onClick: ((event: MouseEvent) => void) | null = null;
  export let icon: string | null = null;
  export let iconPosition: 'left' | 'right' = 'left';
  export let variant: 'default' | 'reverse' = 'default';
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  
  $: isLink = href !== null;
  $: isReverse = variant === 'reverse';
  
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
    class:disabled
    role="button"
    tabindex={disabled ? -1 : 0}
  >
    {#if icon && iconPosition === 'left'}
      <span class="button-icon">{icon}</span>
    {/if}
    <span class="button-text"><slot /></span>
    {#if icon && iconPosition === 'right'}
      <span class="button-icon">{icon}</span>
    {/if}
  </a>
{:else}
  <button
    {type}
    class="button-component"
    class:reverse={isReverse}
    class:disabled
    {disabled}
    on:click={handleClick}
  >
    {#if icon && iconPosition === 'left'}
      <span class="button-icon">{icon}</span>
    {/if}
    <span class="button-text"><slot /></span>
    {#if icon && iconPosition === 'right'}
      <span class="button-icon">{icon}</span>
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
      content: '';
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
    }
    
    .button-text {
      white-space: nowrap;
    }
  }
</style>

