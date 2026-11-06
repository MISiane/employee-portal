import { useEffect, useState } from 'react';
import { useFestive } from '../../utils/festive';

// A string of Christmas lights along the top edge of the window.
const COLORS = ['#ef4444', '#fbbf24', '#22c55e', '#60a5fa', '#f472b6'];
const GAP = 44;
const SAG = 7;

const FestiveLights = () => {
  const enabled = useFestive();
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!enabled) return null;

  const count = Math.ceil(width / GAP) + 1;
  const points = Array.from({ length: count }, (_, i) => ({ x: i * GAP, y: 4 + SAG }));
  // The wire dips between bulbs
  let wire = `M0 4`;
  for (let i = 1; i < count; i++) {
    wire += ` Q${(i - 0.5) * GAP} ${4 + SAG * 2} ${i * GAP} 4`;
  }

  return (
    <svg
      aria-hidden="true"
      className="festive-lights pointer-events-none fixed left-0 top-0 z-40"
      width={width}
      height="26"
      viewBox={`0 0 ${width} 26`}
    >
      <path d={wire} fill="none" stroke="#1f3d2b" strokeWidth="1.5" />
      {points.slice(0, -1).map((p, i) => (
        <circle
          key={i}
          className="festive-bulb"
          cx={p.x + GAP / 2}
          cy={4 + SAG + 3}
          r="4"
          fill={COLORS[i % COLORS.length]}
          style={{ animationDelay: `${(i % 5) * 0.35}s`, color: COLORS[i % COLORS.length] }}
        />
      ))}
    </svg>
  );
};

export default FestiveLights;
