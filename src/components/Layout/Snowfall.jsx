import { useEffect, useRef, useState } from 'react';

// Christmas snow. Gentle, never blocks clicks, and easy to switch off.
//
// - Shows automatically from 1 December to 6 January.
// - Anyone can turn it off with the snowflake button (remembered in this browser).
// - Add ?snow=on to any page address to preview it out of season, ?snow=off to hide it.
// - Not shown at all when the device asks for reduced motion.

const STORAGE_KEY = 'portal_snow';

const inSeason = (now = new Date()) => {
  const month = now.getMonth(); // 0 = January
  return month === 11 || (month === 0 && now.getDate() <= 6);
};

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
};
const write = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    /* storage unavailable: the choice just lasts until reload */
  }
};

const Snowfall = () => {
  const canvasRef = useRef(null);
  const [enabled, setEnabled] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('snow');
    if (param === 'on') {
      write('on');
      return true;
    }
    if (param === 'off') {
      write('off');
      return false;
    }
    const saved = read();
    if (saved === 'on') return true;
    if (saved === 'off') return false;
    return inSeason();
  });

  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Out of season and never switched on: show nothing, not even the button
  const available = enabled || inSeason() || read() === 'on';

  useEffect(() => {
    if (!enabled || reducedMotion) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let frame = null;
    let flakes = [];

    const makeFlake = (anywhere) => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -10,
      r: 1 + Math.random() * 2.6,
      speed: 0.4 + Math.random() * 0.9,
      drift: Math.random() * Math.PI * 2,
      sway: 0.3 + Math.random() * 0.6,
    });

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Fewer flakes on small screens
      const count = Math.round(Math.min(110, Math.max(35, (width * height) / 14000)));
      flakes = Array.from({ length: count }, () => makeFlake(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.y += f.speed;
        f.drift += 0.012;
        f.x += Math.sin(f.drift) * f.sway;
        if (f.y > height + 10) Object.assign(f, makeFlake(false));
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        // White with a faint outline so flakes stay visible on the light background
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowColor = 'rgba(128,0,128,0.35)';
        ctx.shadowBlur = 3;
        ctx.fill();
      }
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

  if (!available || reducedMotion) return null;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    write(next ? 'on' : 'off');
  };

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
        onClick={toggle}
        title={enabled ? 'Turn snow off' : 'Turn snow on'}
        aria-label={enabled ? 'Turn snow off' : 'Turn snow on'}
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
