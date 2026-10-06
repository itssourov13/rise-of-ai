import { Color, ShaderMaterial } from "three";

/**
 * Signal-trace shader for INSTANCED circuit traces. Each instance carries `aDist` (0..1: path distance from the
 * chip, an InstancedBufferAttribute on the geometry). uLevel = steady glow, uFront = position of a travelling
 * signal pulse along aDist (0..~1.3).
 * Colour management: same assumptions as energy-core.ts (linear uniform colors, linear HDR output, three's
 * tonemapping/colorspace chunks, no manual gamma). GLSL / WebGL path only. NOT RUNTIME VERIFIED.
 */
export function createSignalMaterial(coolHex: string, hotHex: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uLevel: { value: 0 },
      uFront: { value: 0 },
      uColorCool: { value: new Color(coolHex) },
      uColorHot: { value: new Color(hotHex) },
    },
    vertexShader: /* glsl */ `
      attribute float aDist;
      varying float vDist;
      void main() {
        vDist = aDist;
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uLevel;
      uniform float uFront;
      uniform vec3 uColorCool;
      uniform vec3 uColorHot;
      varying float vDist;
      void main() {
        float band = smoothstep(0.16, 0.0, abs(vDist - uFront));
        float reached = smoothstep(uFront + 0.02, uFront - 0.1, vDist);
        float intensity = uLevel * (0.12 + 0.5 * reached) + band * 2.4 * uLevel;
        vec3 color = mix(uColorCool, uColorHot, clamp(band, 0.0, 1.0));
        gl_FragColor = vec4(color * intensity, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
