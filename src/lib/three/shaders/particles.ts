import { AdditiveBlending, Color, ShaderMaterial } from "three";

/**
 * Reusable particle-field shader primitive (Points). Particles are stationary data (seeded positions); drift and
 * wrap-around happen in the vertex shader from uTime, so there is no CPU per-particle work.
 *
 * Colour management: uColor is a THREE.Color (linear working space). Output is linear, additive, premultiplied by
 * alpha; ends with <tonemapping_fragment>/<colorspace_fragment> like every custom shader here (see energy-core.ts).
 * No fog (fog:false): the world fog would double-darken additive points. NOT RUNTIME VERIFIED.
 */
export function createParticleMaterial(colorHex: string): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 0.1 },
      /** viewport height in device px / (2*tan(fov/2)): converts world size to pixels. */
      uScale: { value: 600 },
      uSpeed: { value: 1 },
      uOpacity: { value: 1 },
      uFar: { value: 140 },
      uBoxMin: { value: [0, 0, 0] },
      uBoxSize: { value: [1, 1, 1] },
      uDrift: { value: [0, 0, 0] },
      uColor: { value: new Color(colorHex) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSize;
      uniform float uScale;
      uniform float uSpeed;
      uniform float uFar;
      uniform vec3 uBoxMin;
      uniform vec3 uBoxSize;
      uniform vec3 uDrift;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec3 p = position + uDrift * (uTime * uSpeed) * (0.6 + 0.8 * aSeed);
        p = uBoxMin + mod(p - uBoxMin, uBoxSize);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.001);
        gl_PointSize = clamp(uSize * uScale / dist * (0.5 + aSeed), 1.0, 24.0);
        vAlpha = (0.35 + 0.65 * aSeed) * smoothstep(uFar, uFar * 0.45, dist) * smoothstep(0.5, 4.0, dist);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
