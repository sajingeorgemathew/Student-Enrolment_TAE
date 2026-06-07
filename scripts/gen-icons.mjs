// One-off icon generator for BRAND-01.
// Derives square app icons from the existing repo logo (public/logo.png).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const SRC = "public/logo.png";
// Tight bounding box of the Toronto Academy "T" emblem (detected from logo,
// stops before the white wordmark which begins at x=345).
const emblem = { left: 123, top: 252, width: 221, height: 187 };
const NAVY = { r: 30, g: 51, b: 96, alpha: 1 };

// Extract the emblem, then pad with the navy brand background into a centered
// square so the mark has even breathing room and never clips the wordmark.
async function squareBuffer() {
  const padX = 30; // horizontal padding each side
  const side = emblem.width + padX * 2;
  const padY = Math.round((side - emblem.height) / 2);
  return sharp(SRC)
    .extract(emblem)
    .extend({ top: padY, bottom: padY, left: padX, right: padX, background: NAVY })
    .resize(side, side, { fit: "cover" })
    .png()
    .toBuffer();
}

async function pngBuffer(size) {
  // ensureAlpha keeps the embedded PNGs in RGBA, which the .ico decoder requires.
  return sharp(await squareBuffer())
    .resize(size, size, { fit: "cover" })
    .ensureAlpha()
    .png()
    .toBuffer();
}

function buildIco(images) {
  // images: [{ size, buf }]
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const dataChunks = [];
  images.forEach((img, i) => {
    const e = i * 16;
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e + 0); // width
    entries.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1); // height
    entries.writeUInt8(0, e + 2); // color palette
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // planes
    entries.writeUInt16LE(32, e + 6); // bit depth
    entries.writeUInt32LE(img.buf.length, e + 8); // size of data
    entries.writeUInt32LE(offset, e + 12); // offset
    offset += img.buf.length;
    dataChunks.push(img.buf);
  });

  return Buffer.concat([header, entries, ...dataChunks]);
}

const sizes = [16, 32, 48];
const bufs = await Promise.all(sizes.map(pngBuffer));
const ico = buildIco(sizes.map((size, i) => ({ size, buf: bufs[i] })));
writeFileSync("src/app/favicon.ico", ico);

writeFileSync("src/app/icon.png", await pngBuffer(512));
writeFileSync("src/app/apple-icon.png", await pngBuffer(180));

console.log("Generated src/app/favicon.ico, icon.png, apple-icon.png");
