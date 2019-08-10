const html = require("../../render-string");
const quality = 40;
const size = 320;

module.exports = class Gallery {
  data() {
    return {
      layout: "default"
    };
  }

  async render({ collections }) {
    return html`
      <link rel="stylesheet" href="emitChunk(/gallery.css)" />
      <div class="grid" style="--gallery-size: ${size}px;">
        ${collections.photo
          .filter(entry => entry.data.live)
          .map(
            item => html`
              <a href="${item.url}">
                <preview-img
                  src="${item.url}${item.data.file}"
                  width="${size}"
                  height="${size}"
                  quality="${quality}"
                ></preview-img>
              </a>
            `
          )}
      </div>
    `;
  }
};
