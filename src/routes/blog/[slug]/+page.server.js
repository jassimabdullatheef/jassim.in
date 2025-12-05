import { loadPost } from '$lib/utils/posts';
import { error } from '@sveltejs/kit';

export function load({ params }) {
  const post = loadPost(params.slug);
  
  if (!post) {
    throw error(404, 'Post not found');
  }
  
  return {
    post
  };
}
