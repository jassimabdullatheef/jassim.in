import { loadPhotographyData } from "$lib/utils/photography.js";

export async function load() {
  const { images } = loadPhotographyData();
  return { images };
}
