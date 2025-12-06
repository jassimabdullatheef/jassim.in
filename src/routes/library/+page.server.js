const ITEMS_PER_PAGE = 20;

// Import CSV file at build time using Vite's glob import
// This ensures it's included in the production bundle
const csvModules = import.meta.glob("/src/routes/library/books-db.csv", {
  eager: true,
  as: "raw",
});

// Load all book cover images from $lib/images/book-cover
const loadBookCovers = async () => {
  const imageModules = import.meta.glob(
    "$lib/images/book-cover/*.{jpg,jpeg,png,gif}",
    { eager: true }
  );

  /** @type {Record<string, string>} */
  const coverMap = {};

  for (const [path, module] of Object.entries(imageModules)) {
    // Extract filename from path (e.g., "157864366X.jpg")
    const filename = path.split("/").pop() || "";
    const isbn = filename.replace(/\.(jpg|jpeg|png|gif)$/i, "");
    if (isbn && module && typeof module === "object" && "default" in module) {
      const imageUrl = /** @type {{ default: string }} */ (module).default;
      coverMap[isbn] = imageUrl;
      // Also add variations (with/without leading zeros, etc.)
      const cleanIsbn = isbn.replace(/^0+/, ""); // Remove leading zeros
      if (cleanIsbn !== isbn && !coverMap[cleanIsbn]) {
        coverMap[cleanIsbn] = imageUrl;
      }
    }
  }

  return coverMap;
};

/**
 * @param {string} csvText
 */
function parseCSV(csvText) {
  const lines = csvText
    .split("\n")
    .filter((/** @type {string} */ line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((/** @type {string} */ h) => h.trim());

  /** @type {any[]} */
  const books = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    /** @type {Record<string, string>} */
    const book = {};
    headers.forEach(
      (/** @type {string} */ header, /** @type {number} */ index) => {
        let value = values[index] || "";
        // Remove quotes and clean up
        value = value.replace(/^="?"|"?"$/g, "").trim();
        book[header] = value;
      }
    );

    // Only add books with a title
    if (book.Title) {
      books.push(book);
    }
  }

  return books;
}

/**
 * @param {string} line
 */
function parseCSVLine(line) {
  /** @type {string[]} */
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

/**
 * @param {string | undefined} dateString
 */
function parseDate(dateString) {
  if (!dateString) return null;
  // Format: YYYY/MM/DD
  const parts = dateString.split("/");
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return null;
}

/**
 * @param {any[]} books
 * @param {Record<string, string>} coverMap
 */
function organizeBooksByDate(books, coverMap) {
  return books
    .map((/** @type {any} */ book) => {
      // Use Date Read if available, otherwise Date Added
      const dateRead = parseDate(book["Date Read"]);
      const dateAdded = parseDate(book["Date Added"]);
      const sortDate = dateRead || dateAdded;

      // Get cover image from coverMap using ISBN
      const isbn = book.ISBN || book.ISBN13 || "";
      // Clean ISBN (remove any non-digit characters except X)
      let cleanIsbn = isbn.replace(/[^\dX]/g, "");
      let coverImage = "";

      // Try exact match first
      if (cleanIsbn && coverMap[cleanIsbn]) {
        coverImage = coverMap[cleanIsbn];
      } else if (cleanIsbn) {
        // Try without leading zeros
        const withoutLeadingZeros = cleanIsbn.replace(/^0+/, "");
        if (withoutLeadingZeros && coverMap[withoutLeadingZeros]) {
          coverImage = coverMap[withoutLeadingZeros];
        }
        // Try with leading zeros (pad to 10 or 13 digits if needed)
        if (!coverImage && cleanIsbn.length < 10) {
          const padded = cleanIsbn.padStart(10, "0");
          if (coverMap[padded]) {
            coverImage = coverMap[padded];
          }
        }
      }

      // Fallback to no cover if still not found
      if (!coverImage) {
        coverImage = coverMap["no_cover_available"] || "";
      }

      // Check Exclusive Shelf - it may have extra text like "read" or "read (#5)"
      const exclusiveShelf = (book["Exclusive Shelf"] || "")
        .toLowerCase()
        .trim();
      // Match exact or with extra text (like "read (#5)" or "currently-reading (#7)")
      const isRead =
        exclusiveShelf === "read" || /^read\s/.test(exclusiveShelf);
      const isCurrentlyReading =
        exclusiveShelf === "currently-reading" ||
        /^currently-reading\s/.test(exclusiveShelf);
      const isToRead =
        exclusiveShelf === "to-read" || /^to-read\s/.test(exclusiveShelf);

      return {
        ...book,
        sortDate,
        dateRead,
        dateAdded,
        isRead,
        isCurrentlyReading,
        isToRead,
        myRating: parseInt(book["My Rating"]) || 0,
        averageRating: parseFloat(book["Average Rating"]) || 0,
        yearPublished:
          book["Year Published"] || book["Original Publication Year"] || "",
        pages: book["Number of Pages"] || "",
        publisher: book["Publisher"] || "",
        binding: book["Binding"] || "",
        coverImage,
      };
    })
    .sort((/** @type {any} */ a, /** @type {any} */ b) => {
      // Sort by date (most recent first), then by title
      if (a.sortDate && b.sortDate) {
        return b.sortDate - a.sortDate;
      }
      if (a.sortDate) return -1;
      if (b.sortDate) return 1;
      return (a.Title || "").localeCompare(b.Title || "");
    });
}

export async function load({ url }) {
  try {
    // Load book covers from $lib/images/book-cover
    const coverMap = await loadBookCovers();

    // Get CSV content from imported module (included at build time)
    const csvPath = "/src/routes/library/books-db.csv";
    const csvModule = csvModules[csvPath];

    if (!csvModule) {
      throw new Error(
        "Could not load books-db.csv. Make sure the file exists at src/routes/library/books-db.csv"
      );
    }

    // Handle both string and Promise<string> (though with eager: true it should be string)
    const csvText =
      typeof csvModule === "string" ? csvModule : String(csvModule);

    const books = parseCSV(csvText);
    const organizedBooks = organizeBooksByDate(books, coverMap);

    // Filter out "To Read" books
    const filteredBooks = organizedBooks.filter(
      (/** @type {any} */ book) => !book.isToRead
    );

    // Return all books for client-side filtering
    return {
      allBooks: filteredBooks,
      itemsPerPage: ITEMS_PER_PAGE,
    };
  } catch (error) {
    console.error("Error loading books:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      allBooks: [],
      itemsPerPage: ITEMS_PER_PAGE,
      error: errorMessage,
    };
  }
}
