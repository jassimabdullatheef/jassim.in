// load all the files from images directory
const loadImages = () => {
  let files = [];

  const imageModules = import.meta.glob("./images/*.{jpg,jpeg,png,gif}");

  for (const modulePath in imageModules) {
    imageModules[modulePath]().then(({ default: imageUrl }) => {
      files.push(imageUrl);
    });
  }

  return files;
};

export function load() {
  return {
    images: loadImages(),
  };
}
