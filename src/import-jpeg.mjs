// JPEG pictures read: the baseline kind (what most tools and every glTF exporter write), so that a bought
// model's picture in a .jpg, or inside a .glb, can be made a texture as a PNG is.
//
//   unjpeg(bytes)   { width, height, rgb }: eight bits a channel, grey or colour, any sampling of the colour
//
// Read: baseline and extended sequential JPEG with Huffman coding (SOF0, SOF1), 8 bits a sample, one component
// (grey) or three (YCbCr, or RGB when an Adobe marker says so), each sampled at any of 1 to 4 a side,
// interleaved scans or one component a scan, restart markers. Not read, and refused saying so: progressive
// JPEG (SOF2), lossless and arithmetic coding, 12 bit samples, four components (CMYK). Colour that is sampled
// at half is spread back by repeating its samples (libjpeg blends between them: a picture can differ from what
// another reader shows by a step or two at the edges of colour, which a 256 colour texture does not keep).
// A plain floating point inverse DCT: values agree with libjpeg's to within a step or two of 255.

/** The order the 64 coefficients of a block are written in: the zigzag from the top left. */
const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40, 48, 41, 34, 27, 20, 13, 6, 7, 14, 21,
  28, 35, 42, 49, 56, 57, 50, 43, 36, 29, 22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61,
  54, 47, 55, 62, 63,
];
/** cos((2x + 1) u pi / 16), with the factor 1/sqrt(2) for u = 0: the inverse DCT's table, [u * 8 + x]. */
const COSINES = Float64Array.from({ length: 64 }, (_, i) => {
  const u = Math.floor(i / 8);
  const x = i % 8;
  return (u ? 1 : Math.SQRT1_2) * Math.cos(((2 * x + 1) * u * Math.PI) / 16);
});
/** The markers: start of a frame of each kind, the tables, a scan, a restart, the end. */
const SOF_BASELINE = 0xc0;
const SOF_EXTENDED = 0xc1;
const DHT = 0xc4;
const DQT = 0xdb;
const DRI = 0xdd;
const SOS = 0xda;
const EOI = 0xd9;
const APP14 = 0xee;
const RST_FIRST = 0xd0;
const RST_LAST = 0xd7;

/** A Huffman table as a lookup: for each code length, the first code and where its symbols begin. */
function huffmanTable(counts, symbols) {
  const table = { maxCode: new Int32Array(18).fill(-1), offset: new Int32Array(17), symbols };
  let code = 0;
  let k = 0;
  for (let length = 1; length <= 16; length++) {
    table.offset[length] = k - code;
    code += counts[length - 1];
    k += counts[length - 1];
    if (counts[length - 1]) table.maxCode[length] = code - 1;
    code <<= 1;
  }
  return table;
}

/** The 8x8 samples of a block from its 64 coefficients (natural order, already multiplied by their steps). */
function inverseDct(coefficients, out, at, stride) {
  const rows = new Float64Array(64);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      let sum = 0;
      for (let u = 0; u < 8; u++) sum += COSINES[u * 8 + x] * coefficients[y * 8 + u];
      rows[y * 8 + x] = sum / 2;
    }
  for (let x = 0; x < 8; x++)
    for (let y = 0; y < 8; y++) {
      let sum = 0;
      for (let v = 0; v < 8; v++) sum += COSINES[v * 8 + y] * rows[v * 8 + x];
      const value = Math.round(sum / 2 + 128);
      out[at + y * stride + x] = value < 0 ? 0 : value > 255 ? 255 : value;
    }
}

/**
 * A baseline JPEG file's picture: { width, height, rgb }. It throws, saying what is read, on a kind of JPEG
 * that is not (progressive, arithmetic, 12 bit, CMYK) and on a file cut short.
 */
export function unjpeg(buffer) {
  const bytes = Buffer.from(buffer.buffer ?? buffer, buffer.byteOffset ?? 0, buffer.length);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("not a JPEG file");
  const quantisers = [];
  const dcTables = [];
  const acTables = [];
  let frame = null;
  let restartInterval = 0;
  let adobeTransform = null;
  let at = 2;
  const segment = () => {
    if (at + 4 > bytes.length) throw new Error("the JPEG is cut short");
    return bytes.readUInt16BE(at + 2);
  };
  while (at < bytes.length) {
    if (bytes[at] !== 0xff) {
      at++;
      continue;
    }
    const marker = bytes[at + 1];
    if (marker === 0xff) {
      at++;
      continue;
    }
    if (marker === EOI) break;
    if (marker >= RST_FIRST && marker <= RST_LAST) {
      at += 2;
      continue;
    }
    const length = segment();
    const data = bytes.subarray(at + 4, at + 2 + length);
    if (marker === DQT) {
      for (let k = 0; k < data.length; ) {
        const wide = data[k] >> 4;
        const id = data[k] & 15;
        const table = new Int32Array(64);
        for (let i = 0; i < 64; i++) table[i] = wide ? data.readUInt16BE(k + 1 + i * 2) : data[k + 1 + i];
        quantisers[id] = table;
        k += 1 + 64 * (wide ? 2 : 1);
      }
    } else if (marker === DHT) {
      for (let k = 0; k < data.length; ) {
        const kind = data[k] >> 4;
        const id = data[k] & 15;
        const counts = data.subarray(k + 1, k + 17);
        const total = counts.reduce((sum, n) => sum + n, 0);
        const table = huffmanTable(counts, data.subarray(k + 17, k + 17 + total));
        (kind ? acTables : dcTables)[id] = table;
        k += 17 + total;
      }
    } else if (marker === SOF_BASELINE || marker === SOF_EXTENDED) {
      if (data[0] !== 8) throw new Error(`a JPEG of ${data[0]} bits a sample: 8 are read`);
      const count = data[5];
      if (count !== 1 && count !== 3)
        throw new Error(`a JPEG of ${count} components: grey (1) and colour (3) are read, not CMYK`);
      frame = {
        height: data.readUInt16BE(1),
        width: data.readUInt16BE(3),
        components: Array.from({ length: count }, (_, i) => ({
          id: data[6 + i * 3],
          h: data[7 + i * 3] >> 4,
          v: data[7 + i * 3] & 15,
          q: data[8 + i * 3],
          predictor: 0,
        })),
      };
      frame.hMax = Math.max(...frame.components.map((c) => c.h));
      frame.vMax = Math.max(...frame.components.map((c) => c.v));
      frame.mcusAcross = Math.ceil(frame.width / (8 * frame.hMax));
      frame.mcusDown = Math.ceil(frame.height / (8 * frame.vMax));
      for (const c of frame.components) {
        c.blocksAcross = frame.mcusAcross * c.h;
        c.blocksDown = frame.mcusDown * c.v;
        c.samples = new Uint8Array(c.blocksAcross * 8 * c.blocksDown * 8);
      }
    } else if (marker >= 0xc2 && marker <= 0xcf && marker !== DHT && marker !== 0xc8 && marker !== 0xcc) {
      const kind = marker === 0xc2 ? "progressive" : marker === 0xc3 ? "lossless" : "arithmetic or hierarchical";
      throw new Error(`a ${kind} JPEG (SOF${marker - 0xc0}): baseline JPEG is what is read. Save it again as a PNG, or as a baseline JPEG`);
    } else if (marker === DRI) restartInterval = data.readUInt16BE(0);
    else if (marker === APP14 && data.toString("latin1", 0, 5) === "Adobe") adobeTransform = data[11];
    else if (marker === SOS) {
      if (!frame) throw new Error("the JPEG has a scan before its frame");
      at = scan(bytes, at + 2 + length, data, frame, { quantisers, dcTables, acTables, restartInterval });
      continue;
    }
    at += 2 + length;
  }
  if (!frame) throw new Error("the JPEG has no frame: it is not whole");
  return colours(frame, adobeTransform);
}

/** One scan's coded data read into its components' samples. Returns where the data ends. */
function scan(bytes, from, header, frame, { quantisers, dcTables, acTables, restartInterval }) {
  const count = header[0];
  const components = Array.from({ length: count }, (_, i) => {
    const component = frame.components.find((c) => c.id === header[1 + i * 2]);
    if (!component) throw new Error("the JPEG's scan names a component its frame has not");
    component.dc = dcTables[header[2 + i * 2] >> 4];
    component.ac = acTables[header[2 + i * 2] & 15];
    component.quantiser = quantisers[component.q];
    if (!component.dc || !component.ac || !component.quantiser)
      throw new Error("the JPEG's scan names a table it has not given");
    component.predictor = 0;
    return component;
  });
  // the coded bits, with the zero byte after every 0xff taken out, up to the next marker that is no restart
  let at = from;
  let bits = 0;
  let bitCount = 0;
  const bit = () => {
    if (!bitCount) {
      let byte = 0;
      if (at < bytes.length) {
        byte = bytes[at];
        if (byte === 0xff) {
          const next = bytes[at + 1];
          if (next === 0) at += 2;
          else byte = 0; // a marker: what is left reads as zeros
        } else at++;
      }
      bits = byte;
      bitCount = 8;
    }
    bitCount--;
    return (bits >> bitCount) & 1;
  };
  const receive = (length) => {
    let value = 0;
    for (let i = 0; i < length; i++) value = (value << 1) | bit();
    return value;
  };
  const extend = (value, length) => (length && value < 1 << (length - 1) ? value - (1 << length) + 1 : value);
  const decode = (table) => {
    let code = 0;
    for (let length = 1; length <= 16; length++) {
      code = (code << 1) | bit();
      if (code <= table.maxCode[length]) return table.symbols[code + table.offset[length]];
    }
    throw new Error("the JPEG's coded data is not whole (a code no table has)");
  };
  const coefficients = new Float64Array(64);
  const block = (component, row, column) => {
    coefficients.fill(0);
    const size = decode(component.dc);
    component.predictor += size ? extend(receive(size), size) : 0;
    coefficients[0] = component.predictor * component.quantiser[0];
    for (let k = 1; k < 64; ) {
      const symbol = decode(component.ac);
      const zeros = symbol >> 4;
      const length = symbol & 15;
      if (!length) {
        if (zeros !== 15) break;
        k += 16;
        continue;
      }
      k += zeros;
      if (k > 63) break;
      coefficients[ZIGZAG[k]] = extend(receive(length), length) * component.quantiser[k];
      k++;
    }
    const stride = component.blocksAcross * 8;
    if (row < component.blocksDown && column < component.blocksAcross)
      inverseDct(coefficients, component.samples, row * 8 * stride + column * 8, stride);
  };
  const single = count === 1;
  const one = components[0];
  // one component alone is read in its own blocks, as many as its part of the picture needs
  const across = single ? Math.ceil(Math.ceil((frame.width * one.h) / frame.hMax) / 8) : frame.mcusAcross;
  const down = single ? Math.ceil(Math.ceil((frame.height * one.v) / frame.vMax) / 8) : frame.mcusDown;
  const total = across * down;
  for (let n = 0; n < total; n++) {
    if (restartInterval && n && n % restartInterval === 0) {
      // a restart: the bits begin again at a whole byte after the marker, and so do the predictors
      bitCount = 0;
      while (at + 1 < bytes.length && !(bytes[at] === 0xff && bytes[at + 1] >= RST_FIRST && bytes[at + 1] <= RST_LAST)) at++;
      at += 2;
      for (const component of components) component.predictor = 0;
    }
    const mcuRow = Math.floor(n / across);
    const mcuColumn = n % across;
    if (single) block(one, mcuRow, mcuColumn);
    else
      for (const component of components)
        for (let v = 0; v < component.v; v++)
          for (let h = 0; h < component.h; h++) block(component, mcuRow * component.v + v, mcuColumn * component.h + h);
  }
  // past the coded data: to the next marker that is not a restart
  while (at + 1 < bytes.length && !(bytes[at] === 0xff && bytes[at + 1] !== 0 && !(bytes[at + 1] >= RST_FIRST && bytes[at + 1] <= RST_LAST))) at++;
  return at;
}

/** The components' samples as RGB, each spread over the pixels it covers. */
function colours(frame, adobeTransform) {
  const { width, height, components, hMax, vMax } = frame;
  const rgb = new Uint8Array(width * height * 3);
  const sampleOf = (component, x, y) =>
    component.samples[
      Math.floor((y * component.v) / vMax) * component.blocksAcross * 8 + Math.floor((x * component.h) / hMax)
    ];
  const clamp = (value) => (value < 0 ? 0 : value > 255 ? 255 : Math.round(value));
  // three components are YCbCr unless an Adobe marker says they are RGB (its transform 0)
  const plainRgb = components.length === 3 && adobeTransform === 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      if (components.length === 1) {
        rgb[i] = rgb[i + 1] = rgb[i + 2] = sampleOf(components[0], x, y);
        continue;
      }
      const [a, b, c] = components.map((component) => sampleOf(component, x, y));
      if (plainRgb) {
        rgb[i] = a;
        rgb[i + 1] = b;
        rgb[i + 2] = c;
      } else {
        rgb[i] = clamp(a + 1.402 * (c - 128));
        rgb[i + 1] = clamp(a - 0.344136 * (b - 128) - 0.714136 * (c - 128));
        rgb[i + 2] = clamp(a + 1.772 * (b - 128));
      }
    }
  return { width, height, rgb };
}
