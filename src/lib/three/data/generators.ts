import { createSeededRandom } from "@/lib/random/seeded";

/**
 * Deterministic data generators for point/network scenes. Pure functions of (count, seed, params): identical on every
 * load, no assets, no Math.random. Output Float32Arrays are ready to become BufferAttributes.
 */
export interface PointData {
  a: Float32Array;
  b: Float32Array;
  seeds: Float32Array;
  layers: Float32Array;
}

export const makeSeeds = (count: number, seed: number): Float32Array => {
  const r = createSeededRandom(seed);
  return Float32Array.from({ length: count }, () => r());
};

/** Uniform random points in a box. */
export function boxCloud(count: number, seed: number, half: [number, number, number], centre: [number, number, number] = [0, 0, 0]): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    out[i * 3] = centre[0] + (r() * 2 - 1) * half[0];
    out[i * 3 + 1] = centre[1] + (r() * 2 - 1) * half[1];
    out[i * 3 + 2] = centre[2] + (r() * 2 - 1) * half[2];
  }
  return out;
}

/** Points in a spherical shell/volume. */
export function sphereCloud(count: number, seed: number, radius: number, thickness = 1, centre: [number, number, number] = [0, 0, 0]): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const u = r() * 2 - 1;
    const phi = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const rad = radius * (1 - thickness * r() * 0.999);
    out[i * 3] = centre[0] + Math.cos(phi) * s * rad;
    out[i * 3 + 1] = centre[1] + u * rad;
    out[i * 3 + 2] = centre[2] + Math.sin(phi) * s * rad;
  }
  return out;
}

/** Gaussian-ish clusters around given centres (token groups). */
export function clusterCloud(count: number, seed: number, centres: [number, number, number][], spread: number): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const c = centres[Math.floor(r() * centres.length)];
    for (let a = 0; a < 3; a += 1) out[i * 3 + a] = c[a] + (r() + r() + r() - 1.5) * spread;
  }
  return out;
}

/** Layered sine-wave sheets: "numbers become patterns". */
export function waveSheets(count: number, seed: number, size: number, layers: number, amp: number): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const x = (r() * 2 - 1) * size;
    const z = (r() * 2 - 1) * size;
    const layer = Math.floor(r() * layers);
    const k = 0.22 + layer * 0.05;
    out[i * 3] = x;
    out[i * 3 + 1] = (layer - (layers - 1) / 2) * 7 + Math.sin(x * k) * Math.cos(z * k) * amp;
    out[i * 3 + 2] = z;
  }
  return out;
}

/** Vertical sheets (layered nodes): points on N parallel planes along Z. */
export function layerSheets(count: number, seed: number, layers: number, w: number, h: number, spacing: number): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const layer = Math.floor(r() * layers);
    out[i * 3] = (r() * 2 - 1) * w;
    out[i * 3 + 1] = (r() * 2 - 1) * h;
    out[i * 3 + 2] = -layer * spacing;
  }
  return out;
}

/** Surface samples of a (p,q) torus knot: the "generated form". */
export function torusKnot(count: number, seed: number, radius: number, tube: number, p = 2, q = 3): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  const centre = (t: number): [number, number, number] => {
    const rr = radius * (0.6 + 0.3 * Math.cos(q * t));
    return [rr * Math.cos(p * t), radius * 0.6 * Math.sin(q * t), rr * Math.sin(p * t)];
  };
  for (let i = 0; i < count; i += 1) {
    const t = r() * Math.PI * 2;
    const c = centre(t);
    const c2 = centre(t + 0.01);
    const tan = [c2[0] - c[0], c2[1] - c[1], c2[2] - c[2]];
    const len = Math.hypot(tan[0], tan[1], tan[2]) || 1;
    tan[0] /= len; tan[1] /= len; tan[2] /= len;
    // any vector not parallel to tan -> frame
    const ref = Math.abs(tan[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const n = [tan[1] * ref[2] - tan[2] * ref[1], tan[2] * ref[0] - tan[0] * ref[2], tan[0] * ref[1] - tan[1] * ref[0]];
    const nl = Math.hypot(n[0], n[1], n[2]) || 1;
    n[0] /= nl; n[1] /= nl; n[2] /= nl;
    const bn = [tan[1] * n[2] - tan[2] * n[1], tan[2] * n[0] - tan[0] * n[2], tan[0] * n[1] - tan[1] * n[0]];
    const a = r() * Math.PI * 2;
    const tr = tube * (0.8 + 0.2 * Math.sin(3 * t));
    for (let k = 0; k < 3; k += 1) out[i * 3 + k] = c[k] + (n[k] * Math.cos(a) + bn[k] * Math.sin(a)) * tr;
  }
  return out;
}

/** Procedural "world" for point-cloud perception: rolling terrain + simple objects (columns, blocks). */
export function perceivedWorld(count: number, seed: number, size: number): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  const height = (x: number, z: number) => Math.sin(x * 0.11) * 2.4 + Math.cos(z * 0.09 + x * 0.04) * 2 + Math.sin((x + z) * 0.23) * 0.7;
  const objects = Array.from({ length: 14 }, () => ({ x: (r() * 2 - 1) * size * 0.8, z: -r() * size * 1.6, w: 1.5 + r() * 3, h: 3 + r() * 9 }));
  for (let i = 0; i < count; i += 1) {
    if (r() < 0.72) {
      const x = (r() * 2 - 1) * size;
      const z = -r() * size * 1.8;
      out[i * 3] = x;
      out[i * 3 + 1] = height(x, z);
      out[i * 3 + 2] = z;
    } else {
      const o = objects[Math.floor(r() * objects.length)];
      const face = Math.floor(r() * 4);
      const u = (r() * 2 - 1) * o.w;
      const y = r() * o.h;
      const x = face === 0 ? -o.w : face === 1 ? o.w : u;
      const z = face === 2 ? -o.w : face === 3 ? o.w : u;
      out[i * 3] = o.x + x;
      out[i * 3 + 1] = height(o.x, o.z) + y;
      out[i * 3 + 2] = o.z + z;
    }
  }
  return out;
}

export function zeroLayers(count: number): Float32Array {
  return new Float32Array(count);
}

export function radialLayers(positions: Float32Array, maxR: number): Float32Array {
  const n = positions.length / 3;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) out[i] = Math.min(1, Math.hypot(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]) / maxR);
  return out;
}

/** Graph description for NetworkField. */
export interface GraphData {
  nodes: Float32Array;
  nodeLayers: Float32Array;
  edges: [number, number][];
  /** per-edge highlight (1) or not (0) */
  edgeHi?: Float32Array;
}

/** Fully connected layered network (MLP-like): layer sizes along +X. */
export function layeredGraph(sizes: number[], spacingX: number, spacingY: number, seed: number): GraphData {
  const r = createSeededRandom(seed);
  const total = sizes.reduce((a, b) => a + b, 0);
  const nodes = new Float32Array(total * 3);
  const nodeLayers = new Float32Array(total);
  const index: number[][] = [];
  let n = 0;
  sizes.forEach((size, l) => {
    index[l] = [];
    for (let k = 0; k < size; k += 1) {
      nodes[n * 3] = (l - (sizes.length - 1) / 2) * spacingX;
      nodes[n * 3 + 1] = (k - (size - 1) / 2) * spacingY + (r() - 0.5) * 0.4;
      nodes[n * 3 + 2] = (r() - 0.5) * spacingY * 1.2;
      nodeLayers[n] = l / (sizes.length - 1);
      index[l].push(n);
      n += 1;
    }
  });
  const edges: [number, number][] = [];
  for (let l = 0; l < sizes.length - 1; l += 1) for (const i of index[l]) for (const j of index[l + 1]) edges.push([i, j]);
  return { nodes, nodeLayers, edges };
}

/** Binary-ish decision tree growing along +X with one highlighted root-to-leaf path (reasoning). */
export function decisionTree(depth: number, spacingX: number, spreadY: number, seed: number): GraphData {
  const r = createSeededRandom(seed);
  const pos: number[] = [0, 0, 0];
  const layers: number[] = [0];
  const edges: [number, number][] = [];
  const hi: number[] = [];
  let frontier: { id: number; y: number; onPath: boolean }[] = [{ id: 0, y: 0, onPath: true }];
  for (let d = 1; d <= depth; d += 1) {
    const next: typeof frontier = [];
    const pathChild = Math.floor(r() * 2);
    for (const f of frontier) {
      const kids = f.onPath || r() > 0.35 ? 2 : 1;
      for (let k = 0; k < kids; k += 1) {
        const id = pos.length / 3;
        const y = f.y + (k === 0 ? -1 : 1) * (spreadY / d) * (0.6 + r() * 0.6);
        pos.push(d * spacingX, y, (r() - 0.5) * spreadY * 0.5);
        layers.push(d / depth);
        const onPath = f.onPath && k === pathChild;
        edges.push([f.id, id]);
        hi.push(onPath ? 1 : 0);
        next.push({ id, y, onPath });
      }
    }
    frontier = next;
  }
  return { nodes: Float32Array.from(pos), nodeLayers: Float32Array.from(layers), edges, edgeHi: Float32Array.from(hi) };
}

/** Large organic network: nodes in a noisy sphere; each links to its nearest of a few seeded candidates. */
export function organicGraph(nodeCount: number, edgesPerNode: number, radius: number, seed: number): GraphData {
  const r = createSeededRandom(seed);
  const nodes = sphereCloud(nodeCount, seed + 1, radius, 0.85);
  const nodeLayers = radialLayers(nodes, radius);
  const edges: [number, number][] = [];
  for (let i = 0; i < nodeCount; i += 1) {
    for (let e = 0; e < edgesPerNode; e += 1) {
      let best = -1;
      let bestD = Infinity;
      for (let c = 0; c < 10; c += 1) {
        const j = Math.floor(r() * nodeCount);
        if (j === i) continue;
        const d = (nodes[i * 3] - nodes[j * 3]) ** 2 + (nodes[i * 3 + 1] - nodes[j * 3 + 1]) ** 2 + (nodes[i * 3 + 2] - nodes[j * 3 + 2]) ** 2;
        if (d < bestD) {
          bestD = d;
          best = j;
        }
      }
      if (best >= 0) edges.push([i, best]);
    }
  }
  return { nodes, nodeLayers, edges };
}

/** Samples 2D text into world-space points (browser only: uses a canvas, no font download, system sans-serif). */
export function sampleText(text: string, count: number, seed: number, width: number, depthJitter: number): Float32Array {
  const r = createSeededRandom(seed);
  const out = new Float32Array(count * 3);
  if (typeof document === "undefined") return out;
  const canvas = document.createElement("canvas");
  const W = 1024;
  const H = 256;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return out;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.font = "700 190px system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 8);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4] > 128) pts.push(x, y);
  if (pts.length === 0) return out;
  const total = pts.length / 2;
  for (let i = 0; i < count; i += 1) {
    const k = Math.floor(r() * total) * 2;
    out[i * 3] = ((pts[k] / W) * 2 - 1) * width;
    out[i * 3 + 1] = -((pts[k + 1] / H) * 2 - 1) * width * (H / W);
    out[i * 3 + 2] = (r() - 0.5) * depthJitter;
  }
  return out;
}
