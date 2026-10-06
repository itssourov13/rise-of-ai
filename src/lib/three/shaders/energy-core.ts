import { Color, ShaderMaterial } from "three";

/**
 * Hero energy-core shader (first production ShaderMaterial). GLSL / WebGL path only (not WebGPU-portable).
 *
 * Colour-management assumptions (see lib/three/renderer/color-policy.ts):
 *  - Uniform colors are THREE.Color instances -> already in the LINEAR working space (hex strings are converted).
 *  - The fragment writes LINEAR radiance (values may exceed 1: HDR, feeds bloom).
 *  - It ends with three's <tonemapping_fragment> and <colorspace_fragment> chunks, so output conversion follows
 *    whichever target it renders into: to the canvas (renderer tone mapping + sRGB) or into the post-processing
 *    HDR linear buffer (no conversion; the ToneMapping effect + final pass convert). No manual gamma anywhere.
 * Visual idea: a contained luminous column with slow vertical energy bands and a fresnel rim, driven by
 * uEnergy (0..1) and uPulse (0..1 pulse bump). NOT RUNTIME VERIFIED.
 */
export function createEnergyCoreMaterial(coolHex: string, hotHex: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uPulse: { value: 0 },
      uMotion: { value: 1 },
      uColorCool: { value: new Color(coolHex) },
      uColorHot: { value: new Color(hotHex) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormalV = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uEnergy;
      uniform float uPulse;
      uniform float uMotion;
      uniform vec3 uColorCool;
      uniform vec3 uColorHot;
      varying vec2 vUv;
      varying vec3 vNormalV;
      varying vec3 vViewPos;

      float band(float y, float t) { return 0.5 + 0.5 * sin(y * 38.0 - t * 2.2); }

      void main() {
        vec3 n = normalize(vNormalV);
        vec3 v = normalize(-vViewPos);
        float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.0);
        float t = uTime * uMotion;
        float travel = 0.5 * band(vUv.y, t) + 0.5 * band(vUv.y * 0.43 + 0.7, -t * 0.6);
        float cell = smoothstep(0.35, 0.95, travel);
        float edgeFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        float level = (0.25 + 0.75 * cell) * edgeFade;
        float intensity = uEnergy * (0.6 + 1.9 * level) + uPulse * 1.2 + fres * 0.35 * uEnergy;
        vec3 color = mix(uColorCool, uColorHot, clamp(uEnergy * uEnergy + uPulse * 0.5, 0.0, 1.0));
        gl_FragColor = vec4(color * intensity, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
