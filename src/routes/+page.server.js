import { loadPosts, loadPost } from "$lib/utils/posts.js";
import { loadLibraryData } from "$lib/utils/library.js";
import { loadPhotographyData } from "$lib/utils/photography.js";

export async function load() {
  const posts = loadPosts();
  const { allBooks } = await loadLibraryData();
  const { albums } = loadPhotographyData();

  return {
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.frontmatter.title,
      date: p.frontmatter.date
        ? new Date(p.frontmatter.date).toISOString().slice(0, 10)
        : "",
      tags: (p.frontmatter.category || "")
        .split(",")
        .map((/** @type {string} */ t) => t.trim())
        .filter(Boolean),
      excerpt: p.excerpt,
      content: loadPost(p.slug)?.content ?? "",
    })),
    books: allBooks.map((/** @type {any} */ b) => ({
      title: b.Title,
      author: b.Author,
      status: b.isCurrentlyReading ? "reading" : b.isRead ? "read" : "to-read",
      rating: b.myRating
        ? "★".repeat(b.myRating) + "☆".repeat(5 - b.myRating)
        : "",
      cover: b.coverImage,
      publisher: b.publisher,
      binding: b.binding,
      pages: b.pages,
      year: b.yearPublished,
      dateRead: b.dateRead
        ? new Date(b.dateRead).toISOString().slice(0, 10)
        : "",
    })),
    albums: albums.map((a) => ({
      key: a.key,
      label: a.label,
      cover: a.cover,
      count: a.photos.length,
      photos: a.photos,
    })),
  };
}
