// load all the files from images directory
const loadImages = async () => {
  const imageModules = import.meta.glob("./images/*.{jpg,jpeg,png,gif}");

  const imagePromises = Object.values(imageModules).map(async (moduleLoader) => {
    const module = await moduleLoader();
    return /** @type {{ default: string }} */ (module).default;
  });

  const files = await Promise.all(imagePromises);
  return files;
};

export async function load() {
  return {
    images: await loadImages(),
  };
}
