// What a sound is, in numbers an agent can read without ears: its length, level, how punchy it is, how fast it
// starts and dies, how bright and how noisy, where its power is, how many hits it has. And the hard checks a
// file the engine plays must pass. research/sound-generation.md, section 5.
//
//   features({ x, rate })            -> { length, peak, rms, crest, dc, clipped, lead, tail, attack, peakAt,
//                                         t20, t40, centroid, rolloff, flatness, bands, onsets }
//   checks(wav, { loop, oneShot })   -> { faults, warnings }
//   spectrum(x, rate)                -> frames of power by bin (for the picture)

const db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);
const round = (v, k = 1) => Math.round(v * 10 ** k) / 10 ** k;

/** In-place radix-2 FFT of `re`, `im` (their length a power of two). */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let i = 0; i < n; i += size) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < size / 2; k++) {
        const a = i + k;
        const b = a + size / 2;
        const vr = re[b] * cr - im[b] * ci;
        const vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr;
        im[b] = im[a] - vi;
        re[a] += vr;
        im[a] += vi;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

/** Power by bin, frame by frame: 1024-point Hann frames at half overlap. Returns { frames: [Float64Array], size, hop }. */
export function spectrum(x, rate, size = 1024) {
  const frames = [];
  const hop = size / 2;
  for (let s = 0; s === 0 || s + size <= x.length; s += hop) {
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < size; i++) re[i] = (x[s + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)));
    fft(re, im);
    const power = new Float64Array(size / 2);
    for (let k = 0; k < size / 2; k++) power[k] = re[k] * re[k] + im[k] * im[k];
    frames.push(power);
    if (s + size >= x.length) break;
  }
  return { frames, size, hop, rate };
}

/** The bands a sound's power is told in, in Hz. */
export const BANDS = [["<150", 0, 150], ["150-600", 150, 600], ["600-2k", 600, 2000], ["2k-5k", 2000, 5000], [">5k", 5000, Infinity]];

/** A sound's features (section 5.2 of the research): levels in dBFS, times in seconds, bands in % of power. */
export function features({ x, rate }) {
  const n = x.length;
  let peak = 0;
  let sum = 0;
  let squares = 0;
  let clipped = 0;
  for (const v of x) {
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sum += v;
    squares += v * v;
    if (a >= 0.999) clipped++;
  }
  // the envelope: RMS of 5 ms windows
  const hop = Math.max(1, Math.round(rate * 0.005));
  const envelope = [];
  for (let i = 0; i < n; i += hop) {
    let s = 0;
    const end = Math.min(n, i + hop);
    for (let j = i; j < end; j++) s += x[j] * x[j];
    envelope.push(Math.sqrt(s / (end - i)));
  }
  const top = Math.max(...envelope, 1e-12);
  const topAt = envelope.indexOf(top);
  const floor = top * 0.001;
  const first = Math.max(0, envelope.findIndex((e) => e > floor));
  let last = envelope.length - 1;
  while (last > 0 && envelope[last] <= floor) last--;
  const rise10 = envelope.findIndex((e) => e >= top * 0.1);
  const rise90 = envelope.findIndex((e) => e >= top * 0.9);
  const fallTo = (dB) => {
    const under = top * 10 ** (-dB / 20);
    for (let i = envelope.length - 1; i >= topAt; i--) if (envelope[i] > under) return ((i + 1 - topAt) * hop) / rate;
    return 0;
  };
  // the spectrum over the whole sound
  const { frames, size } = spectrum(x, rate);
  const bins = new Float64Array(size / 2);
  for (const frame of frames) for (let k = 0; k < bins.length; k++) bins[k] += frame[k];
  const hz = (k) => (k * rate) / size;
  let total = 0;
  let weighted = 0;
  let logs = 0;
  for (let k = 1; k < bins.length; k++) {
    total += bins[k];
    weighted += hz(k) * bins[k];
    logs += Math.log(bins[k] + 1e-20);
  }
  total ||= 1e-20;
  const flatness = Math.exp(logs / (bins.length - 1)) / (total / (bins.length - 1));
  let rolloff = 0;
  for (let k = 1, acc = 0; k < bins.length; k++) {
    acc += bins[k];
    if (acc >= 0.85 * total) {
      rolloff = hz(k);
      break;
    }
  }
  const bands = Object.fromEntries(
    BANDS.map(([name, lo, hi]) => {
      let e = 0;
      for (let k = 1; k < bins.length; k++) if (hz(k) >= lo && hz(k) < hi) e += bins[k];
      return [name, round((100 * e) / total)];
    }),
  );
  // onsets: peaks of spectral flux over its mean and two deviations, 50 ms apart at least
  const flux = [];
  for (let i = 1; i < frames.length; i++) {
    let f = 0;
    for (let k = 0; k < bins.length; k++) f += Math.max(0, Math.sqrt(frames[i][k]) - Math.sqrt(frames[i - 1][k]));
    flux.push(f);
  }
  const mean = flux.reduce((a, b) => a + b, 0) / (flux.length || 1);
  const deviation = Math.sqrt(flux.reduce((a, b) => a + (b - mean) ** 2, 0) / (flux.length || 1));
  const apart = Math.max(1, Math.round((0.05 * rate) / (size / 2)));
  let onsets = 0;
  let lastOnset = -Infinity;
  for (let i = 1; i < flux.length - 1; i++)
    if (flux[i] > mean + 2 * deviation && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1] && i - lastOnset >= apart) {
      onsets++;
      lastOnset = i;
    }
  const rms = Math.sqrt(squares / (n || 1));
  return {
    length: round(n / rate, 3),
    peak: round(db(peak)),
    rms: round(db(rms)),
    crest: round(db(peak) - db(rms)),
    dc: round(sum / (n || 1), 4),
    clipped,
    lead: round((first * hop) / rate, 3),
    tail: round(((envelope.length - 1 - last) * hop) / rate, 3),
    attack: round(((rise90 - rise10) * hop) / rate, 3),
    peakAt: round((topAt * hop) / rate, 3),
    t20: round(fallTo(20), 3),
    t40: round(fallTo(40), 3),
    centroid: Math.round(weighted / total),
    rolloff: Math.round(rolloff),
    flatness: round(flatness, 3),
    bands,
    onsets,
  };
}

/**
 * The hard checks of a file the engine is to play (section 5.1): `wav` as `readWav` gives it. `loop`: it is
 * to loop (a cue is wanted, and a smooth seam); `oneShot`: it is played once (no silence before it starts,
 * little after, faded at its end). Faults fail a build; warnings are told.
 */
export function checks(wav, { loop = false, oneShot = !loop } = {}) {
  const faults = [];
  const warnings = [];
  if (wav.format !== 1) faults.push(`not PCM (format ${wav.format})`);
  if (wav.channels !== 1) faults.push(`${wav.channels} channels: GoldSrc plays mono only`);
  if (wav.bits !== 8 && wav.bits !== 16) faults.push(`${wav.bits} bits: 8 or 16`);
  if (![11025, 22050, 44100].includes(wav.rate)) faults.push(`${wav.rate} Hz: 11025, 22050 or 44100`);
  const f = features(wav);
  let run = 0;
  let longest = 0;
  for (const v of wav.x) {
    run = Math.abs(v) >= 0.999 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  if (longest >= 3) faults.push(`clipped: ${longest} samples in a row at full scale`);
  if (Math.abs(f.dc) > 0.01) faults.push(`a DC offset of ${f.dc} of full scale: a high-pass under 30 Hz takes it out`);
  if (f.peak < -12) warnings.push(`its peak is ${f.peak} dBFS: quiet, and the game's volume only turns down`);
  if (oneShot) {
    if (f.lead > 0.02) faults.push(`${Math.round(f.lead * 1000)} ms of silence before it starts: it plays late`);
    if (f.tail > 0.05) warnings.push(`${Math.round(f.tail * 1000)} ms of silence at its end: memory for nothing`);
    const fade = Math.round(wav.rate * 0.005);
    const end = Math.max(...Array.from(wav.x.subarray(Math.max(0, wav.x.length - 4)), Math.abs));
    if (wav.x.length > fade && end > 0.02) faults.push(`its last samples are at ${end.toFixed(2)} of full scale: it ends in a click; fade its end`);
  }
  if (loop) {
    if (!wav.cue?.length) faults.push("it is to loop and has no cue point: the engine plays it once");
    else {
      const start = wav.cue[0];
      if (!(start < wav.x.length)) faults.push(`its cue point (${start}) is past its end`);
      let steps = 0;
      for (let i = 1; i < wav.x.length; i++) steps += Math.abs(wav.x[i] - wav.x[i - 1]);
      const meanStep = steps / Math.max(1, wav.x.length - 1);
      const seam = Math.abs(wav.x[start] - wav.x[wav.x.length - 1]);
      if (seam > 2.5 * meanStep + 1e-4) faults.push(`its loop jumps by ${seam.toFixed(3)} at the seam, ${(seam / meanStep).toFixed(1)} times its mean step: a click every time round`);
    }
  } else if (wav.cue?.length) warnings.push("it has a cue point and is not to loop: the engine will loop it");
  return { faults, warnings, features: f };
}
