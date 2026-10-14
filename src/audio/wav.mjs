// A GoldSrc sound file: RIFF/WAVE PCM, mono, 8 or 16 bit, at 11025, 22050 or 44100 Hz, with one cue point
// when it loops (the engine loops from the cue's sample to the end). research/sound-generation.md, section 2,
// has where each rule comes from.
//
//   readWav(bytes)                          -> { format, channels, rate, bits, samples, x (Float32Array, -1..1), cue, chunks }
//   writeWav(x, { rate, bits, loop, seed }) -> bytes: mono, a cue at `loop` (a sample) when given

/** The rates both engines take as they are. */
export const RATES = [11025, 22050, 44100];

/** A file's samples and what it says of itself. A stereo file is read as the mean of its channels. */
export function readWav(bytes) {
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") throw new Error("not a WAVE file (RIFF/WAVE)");
  let at = 12;
  let fmt = null;
  let data = null;
  let cue = null;
  const chunks = [];
  while (at + 8 <= bytes.length) {
    const id = bytes.toString("ascii", at, at + 4);
    const length = bytes.readUInt32LE(at + 4);
    const body = bytes.subarray(at + 8, Math.min(bytes.length, at + 8 + length));
    chunks.push(id);
    if (id === "fmt ") fmt = { format: body.readUInt16LE(0), channels: body.readUInt16LE(2), rate: body.readUInt32LE(4), bits: body.readUInt16LE(14) };
    else if (id === "data") data = body;
    else if (id === "cue ") {
      const count = body.readUInt32LE(0);
      cue = Array.from({ length: count }, (_, i) => body.readUInt32LE(4 + i * 24 + 20));
    }
    at += 8 + length + (length & 1);
  }
  if (!fmt || !data) throw new Error("a WAVE file without its fmt or data chunk");
  const width = fmt.bits / 8;
  const samples = Math.floor(data.length / width / fmt.channels);
  const x = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let c = 0; c < fmt.channels; c++) {
      const o = (i * fmt.channels + c) * width;
      sum += width === 1 ? (data[o] - 128) / 128 : data.readInt16LE(o) / 32768;
    }
    x[i] = sum / fmt.channels;
  }
  return { ...fmt, samples, x, cue, chunks };
}

/**
 * The bytes of a mono PCM file of the samples `x` (-1..1, clamped). `bits` 16 (unless told) or 8, with a
 * triangular dither of one step when 8 (seeded: the same samples give the same bytes); `loop`: the sample
 * the engine loops back to, written as the one cue point, and no `ltxt` length (which can stop GoldSrc
 * looping).
 */
export function writeWav(x, { rate = 22050, bits = 16, loop = null, seed = 1 } = {}) {
  if (!RATES.includes(rate)) throw new Error(`writeWav: a rate of ${RATES.join(", ")} Hz, not ${rate}`);
  if (bits !== 8 && bits !== 16) throw new Error(`writeWav: 8 or 16 bits, not ${bits}`);
  if (loop !== null && !(loop >= 0 && loop < x.length)) throw new Error(`writeWav: the loop's start (${loop}) is not a sample of the sound (0 to ${x.length - 1})`);
  const width = bits / 8;
  const data = Buffer.alloc(x.length * width + ((x.length * width) & 1));
  let state = seed >>> 0 || 1;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < x.length; i++) {
    const v = Math.max(-1, Math.min(1, x[i]));
    if (width === 1) data[i] = Math.max(0, Math.min(255, Math.round(v * 127 + 128 + (random() - random()) * 0.5)));
    else data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const chunk = (id, body, length = body.length) => {
    const head = Buffer.alloc(8);
    head.write(id, 0, "ascii");
    head.writeUInt32LE(length, 4);
    return Buffer.concat([head, body]);
  };
  const fmt = Buffer.alloc(16);
  fmt.writeUInt16LE(1, 0);
  fmt.writeUInt16LE(1, 2);
  fmt.writeUInt32LE(rate, 4);
  fmt.writeUInt32LE(rate * width, 8);
  fmt.writeUInt16LE(width, 12);
  fmt.writeUInt16LE(bits, 14);
  const parts = [chunk("fmt ", fmt), chunk("data", data, x.length * width)];
  if (loop !== null) {
    const cue = Buffer.alloc(28);
    cue.writeUInt32LE(1, 0);
    cue.writeUInt32LE(1, 4);
    cue.writeUInt32LE(loop, 8);
    cue.write("data", 12, "ascii");
    cue.writeUInt32LE(loop, 24);
    parts.push(chunk("cue ", cue));
  }
  const body = Buffer.concat([Buffer.from("WAVE", "ascii"), ...parts]);
  return chunk("RIFF", body);
}
