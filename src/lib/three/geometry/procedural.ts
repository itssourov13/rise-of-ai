import { BufferGeometry, ExtrudeGeometry, LatheGeometry, Shape, Vector2 } from "three";

/**
 * Procedural geometry helpers. Bevels exist to catch highlights (edge definition), not decoration.
 */

/** Box with a real bevel (ExtrudeGeometry), centred on the origin. Total size is exactly w x h x d. Flat-shaded faces. */
export function createBeveledBox(w: number, h: number, d: number, bevel = 0.06): BufferGeometry {
  const b = Math.min(bevel, w / 2.2, h / 2.2, d / 2.2);
  const bw = w - b * 2;
  const bh = h - b * 2;
  const depth = d - b * 2;
  const shape = new Shape();
  shape.moveTo(-bw / 2, -bh / 2);
  shape.lineTo(bw / 2, -bh / 2);
  shape.lineTo(bw / 2, bh / 2);
  shape.lineTo(-bw / 2, bh / 2);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: 0,
    bevelSegments: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/**
 * Chamfered ring (annulus with rectangular, chamfered profile) via LatheGeometry about the Y axis.
 * Profile is wound so the outer wall rises (outward-facing normals). Chamfer vertices are shared, so the
 * chamfer shades as a soft bevel.
 */
export function createRing(innerR: number, outerR: number, height: number, chamfer: number, segments: number): BufferGeometry {
  const c = Math.max(0.001, Math.min(chamfer, height / 2 - 0.001, (outerR - innerR) / 2 - 0.001));
  const h = height / 2;
  const points = [
    new Vector2(innerR + c, -h),
    new Vector2(outerR - c, -h),
    new Vector2(outerR, -h + c),
    new Vector2(outerR, h - c),
    new Vector2(outerR - c, h),
    new Vector2(innerR + c, h),
    new Vector2(innerR, h - c),
    new Vector2(innerR, -h + c),
    new Vector2(innerR + c, -h),
  ];
  return new LatheGeometry(points, Math.max(8, Math.round(segments)));
}
