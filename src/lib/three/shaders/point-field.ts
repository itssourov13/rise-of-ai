import { AdditiveBlending, Color, ShaderMaterial } from "three";

/**
 * Reusable GPU point-field shader (Phase 06+). Replaces per-scene particle copies.
 * Attributes: position (state A), aTarget (state B), aSeed (0..1), aLayer (0..1, optional, zeros if unused).
 * All animation is in the vertex shader from uniforms (no CPU per-particle work):
 *   uMix      0..1 morph A -> B, staggered by aSeed (uStagger)
 *   uQuant    >0: quantize uMix into N "denoising" steps (smoothed) for diffusion-style metaphors
 *   uFlow     amplitude of swirl displacement (fades as the morph settles, uSettle)
 *   uVisible  0..1 fraction of points drawn (seed threshold; density ramps)
 *   uSweep*   scanning plane: points behind the plane (along uSweepAxis) are revealed, a bright band rides the plane
 *   uFront    layer activation front over aLayer (uLayerMode=1): lit layers brighter, a band at the front
 * Colour management: uniform colors are THREE.Color (linear), output is linear additive with alpha;
 * ends with tonemapping/colorspace chunks like the other custom shaders. No fog (additive).
 * GLSL / WebGL only. NOT RUNTIME VERIFIED.
 */
export function createPointFieldMaterial(colorAHex: string, colorBHex: string): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uScale: { value: 600 },
      uSize: { value: 0.12 },
      uMaxSize: { value: 18 },
      uOpacity: { value: 1 },
      uMix: { value: 0 },
      uStagger: { value: 0.35 },
      uQuant: { value: 0 },
      uFlow: { value: 0 },
      uSpeed: { value: 1 },
      uSettle: { value: 1 },
      uVisible: { value: 1 },
      uSweepOn: { value: 0 },
      uSweep: { value: 0 },
      uSweepWidth: { value: 2 },
      uSweepAxis: { value: [0, 0, -1] },
      uLayerMode: { value: 0 },
      uFront: { value: 0 },
      uNear: { value: 5 },
      uFar: { value: 120 },
      uDepthColor: { value: 0 },
      uColorA: { value: new Color(colorAHex) },
      uColorB: { value: new Color(colorBHex) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uScale, uSize, uMaxSize, uMix, uStagger, uQuant, uFlow, uSpeed, uSettle, uVisible;
      uniform float uSweepOn, uSweep, uSweepWidth, uLayerMode, uFront, uNear, uFar;
      uniform vec3 uSweepAxis;
      attribute vec3 aTarget;
      attribute float aSeed;
      attribute float aLayer;
      varying float vAlpha, vSeed, vDepth, vBand, vLit;
      void main() {
        float m = uMix;
        if (uQuant > 0.5) { float q = m * uQuant; m = (floor(q) + smoothstep(0.0, 1.0, fract(q) * 1.6)) / uQuant; }
        float local = clamp((m - aSeed * uStagger) / (1.0 - uStagger), 0.0, 1.0);
        local = local * local * (3.0 - 2.0 * local);
        vec3 p = mix(position, aTarget, local);
        float t = uTime * uSpeed;
        float settle = 1.0 - local * uSettle;
        p += uFlow * settle * vec3(
          sin(p.y * 0.35 + t + aSeed * 6.2831),
          sin(p.z * 0.31 + t * 0.8 + aSeed * 3.1),
          sin(p.x * 0.33 + t * 1.1 + aSeed * 9.7));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float dist = max(-mv.z, 0.001);
        gl_PointSize = clamp(uSize * uScale / dist * (0.55 + aSeed * 0.9), 1.0, uMaxSize);
        float vis = step(aSeed, uVisible);
        float reveal = 1.0;
        vBand = 0.0;
        if (uSweepOn > 0.5) {
          float sw = dot(p, uSweepAxis);
          reveal = 1.0 - step(uSweep, sw); // revealed once the scan plane has passed (sw < uSweep)
          vBand = smoothstep(uSweepWidth, 0.0, abs(sw - uSweep));
        }
        vLit = 1.0;
        if (uLayerMode > 0.5) {
          vLit = smoothstep(aLayer - 0.05, aLayer + 0.1, uFront);
          vBand = max(vBand, exp(-pow((uFront - aLayer) * 7.0, 2.0)));
        }
        vSeed = aSeed;
        vDepth = clamp((dist - uNear) / (uFar - uNear), 0.0, 1.0);
        vAlpha = vis * reveal * (0.3 + 0.7 * aSeed) * smoothstep(uFar * 1.4, uFar * 0.5, dist) * smoothstep(0.3, 3.0, dist) * (uLayerMode > 0.5 ? (0.18 + 0.82 * vLit) : 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA, uColorB;
      uniform float uOpacity, uDepthColor;
      varying float vAlpha, vSeed, vDepth, vBand, vLit;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        float k = mix(vSeed, vDepth, uDepthColor);
        vec3 color = mix(uColorA, uColorB, k);
        color += vBand * 0.9 * uColorB;
        gl_FragColor = vec4(color, a * vAlpha * uOpacity * (1.0 + vBand * 1.5));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
