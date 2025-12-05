import { marked } from 'marked';
import matter from 'gray-matter';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { preprocessSidenotes } from './sidenotes.js';
import { preprocessPSNotes } from './psnotes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the posts directory path - resolve relative to this file's location
const postsDir = join(__dirname, '../../routes/blog/posts');

/**
 * Get all markdown files from the posts directory
 * @returns {Array} Array of post metadata
 */
export function loadPosts() {
  try {
    const files = readdirSync(postsDir).filter(file => file.endsWith('.md'));
    const posts = [];

    for (const file of files) {
      const filePath = join(postsDir, file);
      const rawContent = readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(rawContent);
      
      // Extract slug from filename
      const slug = file.replace(/\.md$/, '');

      posts.push({
        slug,
        frontmatter,
        excerpt: frontmatter.excerpt || content.substring(0, 150) + '...'
      });
    }

    // Sort posts by date (newest first)
    return posts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.date || 0);
      const dateB = new Date(b.frontmatter.date || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

/**
 * Load a single blog post by slug
 * @param {string} slug - The post slug
 * @returns {Object|null} Post data or null if not found
 */
export function loadPost(slug) {
  try {
    const filePath = join(postsDir, `${slug}.md`);
    
    // Check if file exists
    try {
      const rawContent = readFileSync(filePath, 'utf-8');
      const { data: frontmatter, content } = matter(rawContent);
      
      // Preprocess sidenotes before converting markdown to HTML
      let preprocessedContent;
      try {
        preprocessedContent = preprocessSidenotes(content);
      } catch (preprocessError) {
        console.error(`Error preprocessing sidenotes for ${slug}:`, preprocessError);
        // Fall back to content without sidenote preprocessing
        preprocessedContent = content;
      }
      
      // Convert markdown to HTML
      let html = marked(preprocessedContent);
      
      // Process PS notes after markdown conversion
      try {
        html = preprocessPSNotes(html);
      } catch (psError) {
        console.error(`Error processing PS notes for ${slug}:`, psError);
        // Continue with HTML as is
      }

      return {
        slug,
        frontmatter,
        content: html
      };
    } catch (fileError) {
      console.error(`Error reading file ${filePath}:`, fileError);
      return null;
    }
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}
