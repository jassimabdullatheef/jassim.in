import { loadPost, loadPosts } from '$lib/utils/posts';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const post = loadPost(params.slug);
  
  if (!post) {
    throw error(404, 'Post not found');
  }
  
  // Get all posts to find the next one
  const allPosts = loadPosts();
  const currentIndex = allPosts.findIndex(p => p.slug === params.slug);
  const nextPost = currentIndex !== -1 && currentIndex < allPosts.length - 1 
    ? allPosts[currentIndex + 1] 
    : null;
  
  return {
    post,
    nextPost
  };
}
