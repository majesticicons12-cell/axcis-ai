'use client';

import { useRef, useEffect } from 'react';

interface Ring {
  angle: number;
  radius: number;
  opacity: number;
  speed: number;
  phase: number;
}

interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  ringCount?: number;
  speed?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
  className?: string;
}

export default function MagicRings({
  color = '#A855F7',
  colorTwo = '#6366F1',
  ringCount = 6,
  speed = 1,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
  className = '',
}: MagicRingsProps) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<Ring[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const timeRef = useRef(0);
  const hoveredRef = useRef(false);

  const effSpeed = reducedMotion ? speed * 0.1 : speed;
  const effOpacity = reducedMotion ? opacity * 0.3 : opacity;
  const effFollowMouse = reducedMotion ? false : followMouse;
  const effMouseInfluence = reducedMotion ? 0 : mouseInfluence;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initRings = () => {
      ringsRef.current = Array.from({ length: ringCount }, (_, i) => ({
        angle: (i / ringCount) * Math.PI * 2 + rotation,
        radius: baseRadius + i * radiusStep,
        opacity: 0.3 + (i / ringCount) * 0.7,
        speed: speed * (0.5 + (i / ringCount) * 0.5),
        phase: (i / ringCount) * Math.PI * 2,
      }));
    };
    initRings();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const handleHover = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      hoveredRef.current = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    };

    window.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseenter', () => hoveredRef.current = true);
    canvas.addEventListener('mouseleave', () => hoveredRef.current = false);

    let animId: number;

    const draw = (timestamp: number) => {
      const dt = timestamp - timeRef.current;
      timeRef.current = timestamp;

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const cx = w / 2;
      const cy = h / 2;
      const maxDim = Math.min(w, h);

      ctx.clearRect(0, 0, w, h);

      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
      }

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mOffsetX = effFollowMouse ? (mx - 0.5) * maxDim * effMouseInfluence : 0;
      const mOffsetY = effFollowMouse ? (my - 0.5) * maxDim * effMouseInfluence : 0;
      const scale = hoveredRef.current ? hoverScale : 1;

      ringsRef.current.forEach((ring, i) => {
        ring.angle += ring.speed * 0.005 * effSpeed;
        const r = ring.radius * maxDim * scale * 0.5;
        const x = cx + mOffsetX + Math.cos(ring.angle + i * ringGap * 0.1) * r;
        const y = cy + mOffsetY + Math.sin(ring.angle + i * ringGap * 0.1) * r;

        const t = Math.sin(timestamp * 0.001 * ring.speed + ring.phase) * 0.5 + 0.5;
        const alpha = ring.opacity * effOpacity * t;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
        const c1 = i % 2 === 0 ? color : colorTwo;
        const c2 = i % 2 === 0 ? colorTwo : color;
        grad.addColorStop(0, c1.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
        grad.addColorStop(1, c2.replace(')', `, 0)`).replace('rgb', 'rgba'));

        ctx.beginPath();
        ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (noiseAmount > 0) {
          const noiseOffset = Math.sin(timestamp * 0.001 * 3 + i) * noiseAmount * maxDim * 0.02;
          ctx.beginPath();
          ctx.arc(x + noiseOffset, y - noiseOffset * 0.3, r * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.03})`;
          ctx.fill();
        }
      });

      ctx.filter = 'none';
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [color, colorTwo, ringCount, speed, attenuation, lineThickness, baseRadius, radiusStep, scaleRate, opacity, blur, noiseAmount, rotation, ringGap, fadeIn, fadeOut, followMouse, mouseInfluence, hoverScale, parallax, clickBurst]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto',
      }}
    />
  );
}
