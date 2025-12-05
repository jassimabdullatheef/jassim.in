import { loadPosts } from '$lib/utils/posts';

export function load({ url }) {
  const posts = loadPosts();
  const selectedCategory = url.searchParams.get('category') || 'all';
  
  // Get all unique categories
  const categories = ['all', ...new Set(posts.map(post => post.frontmatter.category).filter(Boolean))];
  
  // Filter posts by category if not 'all'
  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.frontmatter.category === selectedCategory);
  
  return {
    posts: filteredPosts,
    categories,
    selectedCategory
  };
}
