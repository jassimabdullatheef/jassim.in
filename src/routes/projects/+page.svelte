<script>
  import calendarPlusIcon from "$lib/icons/calendar-plus.svelte";
</script>

<svelte:head>
  <title>Projects</title>
  <meta name="description" content="A collection of my projects." />
</svelte:head>

<section class="container pb-5">
  <article>
    <h1 class="is-size-1-tablet is-size-3-mobile mb-6 mt-6">Projects</h1>
    <hr />

    <div class="projects-grid">
      <a href="/projects/timeblocker" class="project-card">
        <div class="project-header">
          <span class="project-icon">
            <svelte:component this={calendarPlusIcon} />
          </span>
          <h2 class="project-name">Time Blocker</h2>
        </div>
        <p class="project-description content">
          Tool to plan and create daily schedule by organizing tasks into time
          blocks. Drag and drop tasks onto a timeline, set durations, and build
          your day visually with an intuitive interface.
        </p>
      </a>
    </div>
  </article>
</section>

<style scoped lang="scss">
  @use "bulma/sass/utilities/mixins";

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;

    @include mixins.mobile {
      grid-template-columns: 1fr;
    }
  }

  .project-card {
    display: block;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    text-decoration: none;
    position: relative;
    overflow: hidden;

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

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);

      &::before {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(0);
      transition: transform 0.1s ease;
    }
  }

  .project-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .project-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.9);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    :global(svg) {
      width: 100%;
      height: 100%;
    }

    .project-card:hover & {
      transform: scale(1.1);
    }
  }

  .project-name {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);

    @include mixins.mobile {
      font-size: 1.5rem;
    }
  }

  .project-description {
    margin: 0;
  }
</style>
