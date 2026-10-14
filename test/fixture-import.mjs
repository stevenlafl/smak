// Files of other tools written from nothing, for the cases of the readers (tests 34 to 39): FBX in its binary
// form (32 and 64 bit records, arrays packed with zlib or not) and in its text form, and glTF as a .glb or as a
// .gltf with its .bin. Only what a case needs is written: no footer, no templates beyond what is asked.
import { deflateSync } from "node:zlib";

// ── FBX ────────────────────────────────────────────────────────────────────
/** A value of a record with its kind: the letter FBX writes before it. */
export const I = (value) => ["I", value];
export const L = (value) => ["L", value];
export const D = (value) => ["D", value];
export const S = (value) => ["S", value];
export const C = (value) => ["C", value];
/** Arrays: of doubles, of 32 bit whole numbers, of 64 bit ones; `packed` writes them through zlib. */
export const doubles = (values, packed = false) => ["d", values, packed];
export const ints = (values, packed = false) => ["i", values, packed];
export const longs = (values, packed = false) => ["l", values, packed];
export const floats = (values, packed = false) => ["f", values, packed];
/** A record: { name, props, nodes }. */
export const record = (name, props = [], nodes = []) => ({ name, props, nodes });

/** One property of a Properties70: name, kind, label, flags, values (numbers are doubles unless kinds are given). */
export const P = (name, kind, ...values) =>
  record("P", [S(name), S(kind), S(""), S("A"), ...values.map((value) => (Array.isArray(value) ? value : D(value)))]);
export const properties = (...list) => record("Properties70", [], list);

/** The bytes of one value. */
function valueBytes([kind, value, packed]) {
  const head = Buffer.from(kind, "latin1");
  if (kind === "I") return Buffer.concat([head, int32(value)]);
  if (kind === "D") {
    const b = Buffer.alloc(8);
    b.writeDoubleLE(value);
    return Buffer.concat([head, b]);
  }
  if (kind === "L") {
    const b = Buffer.alloc(8);
    b.writeBigInt64LE(BigInt(value));
    return Buffer.concat([head, b]);
  }
  if (kind === "C") return Buffer.concat([head, Buffer.from([value ? 1 : 0])]);
  if (kind === "S") {
    const text = Buffer.from(value, "utf8");
    return Buffer.concat([head, int32(text.length), text]);
  }
  const width = { d: 8, f: 4, i: 4, l: 8 }[kind];
  const raw = Buffer.alloc(value.length * width);
  value.forEach((v, i) => {
    if (kind === "d") raw.writeDoubleLE(v, i * width);
    else if (kind === "f") raw.writeFloatLE(v, i * width);
    else if (kind === "i") raw.writeInt32LE(v, i * width);
    else raw.writeBigInt64LE(BigInt(v), i * width);
  });
  const stored = packed ? deflateSync(raw) : raw;
  return Buffer.concat([head, int32(value.length), int32(packed ? 1 : 0), int32(stored.length), stored]);
}
function int32(value) {
  const b = Buffer.alloc(4);
  b.writeInt32LE(value);
  return b;
}

/** A binary FBX file of these top records. Version 7500 and later write the record's counts in 64 bits. */
export function fbxBinary(records, version = 7400) {
  const wide = version >= 7500;
  const countBytes = wide ? 8 : 4;
  const header = Buffer.alloc(27);
  header.write("Kaydara FBX Binary  ", 0, "latin1");
  header[20] = 0;
  header[21] = 0x1a;
  header[22] = 0;
  header.writeUInt32LE(version, 23);
  const parts = [header];
  let at = header.length;
  const count = (value) => {
    const b = Buffer.alloc(countBytes);
    if (wide) b.writeBigUInt64LE(BigInt(value));
    else b.writeUInt32LE(value);
    return b;
  };
  const empty = () => Buffer.alloc(countBytes * 3 + 1);
  const write = (node) => {
    const values = node.props.map(valueBytes);
    const valueLength = values.reduce((sum, b) => sum + b.length, 0);
    const name = Buffer.from(node.name, "latin1");
    const start = at;
    const headLength = countBytes * 3 + 1 + name.length;
    at += headLength + valueLength;
    const inner = [];
    for (const child of node.nodes) inner.push(...write(child));
    if (node.nodes.length) {
      inner.push(empty());
      at += countBytes * 3 + 1;
    }
    const head = Buffer.concat([count(at), count(node.props.length), count(valueLength), Buffer.from([name.length]), name]);
    if (start + head.length !== start + headLength) throw new Error("fbxBinary: a record's head");
    return [head, ...values, ...inner];
  };
  for (const node of records) parts.push(...write(node));
  parts.push(empty());
  return Buffer.concat(parts);
}

/** The same records as an FBX in its text form. */
export function fbxText(records, version = 7400) {
  const valueText = ([kind, value]) => {
    if (kind === "S") return `"${value}"`;
    if (kind === "C") return value ? "T" : "F";
    if (kind === "d" || kind === "f" || kind === "i" || kind === "l") return `*${value.length} {\n\ta: ${Array.from(value).join(",")}\n}`;
    return String(value);
  };
  const lines = ["; FBX 7.4.0 project file", ""];
  const write = (node, depth) => {
    const pad = "\t".repeat(depth);
    const said = node.props.map(valueText).join(", ");
    if (!node.nodes.length) lines.push(`${pad}${node.name}: ${said}`);
    else {
      lines.push(`${pad}${node.name}: ${said} {`);
      for (const child of node.nodes) write(child, depth + 1);
      lines.push(`${pad}}`);
    }
  };
  write(record("FBXHeaderExtension", [], [record("FBXVersion", [I(version)])]), 0);
  for (const node of records) write(node, 0);
  return lines.join("\n");
}

/** An object's name as a binary file writes it: the name, two bytes, its class. */
export const objectName = (name, kind) => `${name}\u0000\u0001${kind}`;

/** GlobalSettings: which axis is up and which the front (axis numbers, signs), and centimetres a unit. */
export const globalSettings = ({ up = [1, 1], front = [2, 1], unit = 1 } = {}) =>
  record("GlobalSettings", [], [
    properties(
      P("UpAxis", "int", I(up[0])),
      P("UpAxisSign", "int", I(up[1])),
      P("FrontAxis", "int", I(front[0])),
      P("FrontAxisSign", "int", I(front[1])),
      P("CoordAxis", "int", I(0)),
      P("CoordAxisSign", "int", I(1)),
      P("UnitScaleFactor", "double", D(unit)),
    ),
  ]);

/** A Model record: a node, with its place as Properties70 of [name, x, y, z]. */
export const model = (id, name, kind, place = []) =>
  record("Model", [L(id), S(objectName(name, "Model")), S(kind)], [
    properties(...place.map(([property, ...values]) => (property === "RotationOrder" ? P(property, "enum", I(values[0])) : P(property, "Lcl", ...values)))),
  ]);

/**
 * A Geometry record of a mesh: points, polygons (each a list of point numbers: the last is written as
 * -(n) - 1), and its layers: `uv` { values, index, mapping }, `normals` { values, mapping }, `materials` (a
 * number a polygon, or one for all). `packed`: the points through zlib.
 */
export function geometry(id, name, { points, polygons, uv, normals, materials, packed = false }) {
  const corners = polygons.flatMap((polygon) => polygon.map((point, i) => (i === polygon.length - 1 ? -point - 1 : point)));
  const layers = [];
  if (normals)
    layers.push(
      record("LayerElementNormal", [I(0)], [
        record("MappingInformationType", [S(normals.mapping ?? "ByPolygonVertex")]),
        record("ReferenceInformationType", [S("Direct")]),
        record("Normals", [doubles(normals.values)]),
      ]),
    );
  if (uv)
    layers.push(
      record("LayerElementUV", [I(0)], [
        record("Name", [S("UVMap")]),
        record("MappingInformationType", [S(uv.mapping ?? "ByPolygonVertex")]),
        record("ReferenceInformationType", [S(uv.index ? "IndexToDirect" : "Direct")]),
        record("UV", [doubles(uv.values)]),
        ...(uv.index ? [record("UVIndex", [ints(uv.index)])] : []),
      ]),
    );
  if (materials !== undefined)
    layers.push(
      record("LayerElementMaterial", [I(0)], [
        record("MappingInformationType", [S(Array.isArray(materials) ? "ByPolygon" : "AllSame")]),
        record("ReferenceInformationType", [S("IndexToDirect")]),
        record("Materials", [ints(Array.isArray(materials) ? materials : [materials])]),
      ]),
    );
  return record("Geometry", [L(id), S(objectName(name, "Geometry")), S("Mesh")], [
    record("Vertices", [doubles(points.flat(), packed)]),
    record("PolygonVertexIndex", [ints(corners)]),
    ...layers,
  ]);
}
export const material = (id, name, colour = [0.8, 0.8, 0.8]) =>
  record("Material", [L(id), S(objectName(name, "Material")), S("")], [properties(P("DiffuseColor", "Color", ...colour))]);
export const texture = (id, name, file) =>
  record("Texture", [L(id), S(objectName(name, "Texture")), S("")], [record("FileName", [S(file)]), record("RelativeFilename", [S(file)])]);
/** A join: [child, parent] or [child, parent, property]. */
export const connections = (...joins) =>
  record(
    "Connections",
    [],
    joins.map(([child, parent, property]) => record("C", [S(property ? "OP" : "OO"), L(child), L(parent), ...(property ? [S(property)] : [])])),
  );
export const objects = (...list) => record("Objects", [], list);

/** A cube of side 2 about the origin, as Blender writes one: six quads, each wearing the whole picture. */
export const CUBE_POINTS = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
]; // prettier-ignore
/** Its faces, counter-clockwise seen from outside. */
export const CUBE_FACES = [
  [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3],
]; // prettier-ignore

// ── glTF ───────────────────────────────────────────────────────────────────
/**
 * A glTF made bit by bit: `accessor(values, type, componentType)` adds numbers and gives their accessor's
 * number, `image(bytes, mime)` a picture inside the file, `json` the rest; `glb()` the whole as a .glb,
 * `gltf(binName)` as a .gltf text that names its bytes in a file of their own.
 */
export function gltfBuilder() {
  const chunks = [];
  let length = 0;
  const json = { asset: { version: "2.0", generator: "smak test" }, buffers: [{}], bufferViews: [], accessors: [] };
  const view = (bytes) => {
    const padded = Buffer.concat([bytes, Buffer.alloc((4 - (bytes.length % 4)) % 4)]);
    json.bufferViews.push({ buffer: 0, byteOffset: length, byteLength: bytes.length });
    chunks.push(padded);
    length += padded.length;
    return json.bufferViews.length - 1;
  };
  const WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  return {
    json,
    accessor(values, type, componentType = 5126) {
      const array =
        componentType === 5126 ? Float32Array.from(values) : componentType === 5123 ? Uint16Array.from(values) : componentType === 5121 ? Uint8Array.from(values) : Uint32Array.from(values);
      const bufferView = view(Buffer.from(array.buffer));
      json.accessors.push({ bufferView, componentType, count: values.length / WIDTH[type], type });
      return json.accessors.length - 1;
    },
    image(bytes, mimeType) {
      json.images ??= [];
      json.images.push({ bufferView: view(Buffer.from(bytes)), mimeType });
      return json.images.length - 1;
    },
    bin: () => Buffer.concat(chunks),
    glb() {
      json.buffers[0] = { byteLength: length };
      const text = Buffer.from(JSON.stringify(json), "utf8");
      const jsonChunk = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 0x20)]);
      const bin = Buffer.concat(chunks);
      const head = Buffer.alloc(12);
      head.writeUInt32LE(0x46546c67, 0);
      head.writeUInt32LE(2, 4);
      head.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + bin.length, 8);
      const chunkHead = (size, kind) => {
        const b = Buffer.alloc(8);
        b.writeUInt32LE(size, 0);
        b.writeUInt32LE(kind, 4);
        return b;
      };
      return Buffer.concat([head, chunkHead(jsonChunk.length, 0x4e4f534a), jsonChunk, chunkHead(bin.length, 0x004e4942), bin]);
    },
    gltf(binName) {
      return JSON.stringify({ ...json, buffers: [{ byteLength: length, uri: binName }] });
    },
  };
}

// ── JPEG ───────────────────────────────────────────────────────────────────
/**
 * A baseline JPEG of blocks of one colour each (8x8 pixels, colour sampled at full): `colourOf(column, row)`
 * gives a block's [r, g, b]. Its own small tables: every DC size a code of four bits, the end of a block the
 * one AC code, every quantiser step 1, so that a block's colour is its DC alone.
 */
export function jpegOfBlocks(width, height, colourOf) {
  const segment = (marker, body) => {
    const head = Buffer.from([0xff, marker, 0, 0]);
    head.writeUInt16BE(body.length + 2, 2);
    return Buffer.concat([head, Buffer.from(body)]);
  };
  const frame = [8, height >> 8, height & 255, width >> 8, width & 255, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0];
  const dcCounts = new Array(16).fill(0);
  dcCounts[3] = 12;
  const acCounts = new Array(16).fill(0);
  acCounts[0] = 1;
  const bits = [];
  const put = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  const predictors = [0, 0, 0];
  for (let row = 0; row < Math.ceil(height / 8); row++)
    for (let column = 0; column < Math.ceil(width / 8); column++) {
      const [r, g, b] = colourOf(column, row);
      const ycc = [
        0.299 * r + 0.587 * g + 0.114 * b,
        128 - 0.168736 * r - 0.331264 * g + 0.5 * b,
        128 + 0.5 * r - 0.418688 * g - 0.081312 * b,
      ];
      ycc.forEach((value, c) => {
        const dc = Math.round((value - 128) * 8);
        const diff = dc - predictors[c];
        predictors[c] = dc;
        const size = diff ? Math.floor(Math.log2(Math.abs(diff))) + 1 : 0;
        put(size, 4);
        if (size) put(diff > 0 ? diff : diff + (1 << size) - 1, size);
        put(0, 1); // the end of the block
      });
    }
  while (bits.length % 8) bits.push(1);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8).join(""), 2);
    data.push(byte);
    if (byte === 0xff) data.push(0);
  }
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    segment(0xdb, [0, ...new Array(64).fill(1)]),
    segment(0xc0, frame),
    segment(0xc4, [0x00, ...dcCounts, ...Array.from({ length: 12 }, (_, i) => i)]),
    segment(0xc4, [0x10, ...acCounts, 0x00]),
    segment(0xda, [3, 1, 0x00, 2, 0x00, 3, 0x00, 0, 63, 0]),
    Buffer.from(data),
    Buffer.from([0xff, 0xd9]),
  ]);
}
