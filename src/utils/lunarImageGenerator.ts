import { MatchPoint, SensorType, GeometricTransformation } from '../types';

/**
 * Procedurally generates a realistic lunar observation canvas with craters,
 * regolith texture, sun lighting angles, and sensor-specific filters.
 */
export function generateProceduralLunarImage(
  sensor: SensorType,
  seed: number = 42,
  sunAngleDeg: number = 45,
  width: number = 600,
  height: number = 600,
  regionName: string = 'Shackleton Rim'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Base regolith noise & color tone according to sensor
  let baseGray = 70;
  let tintColor = 'rgba(200, 210, 225, 0.05)';
  if (sensor === 'OHRC') {
    // Ultra high contrast panchromatic sharp
    baseGray = 80;
    tintColor = 'rgba(200, 230, 255, 0.03)';
  } else if (sensor === 'TMC') {
    // Stereo panchromatic medium contrast
    baseGray = 65;
    tintColor = 'rgba(180, 190, 220, 0.04)';
  } else if (sensor === 'IIRS') {
    // Hyperspectral infrared false-tint / mineral tone
    baseGray = 75;
    tintColor = 'rgba(80, 220, 180, 0.08)';
  }

  // Fill base regolith
  ctx.fillStyle = `rgb(${baseGray}, ${baseGray}, ${baseGray})`;
  ctx.fillRect(0, 0, width, height);

  // Micro-regolith noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const pseudoRandom = (n: number) => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < data.length; i += 4) {
    const noise = (pseudoRandom(i * 0.01) - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw procedural craters
  const rad = (sunAngleDeg * Math.PI) / 180;
  const sunDx = Math.cos(rad);
  const sunDy = Math.sin(rad);

  const craterCount = sensor === 'OHRC' ? 38 : sensor === 'TMC' ? 24 : 16;
  const craters = [];

  for (let i = 0; i < craterCount; i++) {
    const cx = (pseudoRandom(i * 1.7) * 0.8 + 0.1) * width;
    const cy = (pseudoRandom(i * 3.3) * 0.8 + 0.1) * height;
    const r = (pseudoRandom(i * 5.1) * 35 + 8) * (sensor === 'OHRC' ? 1.4 : sensor === 'TMC' ? 1.0 : 0.8);
    const depth = pseudoRandom(i * 7.9) * 0.6 + 0.4;
    craters.push({ cx, cy, r, depth });
  }

  // Draw 2 major prominent craters for alignment reference
  craters.push({ cx: width * 0.42, cy: height * 0.45, r: 65, depth: 0.95 });
  craters.push({ cx: width * 0.72, cy: height * 0.68, r: 42, depth: 0.8 });
  craters.push({ cx: width * 0.22, cy: height * 0.75, r: 30, depth: 0.7 });

  craters.forEach((crater) => {
    const { cx, cy, r, depth } = crater;

    // Outer ejecta blanket (bright diffuse rim)
    const ejectaGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 2.2);
    ejectaGrad.addColorStop(0, `rgba(240, 245, 255, ${0.35 * depth})`);
    ejectaGrad.addColorStop(0.5, `rgba(220, 230, 245, ${0.12 * depth})`);
    ejectaGrad.addColorStop(1, 'rgba(200, 200, 200, 0)');
    ctx.fillStyle = ejectaGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Crater interior bowl (shadow side vs illuminated wall)
    // Shadow interior
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${Math.max(5, baseGray - depth * 65)}, ${Math.max(5, baseGray - depth * 65)}, ${Math.max(5, baseGray - depth * 65)})`;
    ctx.fill();

    // Deep shadow crescent cast by rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.beginPath();
    ctx.arc(cx - sunDx * r * 0.35, cy - sunDy * r * 0.35, r * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 2, 8, ${0.85 * depth})`;
    ctx.fill();

    // Illuminated inner wall opposite to shadow
    ctx.beginPath();
    ctx.arc(cx + sunDx * r * 0.45, cy + sunDy * r * 0.45, r * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * depth})`;
    ctx.fill();

    // Central peak in large craters
    if (r > 35) {
      const peakX = cx + (pseudoRandom(cx) - 0.5) * 4;
      const peakY = cy + (pseudoRandom(cy) - 0.5) * 4;
      ctx.beginPath();
      ctx.arc(peakX, peakY, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * depth})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(peakX - sunDx * 3, peakY - sunDy * 3, r * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fill();
    }
    ctx.restore();

    // Raised sharp bright rim on illuminated edge
    ctx.beginPath();
    ctx.arc(cx, cy, r, rad - Math.PI / 2, rad + Math.PI / 2, true);
    ctx.lineWidth = Math.max(1.5, r * 0.08);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.65 * depth})`;
    ctx.stroke();

    // Shadow cast on the outside by the raised rim
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, rad + Math.PI / 2, rad + (3 * Math.PI) / 2, true);
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.5 * depth})`;
    ctx.stroke();
  });

  // Sensor overlay tint
  ctx.fillStyle = tintColor;
  ctx.fillRect(0, 0, width, height);

  // Sensor HUD grid watermark & telemetry metadata
  ctx.strokeStyle = 'rgba(53, 198, 244, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // Corner brackets
  const bSize = 14;
  ctx.strokeStyle = 'rgba(53, 198, 244, 0.4)';
  ctx.lineWidth = 1.5;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(12, 12 + bSize); ctx.lineTo(12, 12); ctx.lineTo(12 + bSize, 12);
  // Top-right
  ctx.moveTo(width - 12 - bSize, 12); ctx.lineTo(width - 12, 12); ctx.lineTo(width - 12, 12 + bSize);
  // Bottom-left
  ctx.moveTo(12, height - 12 - bSize); ctx.lineTo(12, height - 12); ctx.lineTo(12 + bSize, height - 12);
  // Bottom-right
  ctx.moveTo(width - 12 - bSize, height - 12); ctx.lineTo(width - 12, height - 12); ctx.lineTo(width - 12, height - 12 - bSize);
  ctx.stroke();

  // Subtle sensor stamp
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillText(`ISRO CH-2 // ${sensor} RAW OBS`, 20, 26);
  ctx.fillText(`REGION: ${regionName.toUpperCase()}`, 20, height - 20);
  ctx.fillText(`SOLAR AZ: ${sunAngleDeg}°`, width - 110, height - 20);

  return canvas.toDataURL('image/png');
}

/**
 * Generates registered composited image by applying affine/homography transformation
 * to align source image to reference image frame.
 */
export function generateRegisteredCompositedImage(
  sourceImageUrl: string,
  transformation: GeometricTransformation,
  targetWidth: number = 600,
  targetHeight: number = 600,
  callback: (dataUrl: string) => void
) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#050812';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Apply inverse transform to align source with reference space
    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.translate(transformation.translationX * 0.5, transformation.translationY * 0.5);
    ctx.rotate((-transformation.rotationDeg * Math.PI) / 180);
    ctx.scale(1 / transformation.scaleFactor, 1 / transformation.scaleFactor);
    ctx.translate(-img.width / 2, -img.height / 2);

    ctx.drawImage(img, 0, 0);
    ctx.restore();

    // Add registration watermark
    ctx.fillStyle = 'rgba(53, 208, 127, 0.4)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText('✓ LUNARIS REGISTERED FRAME // PROTOTYPE DEMO', 20, 28);

    callback(canvas.toDataURL('image/png'));
  };
  img.src = sourceImageUrl;
}

/**
 * Synthesizes realistic correspondence match points between reference and source.
 */
export function generateSyntheticMatchPoints(
  count: number = 120,
  inlierRatio: number = 0.8146,
  transformation: GeometricTransformation = {
    rotationDeg: 14.62,
    scaleFactor: 1.82,
    translationX: 23.41,
    translationY: -17.28,
    homography: [
      [0.967, -0.252, 23.41],
      [0.252, 0.967, -17.28],
      [0.0001, -0.0002, 1.0],
    ],
    shear: 0.02,
  }
): MatchPoint[] {
  const points: MatchPoint[] = [];
  const inlierCount = Math.floor(count * inlierRatio);

  const rad = (transformation.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (let i = 0; i < count; i++) {
    const isInlier = i < inlierCount;
    // Normalized reference point centered around [0.1, 0.9]
    const x1 = 0.15 + (Math.sin(i * 7.13) * 0.5 + 0.5) * 0.7;
    const y1 = 0.15 + (Math.cos(i * 11.27) * 0.5 + 0.5) * 0.7;

    let x2 = 0;
    let y2 = 0;

    if (isInlier) {
      // Map through transformation model + slight subpixel Gaussian noise
      const cx = x1 - 0.5;
      const cy = y1 - 0.5;
      const rx = (cx * cos - cy * sin) * transformation.scaleFactor;
      const ry = (cx * sin + cy * cos) * transformation.scaleFactor;
      const subpixelNoiseX = (Math.sin(i * 19.3) * 0.004);
      const subpixelNoiseY = (Math.cos(i * 23.7) * 0.004);

      x2 = 0.5 + rx + (transformation.translationX / 600) + subpixelNoiseX;
      y2 = 0.5 + ry + (transformation.translationY / 600) + subpixelNoiseY;
    } else {
      // Outlier: random mismatch
      x2 = 0.1 + (Math.sin(i * 3.45 + 1.2) * 0.5 + 0.5) * 0.8;
      y2 = 0.1 + (Math.cos(i * 5.67 + 2.1) * 0.5 + 0.5) * 0.8;
    }

    // Clamp inside viewport
    x2 = Math.max(0.05, Math.min(0.95, x2));
    y2 = Math.max(0.05, Math.min(0.95, y2));

    points.push({
      id: i + 1,
      x1,
      y1,
      x2,
      y2,
      inlier: isInlier,
      confidence: isInlier ? 0.78 + (Math.sin(i) * 0.2) : 0.25 + (Math.cos(i) * 0.2),
      descriptorDistance: isInlier ? 0.12 + Math.abs(Math.sin(i) * 0.08) : 0.72 + Math.abs(Math.cos(i) * 0.25),
      subpixelOffset: [
        (Math.sin(i * 13) * 0.12),
        (Math.cos(i * 17) * 0.12),
      ],
    });
  }

  return points;
}
