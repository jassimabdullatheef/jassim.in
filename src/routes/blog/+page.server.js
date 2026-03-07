import { loadPosts } from '$lib/utils/posts';

export function load({ url }) {
  const posts = loadPosts();
  const selectedCategory = url.searchParams.get('category') || 'all';
  
  // Get all unique categories (supports comma-separated values)
  const allCategories = posts.flatMap(post =>
    post.frontmatter.category
      ? post.frontmatter.category.split(',').map(c => c.trim()).filter(Boolean)
      : []
  );
  const categories = ['all', ...new Set(allCategories)];

  // Filter posts by category if not 'all'
  const filteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(post => {
        const postCategories = post.frontmatter.category
          ? post.frontmatter.category.split(',').map(c => c.trim())
          : [];
        return postCategories.includes(selectedCategory);
      });
  
  return {
    posts: filteredPosts,
    categories,
    selectedCategory
  };
}
