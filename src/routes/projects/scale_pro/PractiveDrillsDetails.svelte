<script>
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/Button.svelte";
  import CloseIcon from "$lib/icons/close.svelte";

  /** @type {{ id: number; name: string; description: string; instructions: string; videoReferences: Array<{ title: string; source: string; url: string }> } | null} */
  export let drill = null;

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch("close");
  }

  /**
   * @param {MouseEvent} event
   */
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  /**
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (event.key === "Escape") {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if drill}
  <div class="dialog-backdrop" on:click={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="drill-dialog-title">
    <div class="dialog-content" on:click|stopPropagation>
      <div class="dialog-header">
        <h2 id="drill-dialog-title" class="dialog-title">{drill.name}</h2>
        <Button
          type="button"
          variant="default"
          onClick={handleClose}
          icon={CloseIcon}
        >
        </Button>
      </div>

      <div class="dialog-body">
        <div class="section">
          <h3 class="section-label">Description</h3>
          <p class="section-content">{drill.description}</p>
        </div>

        <div class="section">
          <h3 class="section-label">Instructions</h3>
          <div class="section-content">
            {#each drill.instructions.split('\n') as line}
              {#if line.trim()}
                <p>{line.trim()}</p>
              {/if}
            {/each}
          </div>
        </div>

        {#if drill.videoReferences && drill.videoReferences.length > 0}
          <div class="section">
            <h3 class="section-label">Video References</h3>
            <div class="video-references">
              {#each drill.videoReferences as video}
                <div class="video-reference">
                  <div class="video-info">
                    <h4 class="video-title">{video.title}</h4>
                    <p class="video-source">{video.source}</p>
                  </div>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="video-link"
                  >
                    Watch Video →
                  </a>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="dialog-footer">
        <Button
          type="button"
          variant="default"
          onClick={handleClose}
        >
          Close
        </Button>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog-content {
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease;
    overflow: hidden;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dialog-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }

  .dialog-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(119, 210, 255, 1);
    margin: 0;
  }

  .section-content {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.95rem;
    line-height: 1.6;

    p {
      margin: 0.5rem 0;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .video-references {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .video-reference {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }

  .video-info {
    flex: 1;
    min-width: 0;
  }

  .video-title {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 0.25rem 0;
  }

  .video-source {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  .video-link {
    color: rgba(119, 210, 255, 1);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    transition: color 0.2s ease;

    &:hover {
      color: rgba(147, 197, 253, 1);
      text-decoration: underline;
    }
  }

  .dialog-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: flex-end;
  }
</style>

