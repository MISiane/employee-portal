import { useMemo } from 'react';
import { generateQr } from '../../utils/qr';

// Draws a QR code as an SVG (always dark on white, so it scans in any theme).
const QrCode = ({ value, style, quietZone = 2 }) => {
  const matrix = useMemo(() => {
    try {
      return generateQr(value);
    } catch (error) {
      console.error('QR code error:', error.message);
      return null;
    }
  }, [value]);
  if (!matrix) return null;

  const size = matrix.length + quietZone * 2;
  let path = '';
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) path += `M${x + quietZone} ${y + quietZone}h1v1h-1z`;
    });
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', background: '#fff', ...style }}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code to open the portal"
    >
      <path d={path} fill="#000" />
    </svg>
  );
};

export default QrCode;
