'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform float uOpacity;
uniform float uReduced;

// hash-based pseudo-random
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float star(vec2 uv, vec2 pos, float size) {
  float d = length(uv - pos);
  return smoothstep(size, 0.0, d);
}

float nebula(vec2 uv, vec2 center, float radius, float softness) {
  float d = length(uv - center);
  return 1.0 - smoothstep(0.0, radius * softness, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 pos = uv * 2.0 - 1.0;
  pos.x *= aspect;

  vec3 col = vec3(0.0);

  // Nebula glow 1 — violet
  vec2 n1Center = vec2(sin(uTime * 0.015) * 0.4, cos(uTime * 0.012) * 0.3);
  float n1 = nebula(pos, n1Center, 1.2, 2.5);
  col += vec3(0.35, 0.15, 0.55) * n1 * 0.4;

  // Nebula glow 2 — lighter violet
  vec2 n2Center = vec2(cos(uTime * 0.018 + 1.5) * 0.5, sin(uTime * 0.014 + 0.8) * 0.35);
  float n2 = nebula(pos, n2Center, 0.9, 2.0);
  col += vec3(0.50, 0.25, 0.65) * n2 * 0.3;

  // Particles
  float particleSize = (0.003 + 0.005 * aspect);
  float intensity = 0.0;

  for (int i = 0; i < 80; i++) {
    float fi = float(i);
    float seed = fi * 0.618;
    vec2 p = vec2(
      hash(vec2(seed, 0.0)) * 2.0 - 1.0,
      hash(vec2(seed, 1.0)) * 2.0 - 1.0
    );
    p.x *= aspect;

    // slow drift
    float driftX = sin(uTime * 0.005 * hash(vec2(seed, 2.0)) + seed) * 0.08;
    float driftY = cos(uTime * 0.005 * hash(vec2(seed, 3.0)) + seed) * 0.08;
    p += vec2(driftX, driftY);

    float twinkle = sin(uTime * (1.0 + hash(vec2(seed, 4.0)) * 2.0) + seed * 10.0) * 0.5 + 0.5;
    float s = particleSize * (0.5 + hash(vec2(seed, 5.0)) * 1.0);
    float brightness = 0.3 + hash(vec2(seed, 6.0)) * 0.7;

    float st = star(pos, p, s * (1.0 + twinkle * 0.3));
    vec3 starCol = mix(
      vec3(0.6, 0.4, 0.9),
      vec3(0.9, 0.7, 1.0),
      hash(vec2(seed, 7.0))
    );
    col += starCol * st * brightness * (0.5 + twinkle * 0.5);
    intensity += st;
  }

  // Subtle ambient
  col += vec3(0.02, 0.01, 0.04);

  // Reduce brightness where particles are sparse
  col *= 0.8 + intensity * 0.5;

  float finalOpacity = uReduced > 0.5 ? 0.15 : uOpacity;
  gl_FragColor = vec4(col * 1.5, finalOpacity);
}
`;

interface ParticleFieldProps {
  opacity?: number;
  className?: string;
}

export default function ParticleField({ opacity = 0.6, className = '' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;

    const renderer = new Renderer({ canvas, alpha: true, depth: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;

    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [gl.canvas.width, gl.canvas.height] },
          uOpacity: { value: opacity },
          uReduced: { value: reduced.current ? 1 : 0 },
        },
        transparent: true,
        depthTest: false,
      }),
    });

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      mesh.program.uniforms.uResolution.value = [w * renderer.dpr, h * renderer.dpr];
    };
    resize();
    window.addEventListener('resize', resize);

    let animId: number;
    let startTime = performance.now();

    const draw = (now: number) => {
      const t = (now - startTime) / 1000;
      mesh.program.uniforms.uTime.value = t;
      renderer.render({ scene: mesh });
      if (!reduced.current) {
        animId = requestAnimationFrame(draw);
      }
    };

    if (!reduced.current) {
      animId = requestAnimationFrame(draw);
    } else {
      // Static frame
      mesh.program.uniforms.uTime.value = 0;
      renderer.render({ scene: mesh });
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
