// A small TIFF reader for the HABS sheets, and a PNG writer for what is made of them. Node 18, no dependencies.
//
// It reads what the Library of Congress serves for these: the first image of the file, in strips, uncompressed,
// PackBits or LZW (with or without the horizontal predictor), 1 bit a pixel (black and white), 8 bits grey, or
// 8 bits RGB (chunky). Tiles, CCITT fax and JPEG compression, 16 bits and planar RGB are refused with a sentence.

import { deflateSync } from "node:zlib";

const TAG = {
  width: 256, height: 257, bitsPerSample: 258, compression: 259, photometric: 262, stripOffsets: 273,
  samplesPerPixel: 277, rowsPerStrip: 278, stripByteCounts: 279, planar: 284, predictor: 317, tileWidth: 322,
};
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

/** The tags of a TIFF's first image, each a list of numbers (or a string), and the reader's byte order. */
export function tiffTags(buf) {
  const order = buf.toString("latin1", 0, 2);
  if (order !== "II" && order !== "MM") throw new Error("not a TIFF file");
  const le = order === "II";
  const u16 = (at) => (le ? buf.readUInt16LE(at) : buf.readUInt16BE(at));
  const u32 = (at) => (le ? buf.readUInt32LE(at) : buf.readUInt32BE(at));
  if (u16(2) !== 42) throw new Error("a BigTIFF or not a TIFF: only classic TIFF is read");
  const ifd = u32(4);
  const count = u16(ifd);
  const tags = {};
  for (let i = 0; i < count; i++) {
    const at = ifd + 2 + i * 12;
    const tag = u16(at), type = u16(at + 2), n = u32(at + 4);
    const size = (TYPE_SIZE[type] ?? 1) * n;
    const where = size <= 4 ? at + 8 : u32(at + 8);
    if (type === 2) tags[tag] = buf.toString("latin1", where, where + n).replace(/\0+$/, "");
    else {
      const values = [];
      for (let k = 0; k < n; k++) {
        if (type === 3) values.push(u16(where + 2 * k));
        else if (type === 4) values.push(u32(where + 4 * k));
        else if (type === 5) values.push(u32(where + 8 * k) / u32(where + 8 * k + 4));
        else values.push(buf[where + k]);
      }
      tags[tag] = values;
    }
  }
  return tags;
}

function packBits(src, size) {
  const out = new Uint8Array(size);
  let i = 0, o = 0;
  while (i < src.length && o < size) {
    const n = (src[i++] << 24) >> 24;
    if (n >= 0) {
      for (let k = 0; k <= n && o < size; k++) out[o++] = src[i++];
    } else if (n !== -128) {
      const v = src[i++];
      for (let k = 0; k < 1 - n && o < size; k++) out[o++] = v;
    }
  }
  return out;
}

// TIFF's LZW: codes of 9 to 12 bits, most significant bit first, 256 clear and 257 end, and the code width grows
// one code early (at 511, 1023, 2047), as libtiff writes it.
function lzw(src, size) {
  const out = new Uint8Array(size);
  const prefix = new Int32Array(4096), suffix = new Uint8Array(4096), length = new Int32Array(4096);
  for (let c = 0; c < 256; c++) { prefix[c] = -1; suffix[c] = c; length[c] = 1; }
  let next = 258, width = 9, old = -1, o = 0, bitPos = 0;
  const totalBits = src.length * 8;
  const read = () => {
    if (bitPos + width > totalBits) return 257;
    let v = 0;
    for (let k = 0; k < width; k++) {
      const p = bitPos + k;
      v = (v << 1) | ((src[p >> 3] >> (7 - (p & 7))) & 1);
    }
    bitPos += width;
    return v;
  };
  const emit = (code) => {
    const n = length[code];
    let c = code;
    for (let k = n - 1; k >= 0; k--) {
      if (o + k < size) out[o + k] = suffix[c];
      c = prefix[c];
    }
    o += n;
  };
  const first = (code) => { let c = code; while (prefix[c] >= 0) c = prefix[c]; return suffix[c]; };
  for (;;) {
    const code = read();
    if (code === 257 || o >= size) break;
    if (code === 256) { next = 258; width = 9; old = -1; continue; }
    if (old < 0) { emit(code); old = code; continue; }
    if (code < next) {
      emit(code);
      prefix[next] = old; suffix[next] = first(code); length[next] = length[old] + 1;
    } else {
      prefix[next] = old; suffix[next] = first(old); length[next] = length[old] + 1;
      emit(next);
    }
    next++;
    old = code;
    if (next + 1 >= 1 << width && width < 12) width++;
  }
  return out;
}

/**
 * A TIFF read: { width, height, channels (1 grey or 3 RGB), data } with 8 bits a channel, black 0 and white 255
 * whatever the file's photometric is, and `kind`, a line saying what the file was.
 */
export function readTiff(buf) {
  const t = tiffTags(buf);
  const one = (tag, fallback) => (t[tag] === undefined ? fallback : t[tag][0]);
  if (t[TAG.tileWidth]) throw new Error("a tiled TIFF: only strips are read");
  const width = one(TAG.width), height = one(TAG.height);
  const bits = one(TAG.bitsPerSample, 1), spp = one(TAG.samplesPerPixel, 1);
  const compression = one(TAG.compression, 1), photometric = one(TAG.photometric, 1);
  const predictor = one(TAG.predictor, 1), planar = one(TAG.planar, 1);
  if (![1, 5, 32773].includes(compression))
    throw new Error(`TIFF compression ${compression} is not read (uncompressed 1, LZW 5 and PackBits 32773 are)`);
  if (!((bits === 1 && spp === 1) || (bits === 8 && (spp === 1 || spp === 3 || spp === 4))))
    throw new Error(`a TIFF of ${spp} samples of ${bits} bits is not read`);
  if (spp > 1 && planar !== 1) throw new Error("a TIFF with its colours in planes is not read");
  const rowBytes = bits === 1 ? Math.ceil(width / 8) : width * spp;
  const rowsPerStrip = one(TAG.rowsPerStrip, height);
  const offsets = t[TAG.stripOffsets], counts = t[TAG.stripByteCounts];
  const channels = spp === 1 ? 1 : 3;
  const data = new Uint8Array(width * height * channels);
  for (let s = 0; s < offsets.length; s++) {
    const y0 = s * rowsPerStrip, rows = Math.min(rowsPerStrip, height - y0);
    if (rows <= 0) break;
    const size = rows * rowBytes;
    const raw = buf.subarray(offsets[s], offsets[s] + counts[s]);
    const strip = compression === 1 ? raw : compression === 5 ? lzw(raw, size) : packBits(raw, size);
    for (let r = 0; r < rows; r++) {
      const line = strip.subarray(r * rowBytes, (r + 1) * rowBytes);
      const y = y0 + r;
      if (bits === 1) {
        // photometric 0: white is zero (a 1 bit is black); 1: black is zero
        for (let x = 0; x < width; x++) {
          const bit = (line[x >> 3] >> (7 - (x & 7))) & 1;
          data[y * width + x] = (photometric === 0 ? bit === 0 : bit === 1) ? 255 : 0;
        }
      } else {
        const l = Uint8Array.from(line);
        if (predictor === 2) for (let x = spp; x < l.length; x++) l[x] = (l[x] + l[x - spp]) & 255;
        for (let x = 0; x < width; x++)
          for (let c = 0; c < channels; c++) {
            const v = l[x * spp + c];
            data[(y * width + x) * channels + c] = channels === 1 && photometric === 0 ? 255 - v : v;
          }
      }
    }
  }
  const name = { 1: "uncompressed", 5: "LZW", 32773: "PackBits" }[compression];
  const kind = `${width} x ${height}, ${bits === 1 ? "1 bit" : spp === 1 ? "8 bit grey" : "8 bit RGB"}, ${name}, ${offsets.length} strips, photometric ${photometric}`;
  return { width, height, channels, data, kind };
}

/** Part of an image ({ x, y, w, h } in its pixels) made `outWidth` wide by averaging each block of pixels. */
export function scaleBox(img, outWidth, area = { x: 0, y: 0, w: img.width, h: img.height }) {
  const { width, channels, data } = img;
  const k = area.w / outWidth;
  const ow = Math.max(1, Math.round(outWidth)), oh = Math.max(1, Math.round(area.h / k));
  const out = new Uint8Array(ow * oh * channels);
  const sum = new Float64Array(ow * channels), cnt = new Float64Array(ow);
  const colOf = new Int32Array(area.w);
  for (let x = 0; x < area.w; x++) colOf[x] = Math.min(ow - 1, Math.floor(x / k));
  let oy = 0;
  for (let y = 0; y < area.h; y++) {
    const row = (area.y + y) * width + area.x;
    for (let x = 0; x < area.w; x++) {
      const o = colOf[x];
      cnt[o]++;
      for (let c = 0; c < channels; c++) sum[o * channels + c] += data[(row + x) * channels + c];
    }
    const ny = Math.min(oh - 1, Math.floor((y + 1) / k));
    if (ny !== oy || y === area.h - 1) {
      for (let x = 0; x < ow; x++)
        for (let c = 0; c < channels; c++) out[(oy * ow + x) * channels + c] = Math.round(sum[x * channels + c] / (cnt[x] || 1));
      sum.fill(0); cnt.fill(0);
      oy = ny;
    }
  }
  return { width: ow, height: oh, channels, data: out };
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (b) => {
  let c = -1;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
const chunk = (type, body) => {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0);
  out.write(type, 4, "latin1");
  body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
};

/** A PNG of 8 bits a channel, grey (1 channel) or RGB (3): the kind the kit's `unpng` reads. */
export function pngOf({ width, height, channels, data }) {
  const head = Buffer.alloc(13);
  head.writeUInt32BE(width, 0);
  head.writeUInt32BE(height, 4);
  head[8] = 8;
  head[9] = channels === 1 ? 0 : 2;
  const stride = width * channels;
  const rows = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(rows, y * (stride + 1) + 1);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", head),
    chunk("IDAT", deflateSync(rows, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
