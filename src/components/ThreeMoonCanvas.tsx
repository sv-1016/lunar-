import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SensorType } from '../types';
import { ZoomIn, ZoomOut, Move, RotateCw, RefreshCw } from 'lucide-react';

interface ThreeMoonCanvasProps {
  progress: number; // 0 to 100
  isProcessing: boolean;
  activeSensor?: SensorType;
  className?: string;
  showCorrespondenceLaser?: boolean;
  isInspectionMode?: boolean;
  onToggleInspectionMode?: () => void;
}

const REAL_MOON_URL_PRIMARY = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg';
const REAL_MOON_URL_FALLBACK = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';
const REAL_MOON_URL_NASA_SVS = 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg';

export const ThreeMoonCanvas: React.FC<ThreeMoonCanvasProps> = ({
  progress,
  isProcessing,
  className = 'w-full h-80',
  showCorrespondenceLaser = true,
  isInspectionMode = false,
  onToggleInspectionMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Camera & Interaction refs
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const zoomDistRef = useRef<number>(15);
  const targetZoomDistRef = useRef<number>(15);
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPanOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [panModeActive, setPanModeActive] = useState<boolean>(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 320;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Procedural lunar texture and LROC QuickMap displacement generator
    const createLunarTextures = (tintColor: string, detailLevel: number = 1) => {
      const width = 1024;
      const height = 512;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const dispCanvas = document.createElement('canvas');
      dispCanvas.width = width;
      dispCanvas.height = height;
      const dCtx = dispCanvas.getContext('2d');

      if (!ctx || !dCtx) return { colorMap: new THREE.CanvasTexture(canvas), dispMap: new THREE.CanvasTexture(dispCanvas) };

      // Base lunar gray albedo and elevation datum
      ctx.fillStyle = '#686f7c';
      ctx.fillRect(0, 0, width, height);

      dCtx.fillStyle = '#808080';
      dCtx.fillRect(0, 0, width, height);

      // Lunar Maria & Depressions
      const maria = [
        { x: 320, y: 190, rx: 110, ry: 80, tone: '#282e37', depth: '#484848' },
        { x: 450, y: 180, rx: 90, ry: 70, tone: '#262b33', depth: '#404040' },
        { x: 570, y: 230, rx: 120, ry: 100, tone: '#232830', depth: '#424242' },
        { x: 380, y: 340, rx: 100, ry: 80, tone: '#2b313b', depth: '#4a4a4a' },
        { x: 500, y: 440, rx: 140, ry: 70, tone: '#20242c', depth: '#202020' }, // South Pole Basin
      ];
      maria.forEach(m => {
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.rx);
        grad.addColorStop(0, m.tone);
        grad.addColorStop(0.7, m.tone);
        grad.addColorStop(1, 'rgba(104, 111, 124, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
        ctx.fill();

        const dGrad = dCtx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.rx);
        dGrad.addColorStop(0, m.depth);
        dGrad.addColorStop(0.7, m.depth);
        dGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
        dCtx.fillStyle = dGrad;
        dCtx.beginPath();
        dCtx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2);
        dCtx.fill();
      });

      // Regolith noise
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const dispData = dCtx.getImageData(0, 0, width, height);
      const dData = dispData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 35;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));

        const dn = (Math.random() - 0.5) * 12;
        dData[i] = Math.min(255, Math.max(0, dData[i] + dn));
        dData[i + 1] = Math.min(255, Math.max(0, dData[i + 1] + dn));
        dData[i + 2] = Math.min(255, Math.max(0, dData[i + 2] + dn));
      }
      ctx.putImageData(imgData, 0, 0);
      dCtx.putImageData(dispData, 0, 0);

      // Craters with excavated floors and raised rims
      const count = 90 * detailLevel;
      for (let i = 0; i < count; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r = (Math.random() * 22 + 2) * detailLevel;

        const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        grad.addColorStop(0, '#1c222b');
        grad.addColorStop(0.7, '#47515f');
        grad.addColorStop(0.88, '#9aa5b5');
        grad.addColorStop(1, 'rgba(104, 111, 124, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        const dGrad = dCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
        dGrad.addColorStop(0, '#353535');
        dGrad.addColorStop(0.7, '#505050');
        dGrad.addColorStop(0.88, '#e0e0e0');
        dGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
        dCtx.fillStyle = dGrad;
        dCtx.beginPath();
        dCtx.arc(cx, cy, r, 0, Math.PI * 2);
        dCtx.fill();
      }

      // Tint overlay
      ctx.fillStyle = tintColor;
      ctx.fillRect(0, 0, width, height);

      const colorMap = new THREE.CanvasTexture(canvas);
      colorMap.wrapS = THREE.RepeatWrapping;
      colorMap.wrapT = THREE.ClampToEdgeWrapping;

      const dispMap = new THREE.CanvasTexture(dispCanvas);
      dispMap.wrapS = THREE.RepeatWrapping;
      dispMap.wrapT = THREE.ClampToEdgeWrapping;

      return { colorMap, dispMap };
    };

    // Shared global displacement heightmap
    const { colorMap: baseColorTex, dispMap: baseDispMap } = createLunarTextures('rgba(0,0,0,0)', 1.2);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x223344, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
    sunLight.position.set(20, 10, 15);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x35c6f4, 0.9);
    rimLight.position.set(-15, -5, -10);
    scene.add(rimLight);

    // Create 3 Moons: OHRC, TMC, IIRS with 128x128 Sphere Geometry for Vertex Displacement
    const moonRadius = 2.0;
    const geometry = new THREE.SphereGeometry(moonRadius, 128, 128);

    // OHRC: Ultra Sharp High Contrast Cyan
    const { colorMap: ohrcTexture } = createLunarTextures('rgba(53, 198, 244, 0.08)', 1.4);
    const ohrcMaterial = new THREE.MeshStandardMaterial({
      map: ohrcTexture,
      bumpMap: baseColorTex,
      bumpScale: 0.16,
      roughness: 0.85,
      metalness: 0.05,
    });
    const moonOHRC = new THREE.Mesh(geometry, ohrcMaterial);
    moonOHRC.position.set(-5.5, 0, 0);
    scene.add(moonOHRC);

    // TMC: Stereo Panchromatic Indigo
    const { colorMap: tmcTexture } = createLunarTextures('rgba(124, 140, 255, 0.08)', 1.0);
    const tmcMaterial = new THREE.MeshStandardMaterial({
      map: tmcTexture,
      bumpMap: baseColorTex,
      bumpScale: 0.14,
      roughness: 0.9,
      metalness: 0.05,
    });
    const moonTMC = new THREE.Mesh(geometry, tmcMaterial);
    moonTMC.position.set(0, 0, 0);
    scene.add(moonTMC);

    // IIRS: Hyperspectral Emerald
    const { colorMap: iirsTexture } = createLunarTextures('rgba(53, 208, 127, 0.12)', 0.8);
    const iirsMaterial = new THREE.MeshStandardMaterial({
      map: iirsTexture,
      bumpMap: baseColorTex,
      bumpScale: 0.12,
      roughness: 0.95,
      metalness: 0.05,
    });
    const moonIIRS = new THREE.Mesh(geometry, iirsMaterial);
    moonIIRS.position.set(5.5, 0, 0);
    scene.add(moonIIRS);

    // Load Real NASA Lunar Photographic Texture across all 3 sensor Moons with sensor-specific processing
    const textureLoader = new THREE.TextureLoader();
    const loadRealMoonTexture = (url: string) => {
      textureLoader.load(
        url,
        (realTex) => {
          realTex.wrapS = THREE.RepeatWrapping;
          realTex.wrapT = THREE.ClampToEdgeWrapping;
          realTex.generateMipmaps = true;
          realTex.minFilter = THREE.LinearMipmapLinearFilter;

          // Apply real photographic moon texture to TMC (Center Stereo Moon)
          tmcMaterial.map = realTex;
          tmcMaterial.bumpMap = realTex;
          tmcMaterial.bumpScale = 0.12;
          tmcMaterial.needsUpdate = true;

          // Apply sharpened real photographic moon texture to OHRC (High-Res Moon)
          ohrcMaterial.map = realTex;
          ohrcMaterial.bumpMap = realTex;
          ohrcMaterial.bumpScale = 0.18;
          ohrcMaterial.needsUpdate = true;

          // Apply real photographic moon texture to IIRS (Hyperspectral Moon)
          iirsMaterial.map = realTex;
          iirsMaterial.bumpMap = realTex;
          iirsMaterial.bumpScale = 0.10;
          iirsMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          // Fallback to secondary CDN
          textureLoader.load(REAL_MOON_URL_FALLBACK, (fallbackTex) => {
            fallbackTex.wrapS = THREE.RepeatWrapping;
            fallbackTex.wrapT = THREE.ClampToEdgeWrapping;
            tmcMaterial.map = fallbackTex;
            ohrcMaterial.map = fallbackTex;
            iirsMaterial.map = fallbackTex;
            tmcMaterial.needsUpdate = true;
            ohrcMaterial.needsUpdate = true;
            iirsMaterial.needsUpdate = true;
          });
        }
      );
    };

    loadRealMoonTexture(REAL_MOON_URL_PRIMARY);

    // Sensor Orbital Rings
    const createRing = (radius: number, color: number) => {
      const ringGeo = new THREE.RingGeometry(radius, radius + 0.03, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.2;
      return ring;
    };

    const ringOHRC = createRing(2.6, 0x35c6f4);
    moonOHRC.add(ringOHRC);

    const ringTMC = createRing(2.6, 0x7c8cff);
    moonTMC.add(ringTMC);

    const ringIIRS = createRing(2.6, 0x35d07f);
    moonIIRS.add(ringIIRS);

    // Feature Point Particles on Moon surfaces
    const createSurfacePoints = (colorHex: number, count: number = 24) => {
      const pointGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        const r = moonRadius + 0.04;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pointMat = new THREE.PointsMaterial({
        color: colorHex,
        size: 0.12,
        transparent: true,
        opacity: 0.9,
      });
      return new THREE.Points(pointGeo, pointMat);
    };

    const pointsOHRC = createSurfacePoints(0x35c6f4, 30);
    moonOHRC.add(pointsOHRC);

    const pointsTMC = createSurfacePoints(0x7c8cff, 30);
    moonTMC.add(pointsTMC);

    const pointsIIRS = createSurfacePoints(0x35d07f, 30);
    moonIIRS.add(pointsIIRS);

    // Laser correspondence beams between moons
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x35c6f4,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    });

    const laserLines: THREE.Line[] = [];
    const laserCount = 8;
    for (let i = 0; i < laserCount; i++) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.5, (i - 3.5) * 0.3, 0),
        new THREE.Vector3(-1.8, (i - 3.5) * 0.3, 0),
      ]);
      const line = new THREE.Line(geom, laserMat);
      scene.add(line);
      laserLines.push(line);
    }

    const laserMat2 = new THREE.LineBasicMaterial({
      color: 0x7c8cff,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    });
    for (let i = 0; i < laserCount; i++) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(1.8, (i - 3.5) * 0.3, 0),
        new THREE.Vector3(3.5, (i - 3.5) * 0.3, 0),
      ]);
      const line = new THREE.Line(geom, laserMat2);
      scene.add(line);
      laserLines.push(line);
    }

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentProgress = progressRef.current;

      // Camera Smooth Zoom & Pan
      zoomDistRef.current += (targetZoomDistRef.current - zoomDistRef.current) * 0.1;
      panOffsetRef.current.x += (targetPanOffsetRef.current.x - panOffsetRef.current.x) * 0.1;
      panOffsetRef.current.y += (targetPanOffsetRef.current.y - panOffsetRef.current.y) * 0.1;

      camera.position.set(panOffsetRef.current.x, panOffsetRef.current.y, zoomDistRef.current);
      camera.lookAt(panOffsetRef.current.x, panOffsetRef.current.y, 0);

      // Speed & Rotation
      const speedMultiplier = currentProgress >= 100 ? 0.05 : 1.0;

      moonOHRC.rotation.y += delta * 0.35 * speedMultiplier;
      moonTMC.rotation.y += delta * 0.65 * speedMultiplier;
      moonIIRS.rotation.y -= delta * 0.40 * speedMultiplier;

      // Orbit rings spin slowly
      ringOHRC.rotation.z += delta * 0.2;
      ringTMC.rotation.z += delta * 0.3;
      ringIIRS.rotation.z -= delta * 0.25;

      // Pulse feature points
      const pulse = (Math.sin(clock.getElapsedTime() * 4) + 1) * 0.5;
      pointsOHRC.scale.setScalar(1 + pulse * 0.05);
      pointsTMC.scale.setScalar(1 + pulse * 0.05);
      pointsIIRS.scale.setScalar(1 + pulse * 0.05);

      // Alignment effect: As progress increases from 65% to 100%, moons subtly converge inward
      const convergence = (Math.min(100, Math.max(0, currentProgress - 65)) / 35) * 0.8;
      moonOHRC.position.x = -5.5 + convergence;
      moonIIRS.position.x = 5.5 - convergence;

      // Animate laser correspondence beams
      const time = clock.getElapsedTime();
      const laserActive = showCorrespondenceLaser && currentProgress > 45;
      laserLines.forEach((line, idx) => {
        line.visible = laserActive;
        if (laserActive) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.3 + Math.sin(time * 8 + idx) * 0.45;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          if (newW < 640) {
            targetZoomDistRef.current = 22; // Zoom out on mobile
          } else {
            targetZoomDistRef.current = 15;
          }
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      ohrcMaterial.dispose();
      tmcMaterial.dispose();
      iirsMaterial.dispose();
    };
  }, [showCorrespondenceLaser]);

  // Interactive Zoom & Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    const panSpeed = 0.012 * (targetZoomDistRef.current / 15);
    targetPanOffsetRef.current.x -= deltaX * panSpeed;
    targetPanOffsetRef.current.y += deltaY * panSpeed;

    targetPanOffsetRef.current.x = Math.max(-10, Math.min(10, targetPanOffsetRef.current.x));
    targetPanOffsetRef.current.y = Math.max(-6, Math.min(6, targetPanOffsetRef.current.y));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.01;
    targetZoomDistRef.current = Math.max(6.0, Math.min(30.0, targetZoomDistRef.current + zoomDelta));
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className} flex items-center justify-center rounded-2xl overflow-hidden bg-[#04060E] border border-slate-800 select-none shadow-xl`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div ref={mountRef} className="w-full h-full cursor-move" />

      {/* Floating Zoom & Pan Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex flex-col bg-[#0B1220]/90 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-lg overflow-hidden divide-y divide-slate-800">
          <button
            type="button"
            onClick={() => { targetZoomDistRef.current = Math.max(6.0, targetZoomDistRef.current - 2.5); }}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { targetZoomDistRef.current = Math.min(30.0, targetZoomDistRef.current + 2.5); }}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { targetPanOffsetRef.current = { x: 0, y: 0 }; targetZoomDistRef.current = 15; }}
            title="Re-Center View"
            className="p-1.5 text-slate-300 hover:text-[#35C6F4] hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sensor labels badge */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-[#0B1220]/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono text-[#35C6F4]">
          OHRC (0.25m)
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#0B1220]/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono text-[#7C8CFF]">
          TMC-2 (NASA LROC)
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-[#0B1220]/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono text-[#35D07F]">
          IIRS (Hyperspectral)
        </span>
      </div>
    </div>
  );
};
