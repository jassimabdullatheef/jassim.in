<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  export let data;
  
  function filterByCategory(category) {
    const url = new URL($page.url);
    if (category === 'all') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    goto(url.pathname + url.search);
  }
</script>

<svelte:head>
  <title>Blog</title>
</svelte:head>

<section class="container pb-5">
  <article>
    <h1 class="is-size-1-tablet is-size-3-mobile mb-6 mt-6">Blog</h1>
    <hr />
    
    {#if data.categories && data.categories.length > 1}
      <div class="category-filters mb-6">
        <div class="tags">
          {#each data.categories as category}
            <span 
              class="tag is-medium {data.selectedCategory === category ? 'is-primary' : ''}"
              role="button"
              tabindex="0"
              on:click={() => filterByCategory(category)}
              on:keydown={(e) => e.key === 'Enter' && filterByCategory(category)}
            >
              {category === 'all' ? 'All Posts' : category}
            </span>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if data.posts && data.posts.length > 0}
      <div class="posts-list">
        {#each data.posts as post}
          <article class="post-preview mb-6">
            <div class="is-flex is-justify-content-space-between is-align-items-start mb-3">
              <h2 class="is-size-3 mb-0">
                <a href="/blog/{post.slug}" class="post-link">
                  {post.frontmatter.title}
                </a>
              </h2>
              {#if post.frontmatter.category}
                <span class="tag is-light ml-3">
                  {post.frontmatter.category}
                </span>
              {/if}
            </div>
            
            {#if post.frontmatter.date}
              <p class="is-size-6 has-text-grey mb-3">
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            {/if}
            
            {#if post.excerpt}
              <p class="is-size-5 content mb-4">
                {post.excerpt}
              </p>
            {/if}
            
            <a href="/blog/{post.slug}" class="button is-text">
              Read more →
            </a>
            
            <hr class="mt-5" />
          </article>
        {/each}
      </div>
    {:else}
      <p class="is-size-4 content">
        {data.selectedCategory !== 'all' 
          ? `No posts found in the "${data.selectedCategory}" category.`
          : 'No blog posts yet. Check back soon!'}
      </p>
    {/if}
  </article>
</section>

<style scoped lang="scss">
  .category-filters {
    .tags {
      .tag {
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        text-transform: capitalize;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
  
  .posts-list {
    .post-preview {
      .post-link {
        text-decoration: none;
        transition: all 0.2s ease-in-out;
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
</style>
