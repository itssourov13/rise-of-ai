import { AdditiveBlending, Color, ShaderMaterial } from "three";

/**
 * Network edge shader (LineSegments). Per-vertex attributes: aT (0 at the edge start, 1 at its end), aLayer (0..1),
 * aPhase (seeded), aHi (1 = highlighted path edge, 0 = ordinary).
 * Travelling pulses run along each edge (direction start -> end), lit by a layer front (uFront over aLayer).
 * uHiOnly dims non-highlighted edges (reasoning scenes). Linear additive output, same colour-management
 * assumptions as the other custom shaders. WebGL only. NOT RUNTIME VERIFIED.
 */
export function createLineFlowMaterial(baseHex: string, pulseHex: string): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uFront: { value: 0 },
      uFlowSpeed: { value: 0.4 },
      uBase: { value: 0.18 },
      uHiOnly: { value: 0 },
      uFlowOn: { value: 1 },
      uOpacity: { value: 1 },
      uColorBase: { value: new Color(baseHex) },
      uColorPulse: { value: new Color(pulseHex) },
    },
    vertexShader: /* glsl */ `
      attribute float aT, aLayer, aPhase, aHi;
      varying float vT, vLayer, vPhase, vHi;
      void main() {
        vT = aT; vLayer = aLayer; vPhase = aPhase; vHi = aHi;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uLevel, uFront, uFlowSpeed, uBase, uHiOnly, uFlowOn, uOpacity;
      uniform vec3 uColorBase, uColorPulse;
      varying float vT, vLayer, vPhase, vHi;
      void main() {
        float lit = smoothstep(vLayer - 0.05, vLayer + 0.12, uFront);
        float x = fract(vT - uTime * uFlowSpeed + vPhase);
        float pulse = smoothstep(0.1, 0.0, abs(x - 0.5)) * uFlowOn;
        float front = exp(-pow((uFront - vLayer) * 6.0, 2.0));
        float dimmer = mix(1.0, vHi, uHiOnly);
        float intensity = uLevel * dimmer * (uBase * (0.25 + 0.75 * lit) + pulse * 1.3 * lit + front * 0.5);
        vec3 color = mix(uColorBase, uColorPulse, clamp(pulse + front, 0.0, 1.0));
        gl_FragColor = vec4(color * intensity, clamp(intensity, 0.0, 1.0) * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
