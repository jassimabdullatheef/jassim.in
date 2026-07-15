const IMAGE_TAGS = {
  // Feathers & Fur
  'AT3A0861-Edit.jpg': ['feathers-fur'],
  'AT3A0880.jpg': ['feathers-fur'],
  'AT3A1035.jpg': ['feathers-fur'],
  'AT3A2641-Edit-Edit.jpg': ['feathers-fur'],
  'AT3A2761.jpg': ['feathers-fur'],
  'AT3A4453.jpg': ['feathers-fur'],
  'img_8910-edit.jpg': ['feathers-fur'],
  'img_8892-edit.jpg': ['feathers-fur'],
  'IMG_7577-Edit.jpg': ['feathers-fur'],
  'IMG_9804-Edit-Edit.jpg': ['feathers-fur'],
  'IMG_6113-Edit.jpg': ['feathers-fur'],
  'IMG_8144.jpg': ['feathers-fur'],
  'IMG_8156-Edit.jpg': ['feathers-fur'],
  'img_8927.jpg': ['feathers-fur'],
  'img_6099.jpg': ['feathers-fur'],
  'img_8865.jpg': ['feathers-fur'],
  // Architecture
  'IMG_6438-Edit.jpg': ['architecture'],
  'IMG_6521-Edit.jpg': ['architecture'],
  'IMG_8726.jpg': ['architecture'],
  'at3a4530.jpg': ['architecture'],
  'at3a4536-pano-2-edit.jpg': ['architecture'],
  'at3a4527-edit-3.jpg': ['architecture'],
  'img_8896-edit.jpg': ['architecture'],
  'img_8825.jpg': ['architecture'],
  'img_8672.jpg': ['architecture'],
  'img_8680.jpg': ['architecture'],
  'img_8722.jpg': ['architecture'],
  'img_8630-edit-edit.jpg': ['architecture'],
  'img_8669-pano.jpg': ['architecture'],
  'img_8569-edit-edit-edit.jpg': ['architecture'],
  'dscf1168.jpg': ['nature'],
  // Nature
  'IMG_6701-Edit.jpg': ['nature'],
  'IMG_7492.jpg': ['nature'],
  'IMG_7526-Edit.jpg': ['nature'],
  'IMG_7625-Edit-2.jpg': ['nature'],
  'AT3A3918-Edit-2.jpg': ['nature'],
  'IMG_8349-Edit.jpg': ['nature'],
  'IMG_8370-Edit.jpg': ['nature'],
  'img_4810.jpg': ['nature'],
  'img_8448-edit-edit.jpg': ['nature'],
  'img_8456.jpg': ['nature'],
  'img_9101.jpg': ['nature'],
  'img_9102.jpg': ['nature'],
  'IMG_9392-Edit.jpg': ['nature'],
  'Natural Arch.jpg': ['nature'],
};

const ALBUM_LABELS = {
  'feathers-fur': 'Feathers & Fur',
  architecture: 'Architecture',
  nature: 'Nature',
  misc: 'Misc',
};

const imageModules = import.meta.glob(
  "/src/routes/\\(site\\)/photography/images/*.{jpg,jpeg,png,gif}",
  { eager: true }
);

/**
 * Load photography images grouped by their tag/album.
 * @returns {{ images: Array<{url: string, tags: string[]}>, albums: Array<{key: string, label: string, cover: string, photos: string[]}> }}
 */
export function loadPhotographyData() {
  const images = Object.entries(imageModules).map(([path, module]) => {
    const url = /** @type {{ default: string }} */ (module).default;
    const filename = path.split("/").pop() || "";
    const tags = IMAGE_TAGS[filename] ?? ["misc"];
    return { url, tags };
  });

  /** @type {Record<string, string[]>} */
  const grouped = {};
  for (const img of images) {
    for (const tag of img.tags) {
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(img.url);
    }
  }

  const albums = Object.entries(grouped).map(([key, photos]) => ({
    key,
    label: ALBUM_LABELS[key] || key,
    cover: photos[0],
    photos,
  }));

  return { images, albums };
}
