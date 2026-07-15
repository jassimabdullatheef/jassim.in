import { loadLibraryData } from "$lib/utils/library.js";

const ITEMS_PER_PAGE = 30;

export async function load() {
  const { allBooks, error } = await loadLibraryData();
  return { allBooks, itemsPerPage: ITEMS_PER_PAGE, ...(error ? { error } : {}) };
}
