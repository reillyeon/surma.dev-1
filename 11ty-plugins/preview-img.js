const { parse, serialize } = require("parse5");
const { convert } = require("imagemagick");
const { promisify } = require("util");
const { join, extname } = require("path");
const { access } = require("fs").promises;

const convertP = promisify(convert);

function exists(path) {
  return access(path)
    .then(() => true)
    .catch(() => false);
}

function zip(...arrs) {
  const resultLength = Math.min(...arrs.map(a => a.length));
  return new Array(resultLength).fill(0).map((_, i) => arrs.map(a => a[i]));
}

function findNodesByName(node, name) {
  let children = [];
  if (node.childNodes) {
    children = node.childNodes;
  }
  return [
    ...(node.nodeName === name ? [node] : []),
    ...children.flatMap(child => findNodesByName(child, name))
  ];
}

function popAttributeByName(node, name) {
  if (!node.attrs) {
    return;
  }
  const idx = node.attrs.findIndex(attr => attr.name === name);
  if (idx < 0) {
    return;
  }
  const [attr] = node.attrs.splice(idx, 1);
  return attr.value;
}

async function transformMarkup(rawContent, outputPath) {
  if (!outputPath.endsWith(".html")) {
    return rawContent;
  }
  const document = parse(rawContent);
  const imgs = findNodesByName(document, "preview-img");
  const p = imgs.map(async img => {
    img.nodeName = img.tagName = "img";
    const width = popAttributeByName(img, "width");
    const height = popAttributeByName(img, "height");
    const quality = popAttributeByName(img, "quality");
    const src = popAttributeByName(img, "src");
    const filenameNoExt = src.replace(/\.[^.]+$/, "");
    const ext = extname(src);

    const resolutions = new Array(6).fill(0).map((_, i) => i / 2 + 1);
    const images = await Promise.all(
      resolutions.map(async resolution => {
        const outputName = `${filenameNoExt}.${resolution}x${ext}`;
        if (await exists(join(".tmp/", outputName))) {
          return outputName;
        }

        await convertP([
          join("assets/", src),
          "-resize",
          `${Math.floor(width * resolution)}x${Math.floor(
            height * resolution
          )}`,
          "-quality",
          `${quality}`,
          join(".tmp/", outputName)
        ]);
        return outputName;
      })
    );

    img.attrs.push(
      {
        name: "src",
        value: `emitChunk(${images[0]})`
      },
      {
        name: "srcset",
        value: zip(resolutions, images)
          .map(([resolution, image]) => `emitChunk(${image}) ${resolution}x`)
          .join(", ")
      }
    );
  });
  await Promise.all(p);
  return serialize(document);
}

module.exports = {
  configFunction: (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("preview-img", transformMarkup);
  }
};