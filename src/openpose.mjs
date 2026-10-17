// A model's skeleton drawn as OpenPose draws one: the 18 points of a body (nose, neck, shoulders, elbows, wrists,
// hips, knees, ankles, eyes, ears) and the limbs between them, each in OpenPose's own colour, on black. What a
// pose ControlNet takes to hold a drawing to a stance: SMAK knows the bones, so no pose detector reads a picture.
// The colours tell the right side from the left, so the figure is drawn facing the way the skeleton faces (drawn
// over a grey figure alone, two takes in four came out from behind: research/generated-characters.md).
//
//   openPosePicture(src, { seq, frame, view, back, width, height }) -> { width, height, rgba, points } | null
// The view is render's (front unless told) and the picture lies over render's of the same options, point for
// point. `back`: the skeleton seen from behind (the view turned half round), drawn as OpenPose draws a back: no
// nose and no eyes, the ears kept, the subject's right on the picture's right. Null for a skeleton that is not a
// biped's (no Biped neck, arms and legs by name).
import { readMdl, apply34 } from "./mdl.mjs";
import { boneIn } from "./biped.mjs";
import { placeIn } from "./render.mjs";

/** OpenPose's 18 colours, one a point and one a limb, in its order (controlnet_aux's draw_bodypose). */
export const OPENPOSE_COLOURS = [
  [255, 0, 0], [255, 85, 0], [255, 170, 0], [255, 255, 0], [170, 255, 0], [85, 255, 0], [0, 255, 0], [0, 255, 85], [0, 255, 170],
  [0, 255, 255], [0, 170, 255], [0, 85, 255], [0, 0, 255], [85, 0, 255], [170, 0, 255], [255, 0, 255], [255, 0, 170], [255, 0, 85],
];
/** Its limbs, by point (0 nose, 1 neck, 2-4 right arm, 5-7 left arm, 8-10 right leg, 11-13 left leg, 14-17 eyes and ears). */
export const OPENPOSE_LIMBS = [[1, 2], [1, 5], [2, 3], [3, 4], [5, 6], [6, 7], [1, 8], [8, 9], [9, 10], [1, 11], [11, 12], [12, 13], [1, 0], [0, 14], [14, 16], [0, 15], [15, 17]];
/** The Biped bones of OpenPose's points 1 to 13, the subject's own right and left. */
const BONES = ["Bip01 Neck", "Bip01 R UpperArm", "Bip01 R Forearm", "Bip01 R Hand", "Bip01 L UpperArm", "Bip01 L Forearm", "Bip01 L Hand", "Bip01 R Thigh", "Bip01 R Calf", "Bip01 R Foot", "Bip01 L Thigh", "Bip01 L Calf", "Bip01 L Foot"];

export function openPosePicture(src, { seq = 0, frame = 0, view = "front", back = false, width = 512, height = 512 } = {}) {
  const names = readMdl(src).bones;
  const found = BONES.map((name) => boneIn(name, names));
  const head = boneIn("Bip01 Head", names);
  if (found.some((name) => !name) || !head) return null;
  const { pose, at } = placeIn(src, { seq, frame, view, width, height, ...(back ? { yaw: 180 } : {}) });
  const joint = (name) => apply34(pose[names.indexOf(name)], [0, 0, 0]);
  const joints = found.map(joint);
  const [rShoulder, lShoulder] = [joints[1], joints[4]];
  // OpenPose's neck is between the shoulders, not where a Biped's neck bone starts
  joints[0] = rShoulder.map((v, k) => (v + lShoulder[k]) / 2);
  const headAt = joint(head);
  // the face from the head's joint (at the jaw) and half the shoulders' span, as Gordon's measures: the nose 0.55
  // of it above the joint, the eyes 0.68 and 0.2 to each side, the ears 0.6 and 0.42 to each side (the subject's
  // right is toward its right shoulder)
  const across = [0, 1, 2].map((k) => (lShoulder[k] - rShoulder[k]) / 2);
  const half = Math.hypot(...across);
  const face = (up, side) => headAt.map((v, k) => v + across[k] * side + (k === 2 ? half * up : 0));
  const model = [face(0.55, 0), ...joints, face(0.68, -0.2), face(0.68, 0.2), face(0.6, -0.42), face(0.6, 0.42)];
  const points = model.map(at);
  // drawn as controlnet_aux draws it, scaled to the picture: limbs as ellipses at 0.6, then the points
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255;
  const stick = Math.max(2, Math.round((4 * Math.min(width, height)) / 512));
  const blend = (x, y, colour, alpha) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    for (let k = 0; k < 3; k++) rgba[i + k] = Math.round(rgba[i + k] * (1 - alpha) + colour[k] * alpha);
  };
  // from behind the face is not seen: its nose and eyes are left out, and every limb that reaches them
  const unseen = back ? new Set([0, 14, 15]) : new Set();
  OPENPOSE_LIMBS.forEach(([a, b], n) => {
    if (unseen.has(a) || unseen.has(b)) return;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const length = Math.hypot(bx - ax, by - ay);
    if (!length) return;
    const [ux, uy] = [(bx - ax) / length, (by - ay) / length];
    const [cx, cy] = [(ax + bx) / 2, (ay + by) / 2];
    const half = length / 2;
    const x0 = Math.floor(Math.min(ax, bx) - stick), x1 = Math.ceil(Math.max(ax, bx) + stick);
    const y0 = Math.floor(Math.min(ay, by) - stick), y1 = Math.ceil(Math.max(ay, by) + stick);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const along = (x - cx) * ux + (y - cy) * uy;
        const off = -(x - cx) * uy + (y - cy) * ux;
        if ((along / half) ** 2 + (off / stick) ** 2 <= 1) blend(x, y, OPENPOSE_COLOURS[n], 0.6);
      }
  });
  points.forEach(([px, py], n) => {
    if (unseen.has(n)) return;
    for (let y = Math.floor(py - stick); y <= Math.ceil(py + stick); y++)
      for (let x = Math.floor(px - stick); x <= Math.ceil(px + stick); x++) if (Math.hypot(x - px, y - py) <= stick) blend(x, y, OPENPOSE_COLOURS[n], 1);
  });
  return { width, height, rgba, points };
}
