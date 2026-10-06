import { DataTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RGBAFormat, RepeatWrapping, UnsignedByteType } from "three";
import { createSeededRandom } from "@/lib/random/seeded";

/** Procedural brushed-metal roughness variation (green channel), seeded -> identical every load. NoColorSpace (data). */
export function createBrushedRoughness(repeatX: number, repeatY: number, seed: number): DataTexture {
  const size = 128;
  const rand = createSeededRandom(seed);
  const rows = Array.from({ length: size }, () => rand());
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const v = 0.55 + 0.2 * (rows[y] - 0.5) * 2 + 0.06 * (rand() - 0.5) * 2;
      const g = Math.round(Math.min(1, Math.max(0.2, v)) * 255);
      const i = (y * size + x) * 4;
      data[i] = 255;
      data[i + 1] = g;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  texture.colorSpace = NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

