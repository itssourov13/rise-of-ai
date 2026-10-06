import { Material, Mesh, Texture, type BufferGeometry, type InstancedMesh, type Object3D, type WebGLRenderTarget } from "three";

/**
 * Explicit disposal helpers. OWNERSHIP RULE: only dispose what you own.
 *   global/shared resources  -> shared resource manager (asset cache)
 *   scene-owned resources    -> that scene's lifecycle
 *   transition resources     -> the transition's lifecycle
 *   render targets           -> the render pipeline that created them
 * Never dispose a resource another active scene may still use. Textures are NOT disposed by default
 * (they are usually owned by the asset cache); opt in only for textures you created.
 */
export interface DisposeOptions {
  geometries?: boolean;
  materials?: boolean;
  textures?: boolean;
}

export function disposeMaterial(material: Material, disposeTextures = false): void {
  if (disposeTextures) {
    for (const value of Object.values(material as unknown as Record<string, unknown>)) {
      if (value instanceof Texture) value.dispose();
    }
  }
  material.dispose();
}

export function disposeObject3D(root: Object3D, options: DisposeOptions = {}): void {
  const { geometries = true, materials = true, textures = false } = options;
  root.traverse((object) => {
    if ((object as InstancedMesh).isInstancedMesh) (object as InstancedMesh).dispose();
    if (!(object instanceof Mesh)) return;
    if (geometries) (object.geometry as BufferGeometry).dispose();
    if (materials) {
      const list: Material[] = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((m) => disposeMaterial(m, textures));
    }
  });
}

export const disposeRenderTarget = (target: WebGLRenderTarget): void => target.dispose();
