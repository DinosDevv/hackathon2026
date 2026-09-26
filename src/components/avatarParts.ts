// Helper's avatar as plain shapes: a cheeky teenage grandson in a beanie and a hoodie.
// Pure data so the app (HelperFace) and a preview script can draw exactly the same thing.

export type Mood = "happy" | "calm" | "concerned";

export type Part = {
  /** "eye" parts blink. */
  id?: "eye";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radii: top-left, top-right, bottom-right, bottom-left. */
  r?: [number, number, number, number];
  fill: string;
  /** Degrees, around the part's centre. */
  rotate?: number;
  opacity?: number;
};

export const AVATAR_COLORS = {
  skin: "#F5CBA7",
  ear: "#EDB48A",
  hair: "#3B2A20",
  beanie: "#D2364F",
  beanieBand: "#A8263C",
  rib: "#BE2E46",
  pompom: "#F8D5DB",
  hoodie: "#F0B43C",
  collar: "#D1901B",
  strings: "#FFFFFF",
  eye: "#2A2A2A",
  mouth: "#7A2E2E",
  teeth: "#FFFFFF",
  cheek: "#F29C8A",
};

const round = (r: number): [number, number, number, number] => [r, r, r, r];

/** Every shape in a 1×1 box, back to front. Multiply by the size to draw. */
export function avatarParts(mood: Mood): Part[] {
  const c = AVATAR_COLORS;
  const parts: Part[] = [
    // Hoodie body and the hood lying behind the neck, with drawstrings.
    { x: 0.08, y: 0.74, w: 0.84, h: 0.4, r: [0.3, 0.3, 0, 0], fill: c.hoodie },
    { x: 0.31, y: 0.69, w: 0.38, h: 0.12, r: round(0.06), fill: c.collar },
    { x: 0.42, y: 0.63, w: 0.16, h: 0.12, r: [0, 0, 0.06, 0.06], fill: c.skin },
    { x: 0.41, y: 0.8, w: 0.025, h: 0.13, r: round(0.012), fill: c.strings },
    { x: 0.565, y: 0.8, w: 0.025, h: 0.13, r: round(0.012), fill: c.strings },
    // Ears, head.
    { x: 0.2, y: 0.42, w: 0.1, h: 0.13, r: round(0.05), fill: c.ear },
    { x: 0.7, y: 0.42, w: 0.1, h: 0.13, r: round(0.05), fill: c.ear },
    { x: 0.24, y: 0.22, w: 0.52, h: 0.5, r: [0.26, 0.26, 0.24, 0.24], fill: c.skin },
    // Hair peeking out under the beanie, with a cheeky tuft.
    { x: 0.26, y: 0.27, w: 0.48, h: 0.1, r: [0.02, 0.02, 0.05, 0.05], fill: c.hair },
    { x: 0.6, y: 0.32, w: 0.09, h: 0.08, r: [0, 0.04, 0.04, 0.04], fill: c.hair, rotate: 20 },
    // A slouchy knit beanie, tipped to one side: dome, ribbed fold, pompom.
    { x: 0.22, y: 0.04, w: 0.56, h: 0.3, r: [0.28, 0.26, 0.04, 0.04], fill: c.beanie, rotate: -9 },
    { x: 0.2, y: 0.25, w: 0.6, h: 0.1, r: round(0.035), fill: c.beanieBand, rotate: -9 },
    ...[0.27, 0.35, 0.43, 0.51, 0.59, 0.67].map(
      (x): Part => ({ x, y: 0.27 - (x - 0.5) * 0.16, w: 0.03, h: 0.06, r: round(0.015), fill: c.rib, rotate: -9 }),
    ),
    { x: 0.4, y: -0.015, w: 0.12, h: 0.12, r: round(0.06), fill: c.pompom },
    // Cheeks.
    { x: 0.29, y: 0.53, w: 0.1, h: 0.055, r: round(0.03), fill: c.cheek, opacity: 0.75 },
    { x: 0.61, y: 0.53, w: 0.1, h: 0.055, r: round(0.03), fill: c.cheek, opacity: 0.75 },
    // Eyes.
    { id: "eye", x: 0.365, y: 0.435, w: 0.065, h: 0.085, r: round(0.033), fill: c.eye },
    { id: "eye", x: 0.57, y: 0.435, w: 0.065, h: 0.085, r: round(0.033), fill: c.eye },
  ];

  // Eyebrows and mouth carry the mood. Happy is cheeky: one eyebrow up and a lopsided grin.
  if (mood === "happy") {
    parts.push(
      { x: 0.345, y: 0.395, w: 0.1, h: 0.024, r: round(0.012), fill: c.hair, rotate: -6 },
      { x: 0.555, y: 0.375, w: 0.1, h: 0.024, r: round(0.012), fill: c.hair, rotate: -14 },
      { x: 0.415, y: 0.575, w: 0.19, h: 0.085, r: [0.01, 0.01, 0.095, 0.095], fill: c.mouth, rotate: -6 },
      { x: 0.435, y: 0.575, w: 0.15, h: 0.025, r: [0.005, 0.005, 0.012, 0.012], fill: c.teeth, rotate: -6 },
    );
  } else if (mood === "calm") {
    parts.push(
      { x: 0.345, y: 0.39, w: 0.1, h: 0.024, r: round(0.012), fill: c.hair },
      { x: 0.555, y: 0.39, w: 0.1, h: 0.024, r: round(0.012), fill: c.hair },
      { x: 0.44, y: 0.585, w: 0.12, h: 0.045, r: [0.005, 0.005, 0.06, 0.06], fill: c.mouth },
    );
  } else {
    // Concerned: brows tilted up in the middle, small straight mouth.
    parts.push(
      { x: 0.345, y: 0.39, w: 0.1, h: 0.024, r: round(0.012), fill: c.hair, rotate: 14 },
      { x: 0.555, y: 0.39, w: 0.1, h: 0.024, r: round(0.012), fill: c.hair, rotate: -14 },
      { x: 0.45, y: 0.6, w: 0.1, h: 0.028, r: round(0.014), fill: c.mouth },
    );
  }
  return parts;
}
