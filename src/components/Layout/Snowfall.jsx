import { useEffect, useRef } from 'react';
import { useFestive, setFestive, festiveAvailable, prefersReducedMotion } from '../../utils/festive';

// Falling snow plus the on/off button for all Christmas decorations
// (see utils/festive.js for when it is on).

// Six-armed crystal with small side branches, drawn as lines
const drawCrystal = (ctx, x, y, size, rotation) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 3);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size);
    ctx.moveTo(0, -size * 0.55);
    ctx.lineTo(size * 0.28, -size * 0.8);
    ctx.moveTo(0, -size * 0.55);
    ctx.lineTo(-size * 0.28, -size * 0.8);
    ctx.restore();
  }
  ctx.stroke();
  ctx.restore();
};

const Snowfall = () => {
  const canvasRef = useRef(null);
  const enabled = useFestive();
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (!enabled) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let frame = null;
    let flakes = [];

    const makeFlake = (anywhere) => {
      const crystal = Math.random() < 0.4;
      return {
        crystal,
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -12,
        // Crystals are bigger; dots vary so there is a sense of depth
        r: crystal ? 4 + Math.random() * 6 : 1.5 + Math.random() * 3.2,
        speed: (0.35 + Math.random() * 0.9) * (reducedMotion ? 0.4 : 1),
        drift: Math.random() * Math.PI * 2,
        sway: 0.25 + Math.random() * 0.55,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.02,
      };
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(130, Math.max(40, (width * height) / 12000)));
      flakes = Array.from({ length: count }, () => makeFlake(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      for (const f of flakes) {
        f.y += f.speed;
        f.drift += 0.012;
        f.x += Math.sin(f.drift) * f.sway;
        f.angle += f.spin;
        if (f.y > height + 14) Object.assign(f, makeFlake(false));
        if (f.x > width + 14) f.x = -14;
        if (f.x < -14) f.x = width + 14;

        // A faint blue-grey shadow makes white readable on the pale icy background
        ctx.shadowColor = 'rgba(70,90,150,0.45)';
        ctx.shadowBlur = 3;
        if (f.crystal) {
          ctx.strokeStyle = 'rgba(255,255,255,0.97)';
          ctx.lineWidth = f.r > 7 ? 1.6 : 1.2;
          drawCrystal(ctx, f.x, f.y, f.r, f.angle);
        } else {
          // Soft round flake: opaque centre fading to the edge, so it reads as snow
          const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
          g.addColorStop(0, 'rgba(255,255,255,1)');
          g.addColorStop(0.65, 'rgba(255,255,255,0.95)');
          g.addColorStop(1, 'rgba(255,255,255,0.35)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };

    // Stop animating while the tab is hidden
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = null;
      } else if (frame === null) {
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, reducedMotion]);

  if (!festiveAvailable()) return null;

  const label = enabled
    ? 'Turn Christmas decorations off'
    : reducedMotion
      ? 'Turn Christmas decorations on (your device is set to reduce motion)'
      : 'Turn Christmas decorations on';

  return (
    <>
      {enabled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-40"
        />
      )}
      <button
        onClick={() => setFestive(!enabled)}
        title={label}
        aria-label={label}
        aria-pressed={enabled}
        className={`fixed bottom-6 right-24 z-40 flex h-10 w-10 items-center justify-center rounded-full border text-lg shadow transition ${
          enabled
            ? 'border-[#800080] bg-white text-[#800080]'
            : 'border-gray-300 bg-white/80 text-gray-400'
        }`}
      >
        ❄
      </button>
    </>
  );
};

export default Snowfall;
