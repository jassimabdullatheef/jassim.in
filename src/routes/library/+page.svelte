<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/Button.svelte";
  import { gsap } from "gsap";

  export let data;

  let selectedFilter = "all";
  let flippedCards = new Set();
  let currentPage = 1;

  /**
   * @param {Date | null} date
   */
  function formatDate(date) {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * @param {any} book
   */
  function getStatusLabel(book) {
    if (book.isRead)
      return { text: "Read", value: "read", class: "is-success" };
    if (book.isCurrentlyReading)
      return { text: "Reading", value: "reading", class: "is-info" };
    if (book.isToRead)
      return { text: "To Read", value: "to-read", class: "is-warning" };
    return { text: "Unknown", value: "unknown", class: "is-light" };
  }

  /**
   * @param {number} rating
   */
  function renderStars(rating) {
    if (!rating || rating === 0) return "Not rated";
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  /**
   * @param {any} book
   */
  function matchesFilter(book) {
    if (selectedFilter === "all") return true;
    const status = getStatusLabel(book);
    return status.value === selectedFilter;
  }

  /**
   * @param {string} filter
   */
  function setFilter(filter) {
    selectedFilter = filter;
    currentPage = 1; // Reset to page 1 when filter changes
  }

  /**
   * @param {string} bookId
   */
  function toggleFlip(bookId) {
    if (flippedCards.has(bookId)) {
      flippedCards.delete(bookId);
    } else {
      flippedCards.add(bookId);
    }
    flippedCards = new Set(flippedCards);
  }

  /**
   * @param {MouseEvent} event
   * @param {HTMLElement} card
   */
  function handleMouseMove(event, card) {
    if (card.classList.contains("flipped")) return;
    
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;

    // Use GSAP for smooth, performant animation
    gsap.to(card, {
      "--rotate-x": `${rotateX}deg`,
      "--rotate-y": `${rotateY}deg`,
      duration: 0.25,
      ease: "power1.out",
      overwrite: "auto",
      immediateRender: false
    });
  }

  /**
   * @param {HTMLElement} card
   */
  function handleMouseLeave(card) {
    if (card.classList.contains("flipped")) return;
    
    // Use GSAP for smooth return animation
    gsap.to(card, {
      "--rotate-x": "0deg",
      "--rotate-y": "0deg",
      duration: 0.6,
      ease: "power2.out",
      overwrite: "auto"
    });
  }

  // Filter and paginate books
  let filteredBooks = [];

  // Include selectedFilter as a dependency so the reactive statement re-runs when filter changes
  $: {
    // Reference selectedFilter to make it a dependency
    selectedFilter;
    filteredBooks = data.allBooks?.filter(matchesFilter) || [];
  }

  $: totalBooks = filteredBooks.length;
  $: totalPages = Math.ceil(totalBooks / data.itemsPerPage);
  $: books = filteredBooks.slice(
    (currentPage - 1) * data.itemsPerPage,
    currentPage * data.itemsPerPage
  );

  /**
   * @param {number} pageNum
   */
  function goToPage(pageNum) {
    currentPage = pageNum;
    // Scroll to top of books grid
    setTimeout(() => {
      const grid = document.querySelector(".books-grid");
      if (grid) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  }
</script>

<svelte:head>
  <title>Library</title>
</svelte:head>

<section class="container pb-5">
  <article>
    <h1 class="is-size-1-tablet is-size-3-mobile mb-6 mt-6">Library</h1>
    
    <div class="library-intro mb-6">
      <p class="is-size-4 content">
        This is a log of books I'm currently reading and have read in the past. 
        I'm putting it out there for me to keep track as well as for anyone who likes to discover more.
      </p>
      <p class="is-size-6 has-text-grey mt-4">
        Last updated: 11 Jan 2026
      </p>
    </div>
    
    <hr />

    {#if data.error}
      <div class="notification is-danger">
        <p>Error loading books: {data.error}</p>
      </div>
    {:else if data.allBooks && data.allBooks.length > 0}
      <div class="filter-container mb-6">
        <div class="filter-buttons">
          <button
            class="filter-button {selectedFilter === 'all' ? 'active' : ''}"
            on:click={() => setFilter("all")}
          >
            All
          </button>
          <button
            class="filter-button is-success {selectedFilter === 'read'
              ? 'active'
              : ''}"
            on:click={() => setFilter("read")}
          >
            Read
          </button>
          <button
            class="filter-button is-info {selectedFilter === 'reading'
              ? 'active'
              : ''}"
            on:click={() => setFilter("reading")}
          >
            Reading
          </button>
        </div>
      </div>

      <div class="library-stats mb-6">
        <p class="is-size-6 has-text-grey">
          Showing {(currentPage - 1) * data.itemsPerPage + 1} -
          {Math.min(currentPage * data.itemsPerPage, totalBooks)}
          of {totalBooks} books
        </p>
      </div>

      {#if books.length > 0}
        <div class="books-grid">
          {#each books as book, index}
            {@const status = getStatusLabel(book)}
            {@const bookId = `${book.Title}-${index}`}
            {@const isFlipped = flippedCards.has(bookId)}
            <article
              class="book-card {isFlipped ? 'flipped' : ''}"
              on:mousemove={(e) => handleMouseMove(e, e.currentTarget)}
              on:mouseleave={(e) => handleMouseLeave(e.currentTarget)}
              on:click={() => toggleFlip(bookId)}
              role="button"
              tabindex="0"
            >
              <div class="book-card-inner">
                <div class="book-card-front">
                  {#if book.coverImage && book.coverImage.trim() !== ""}
                    <div class="book-cover-wrapper">
                      <div class="book-cover">
                        <img
                          src={book.coverImage}
                          alt="Cover for {book.Title}"
                          loading="lazy"
                          on:error={(e) => {
                            const target = e.target;
                            if (target && target instanceof HTMLImageElement) {
                              console.warn(
                                "Failed to load cover image:",
                                book.coverImage,
                                "for book:",
                                book.Title
                              );
                              target.style.display = "none";
                            }
                          }}
                        />
                      </div>
                    </div>
                  {:else}
                    <div class="book-cover-wrapper">
                      <div class="book-cover book-cover-placeholder">
                        <div class="placeholder-content">
                          <span class="placeholder-text">No Cover</span>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>

                <div class="book-card-back">
                  <div class="book-meta-content">
                    <div class="meta-section">
                      {#if book.yearPublished}
                        <div class="meta-item">
                          <span class="meta-label">Published:</span>
                          <span class="meta-value">{book.yearPublished}</span>
                        </div>
                      {/if}

                      {#if book.pages}
                        <div class="meta-item">
                          <span class="meta-label">Pages:</span>
                          <span class="meta-value">{book.pages}</span>
                        </div>
                      {/if}

                      {#if book.publisher}
                        <div class="meta-item">
                          <span class="meta-label">Publisher:</span>
                          <span class="meta-value">{book.publisher}</span>
                        </div>
                      {/if}

                      {#if book.binding}
                        <div class="meta-item">
                          <span class="meta-label">Binding:</span>
                          <span class="meta-value">{book.binding}</span>
                        </div>
                      {/if}

                      {#if book.dateRead}
                        <div class="meta-item">
                          <span class="meta-label">Read:</span>
                          <span class="meta-value"
                            >{formatDate(book.dateRead)}</span
                          >
                        </div>
                      {:else if book.dateAdded}
                        <div class="meta-item">
                          <span class="meta-label">Added:</span>
                          <span class="meta-value"
                            >{formatDate(book.dateAdded)}</span
                          >
                        </div>
                      {/if}
                    </div>

                    {#if book["My Review"]}
                      <div class="book-review">
                        <p class="review-text">"{book["My Review"]}"</p>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
              <div class="book-info">
                <h3 class="book-title">{book.Title}</h3>
                <p class="book-author">by {book.Author}</p>
                {#if book.myRating > 0}
                  <div class="book-rating">
                    <span class="rating-stars"
                      >{renderStars(book.myRating)}</span
                    >
                  </div>
                {/if}
              </div>
            </article>
          {/each}
        </div>

        {#if totalPages > 1}
          {@const startPage = Math.max(1, currentPage - 2)}
          {@const endPage = Math.min(totalPages, startPage + 4)}
          <nav
            class="pagination-container mt-6"
            role="navigation"
            aria-label="pagination"
          >
            <div class="pagination-info mb-4">
              <p class="is-size-6 has-text-grey">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            <div class="pagination-buttons">
              <Button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                icon="←"
              >
                Previous
              </Button>

              <div class="page-numbers">
                {#each Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i) as pageNum}
                  <button
                    class="page-button {currentPage === pageNum
                      ? 'active'
                      : ''}"
                    on:click={() => goToPage(pageNum)}
                    aria-label="Go to page {pageNum}"
                  >
                    {pageNum}
                  </button>
                {/each}
              </div>

              <Button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                icon="→"
                iconPosition="right"
              >
                Next
              </Button>
            </div>
          </nav>
        {/if}
      {:else}
        <p class="is-size-4 content has-text-grey">
          No books found with the selected filter.
        </p>
      {/if}
    {:else}
      <p class="is-size-4 content">No books found in the library.</p>
    {/if}
  </article>
</section>

<style scoped lang="scss">
  .library-intro {
    margin-bottom: 2rem;
    
    p {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.7;
      max-width: 800px;
    }
  }

  .library-stats {
    margin-bottom: 1.5rem;
  }

  .filter-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .filter-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .filter-button {
    padding: 0.5rem 1.25rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    font-family: inherit;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    &.active {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.95);
    }

    &.is-success.active {
      background: rgba(72, 199, 116, 0.2);
      border-color: rgba(72, 199, 116, 0.4);
      color: #48c774;
    }

    &.is-info.active {
      background: rgba(62, 142, 208, 0.2);
      border-color: rgba(62, 142, 208, 0.4);
      color: #3e8ed0;
    }

    &.is-warning.active {
      background: rgba(255, 221, 87, 0.2);
      border-color: rgba(255, 221, 87, 0.4);
      color: #ffdd57;
    }
  }

  .books-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
    margin-bottom: 3rem;
    align-items: start;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
  }

  .book-card {
    --rotate-x: 0deg;
    --rotate-y: 0deg;
    position: relative;
    perspective: 1000px;
    cursor: pointer;
    outline: none;
    width: 100%;
    aspect-ratio: 2 / 3;

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 4px;
      border-radius: 12px;
    }

    &.flipped .book-card-inner {
      transform: rotateY(180deg);
    }
  }

  .book-card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    will-change: transform;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .book-card:not(.flipped):hover .book-card-inner {
    transform: rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
    transition: transform 0.1s ease-out;
  }

  .book-card-front,
  .book-card-back {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden;
    transform-style: preserve-3d;
  }

  .book-card-back {
    transform: rotateY(180deg);
  }

  .book-card-front {
    display: flex;
    flex-direction: column;
    overflow: visible;
    transform: translateZ(0);
  }

  .book-cover-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 1rem;
    transform-style: preserve-3d;
    flex-shrink: 0;
    perspective: 1000px;
  }

  .book-cover {
    position: relative;
    width: 100%;
    padding-bottom: 150%;
    transform-style: preserve-3d;
    will-change: transform;
    transition: transform 0.2s ease-out;

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
      box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.05);
      transition: box-shadow 0.2s ease-out;
      backface-visibility: hidden;
      will-change: box-shadow;
    }
  }

  .book-cover-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 2px dashed rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    .placeholder-content {
      text-align: center;
      padding: 1rem;
    }

    .placeholder-text {
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.875rem;
      font-weight: 500;
    }
  }

  .book-card:not(.flipped):hover .book-cover {
    transform: rotateY(var(--rotate-y)) rotateX(var(--rotate-x));
    transition: transform 0.1s ease-out;
  }

  .book-card:not(.flipped):hover .book-cover img {
    box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    transition: box-shadow 0.2s ease-out;
  }

  .book-info {
    text-align: center;
    padding: 0.5rem 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .book-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    line-height: 1.3;
    color: rgba(255, 255, 255, 0.95);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .book-author {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 0.5rem 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .book-rating {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.25rem;
  }

  .rating-stars {
    color: #ffd700;
    font-size: 0.875rem;
    letter-spacing: 2px;
  }

  .rating-avg {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .book-card-back {
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .book-meta-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    box-sizing: border-box;
  }

  .meta-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    min-height: 0;
  }

  .meta-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .meta-label {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }

  .meta-value {
    color: rgba(255, 255, 255, 0.9);
  }

  .book-review {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .review-text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.8);
    font-style: italic;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .pagination-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;

      .page-numbers {
        display: flex;
        gap: 0.5rem;
        align-items: center;

        .page-button {
          min-width: 2.5rem;
          height: 2.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;

          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
          }

          &.active {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.3);
            font-weight: 600;
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .books-grid {
      gap: 1rem;
    }

    .book-card {
      aspect-ratio: 2 / 3;
    }

    .book-card-back {
      padding: 1rem;
      font-size: 0.875rem;
    }

    .book-title {
      font-size: 0.875rem;
    }

    .book-author {
      font-size: 0.75rem;
    }

    .filter-buttons {
      gap: 0.5rem;
    }

    .filter-button {
      padding: 0.4rem 1rem;
      font-size: 0.8rem;
    }

    .pagination-buttons {
      flex-direction: column;
      width: 100%;

      .page-numbers {
        width: 100%;
        justify-content: center;
      }
    }
  }
</style>
