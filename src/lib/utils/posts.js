import { marked } from "marked";
import matter from "gray-matter";
import { createDirectives } from "marked-directive";
import { preprocessSidenotes } from "./sidenotes.js";
import { preprocessPSNotes } from "./psnotes.js";

const directives = createDirectives();

marked.use(directives);

// Import all markdown files at build time using Vite's glob import
// This ensures they're included in the production bundle
const postModules = import.meta.glob("/src/routes/blog/posts/*.md", {
  eager: true,
  as: "raw",
});

/**
 * Get all markdown files from the posts directory
 * @returns {Array<{slug: string, frontmatter: any, excerpt: string}>} Array of post metadata
 */
export function loadPosts() {
  try {
    const posts = [];

    // Iterate through all imported markdown files
    for (const [path, rawContent] of Object.entries(postModules)) {
      // Extract slug from file path
      // path format: /src/routes/blog/posts/filename.md
      const pathParts = path.split("/");
      const filename = pathParts[pathParts.length - 1];
      if (!filename) continue;

      const slug = filename.replace(/\.md$/, "");

      // Handle both string and Promise<string> (though with eager: true it should be string)
      const content =
        typeof rawContent === "string" ? rawContent : String(rawContent);

      // Parse frontmatter and content
      const { data: frontmatter, content: markdownContent } = matter(content);

      posts.push({
        slug,
        frontmatter,
        excerpt:
          frontmatter.excerpt || markdownContent.substring(0, 150) + "...",
      });
    }

    // Sort posts by date (newest first)
    return posts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.date || 0).getTime();
      const dateB = new Date(b.frontmatter.date || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error loading posts:", error);
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
    // Find the post by matching the slug in the path
    const postEntry = Object.entries(postModules).find(([path]) => {
      const pathParts = path.split("/");
      const filename = pathParts[pathParts.length - 1];
      if (!filename) return false;
      const pathSlug = filename.replace(/\.md$/, "");
      return pathSlug === slug;
    });

    if (!postEntry) {
      return null;
    }

    const [, rawContent] = postEntry;

    // Handle both string and Promise<string> (though with eager: true it should be string)
    const content =
      typeof rawContent === "string" ? rawContent : String(rawContent);

    const { data: frontmatter, content: markdownContent } = matter(content);

    // Preprocess sidenotes before converting markdown to HTML
    let preprocessedContent;
    try {
      preprocessedContent = preprocessSidenotes(markdownContent);
    } catch (preprocessError) {
      console.error(
        `Error preprocessing sidenotes for ${slug}:`,
        preprocessError
      );
      // Fall back to content without sidenote preprocessing
      preprocessedContent = markdownContent;
    }

    // Convert markdown to HTML
    let html = /** @type {string} */ (marked(preprocessedContent));

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
      content: html,
    };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}
