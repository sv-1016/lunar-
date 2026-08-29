import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { UploadedImage, SensorType, LunarRegionInfo } from '../types';
import { LUNAR_REGIONS } from '../data/samples';
import { 
  Compass, 
  MapPin, 
  Orbit, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Layers, 
  Target, 
  Globe2, 
  Sun, 
  CheckCircle2, 
  Crosshair, 
  Info,
  Radio,
  Satellite
} from 'lucide-react';

interface MoonLocationVisualizerProps {
  referenceImage?: UploadedImage | null;
  sourceImage?: UploadedImage | null;
  referenceSensor?: SensorType;
  sourceSensor?: SensorType;
  targetRegionName?: string;
  className?: string;
}

// Real NASA Photographic Moon Texture URLs
const NASA_MOON_TEXTURE_PRIMARY = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg';
const NASA_MOON_TEXTURE_FALLBACK = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';

export const MoonLocationVisualizer: React.FC<MoonLocationVisualizerProps> = ({
  referenceImage,
  sourceImage,
  referenceSensor = 'OHRC',
  sourceSensor = 'TMC',
  targetRegionName,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Match target region details from database
  const activeRegion: LunarRegionInfo = useMemo(() => {
    const rawName = targetRegionName || referenceImage?.targetRegion || sourceImage?.targetRegion || 'Shackleton Crater';
    const lower = rawName.toLowerCase();
    
    const matched = LUNAR_REGIONS.find((r) => {
      return (
        lower.includes(r.id.toLowerCase()) ||
        lower.includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(lower)
      );
    });

    if (matched) return matched;

    // Default to Shackleton Crater if not matched
    return LUNAR_REGIONS[0];
  }, [targetRegionName, referenceImage, sourceImage]);

  // UI & Camera Controls
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showOrbitTrack, setShowOrbitTrack] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Three.js instances ref
  const controlsRef = useRef<{
    focusOnCoordinates: (lat: number, lng: number) => void;
    setZoom: (delta: number) => void;
    toggleRotation: () => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Fallback Procedural Lunar Texture
    const createProceduralTexture = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.Texture();

      // Base gray
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(0, 0, c.width, c.height);

      // Maria
      const mariaSpots = [
        { x: 300, y: 180, r: 90, color: '#374151' },
        { x: 450, y: 200, r: 110, color: '#1f2937' },
        { x: 550, y: 160, r: 80, color: '#374151' },
        { x: 380, y: 320, r: 75, color: '#4b5563' },
        { x: 512, y: 470, r: 120, color: '#111827' }, // South pole dark region
      ];

      mariaSpots.forEach((m) => {
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        grad.addColorStop(0, m.color);
        grad.addColorStop(0.8, m.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Micro Craters
      for (let i = 0; i < 150; i++) {
        const cx = Math.random() * c.width;
        const cy = Math.random() * c.height;
        const cr = Math.random() * 12 + 1;
        ctx.fillStyle = 'rgba(17, 24, 39, 0.6)';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(243, 244, 246, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    // Lights
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(15, 8, 12);
    scene.add(sunLight);

    const blueBackLight = new THREE.DirectionalLight(0x35c6f4, 0.8);
    blueBackLight.position.set(-12, -6, -8);
    scene.add(blueBackLight);

    // Moon Mesh
    const moonRadius = 2.4;
    const moonGeometry = new THREE.SphereGeometry(moonRadius, 64, 64);
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: createProceduralTexture(),
      roughness: 0.9,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    scene.add(moonMesh);

    // Load High-Res NASA Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      NASA_MOON_TEXTURE_PRIMARY,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        moonMaterial.map = tex;
        moonMaterial.bumpMap = tex;
        moonMaterial.bumpScale = 0.08;
        moonMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoader.load(NASA_MOON_TEXTURE_FALLBACK, (fallbackTex) => {
          moonMaterial.map = fallbackTex;
          moonMaterial.needsUpdate = true;
        });
      }
    );

    // Graticule / Parallels & Meridians
    const graticuleGroup = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x35c6f4,
      transparent: true,
      opacity: 0.22,
    });
    const equatorMaterial = new THREE.LineBasicMaterial({
      color: 0x7c8cff,
      transparent: true,
      opacity: 0.5,
    });

    // Latitude circles (Parallels)
    for (let lat = -80; lat <= 80; lat += 20) {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = (moonRadius + 0.01) * Math.sin(phi);
      const y = (moonRadius + 0.01) * Math.cos(phi);
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(r * Math.sin(theta), y, r * Math.cos(theta)));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, lat === 0 ? equatorMaterial : lineMaterial);
      graticuleGroup.add(line);
    }

    // Longitude circles (Meridians)
    for (let lon = 0; lon < 180; lon += 30) {
      const points: THREE.Vector3[] = [];
      const segments = 64;
      const radLon = lon * (Math.PI / 180);
      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI;
        const x = (moonRadius + 0.01) * Math.sin(phi) * Math.sin(radLon);
        const y = (moonRadius + 0.01) * Math.cos(phi);
        const z = (moonRadius + 0.01) * Math.sin(phi) * Math.cos(radLon);
        points.push(new THREE.Vector3(x, y, z));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, lon === 0 ? equatorMaterial : lineMaterial);
      graticuleGroup.add(line);
    }
    moonMesh.add(graticuleGroup);

    // Chandrayaan-2 Polar Mapping Orbit Ring
    const orbitGroup = new THREE.Group();
    const orbitRadius = moonRadius + 0.55;
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 90; i++) {
      const theta = (i / 90) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(orbitRadius * Math.sin(theta), orbitRadius * Math.cos(theta), 0));
    }
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitLine = new THREE.Line(
      orbitGeom,
      new THREE.LineBasicMaterial({ color: 0x35d07f, transparent: true, opacity: 0.65 })
    );
    orbitGroup.add(orbitLine);

    // Satellite Model icon in orbit
    const satGeom = new THREE.BoxGeometry(0.12, 0.08, 0.06);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x35d07f });
    const satMesh = new THREE.Mesh(satGeom, satMat);
    satMesh.position.set(0, orbitRadius, 0);
    orbitGroup.add(satMesh);

    scene.add(orbitGroup);

    // Location Beacon Marker Group (Attached to moon surface)
    const markerGroup = new THREE.Group();
    
    // Function to calculate Cartesian vector from Lat / Lon on sphere
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Beacon Core Pin & Target Reticle Ring
    const beaconRadius = moonRadius + 0.02;
    const targetPos = latLonToVector3(activeRegion.latNum, activeRegion.lngNum, beaconRadius);

    // Center glowing pin
    const pinGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x35c6f4 });
    const pinMesh = new THREE.Mesh(pinGeom, pinMat);
    pinMesh.position.copy(targetPos);
    markerGroup.add(pinMesh);

    // Animated Target Reticle Rings
    const ringGeom = new THREE.RingGeometry(0.1, 0.14, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x35d07f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.copy(targetPos);
    ringMesh.lookAt(targetPos.clone().multiplyScalar(2));
    markerGroup.add(ringMesh);

    // Laser footprint cone pointing down to target
    const coneGeom = new THREE.ConeGeometry(0.2, 0.6, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x35c6f4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const coneMesh = new THREE.Mesh(coneGeom, coneMat);
    coneMesh.position.copy(targetPos.clone().multiplyScalar(1.08));
    coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPos.clone().normalize());
    markerGroup.add(coneMesh);

    moonMesh.add(markerGroup);

    // Calculate Target Camera Rotation to frame target directly in front of the camera
    let currentRotationX = 0;
    let currentRotationY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const setFocusCoordinates = (lat: number, lon: number) => {
      // Calculate target Y rotation (lon) and X rotation (lat)
      const targetY = -(lon * (Math.PI / 180)) - Math.PI / 2;
      const targetX = lat * (Math.PI / 180);

      targetRotationY = targetY;
      targetRotationX = targetX;
    };

    // Focus on the active region initially
    setFocusCoordinates(activeRegion.latNum, activeRegion.lngNum);
    currentRotationX = targetRotationX;
    currentRotationY = targetRotationY;
    moonMesh.rotation.x = targetRotationX;
    moonMesh.rotation.y = targetRotationY;

    // Mouse drag interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      targetRotationY += deltaX * 0.006;
      targetRotationX += deltaY * 0.006;

      // Restrict pitch
      targetRotationX = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, targetRotationX));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(4.5, Math.min(14, camera.position.z + e.deltaY * 0.008));
      setZoomLevel(Number(((14 - camera.position.z) / 9.5 + 0.5).toFixed(1)));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Store controls for external buttons
    controlsRef.current = {
      focusOnCoordinates: (lat, lon) => {
        setFocusCoordinates(lat, lon);
      },
      setZoom: (delta) => {
        camera.position.z = Math.max(4.5, Math.min(14, camera.position.z + delta));
        setZoomLevel(Number(((14 - camera.position.z) / 9.5 + 0.5).toFixed(1)));
      },
      toggleRotation: () => {
        setAutoRotate((prev) => !prev);
      },
    };

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth interpolation toward target camera orientation
      if (!isDragging) {
        currentRotationX += (targetRotationX - currentRotationX) * 0.08;
        currentRotationY += (targetRotationY - currentRotationY) * 0.08;
        moonMesh.rotation.x = currentRotationX;
        moonMesh.rotation.y = currentRotationY;
      } else {
        moonMesh.rotation.x = targetRotationX;
        moonMesh.rotation.y = targetRotationY;
      }

      // Auto rotation if enabled
      if (autoRotate && !isDragging) {
        targetRotationY += 0.002;
      }

      // Rotate orbit ring around polar axis
      orbitGroup.rotation.y = elapsed * 0.25;
      orbitGroup.rotation.z = Math.PI * 0.05;

      // Pulse reticle ring
      const scale = 1 + Math.sin(elapsed * 4) * 0.15;
      ringMesh.scale.set(scale, scale, 1);
      (ringMat as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(elapsed * 4) * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeRegion]);

  // Update visibility of elements
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.focusOnCoordinates(activeRegion.latNum, activeRegion.lngNum);
    }
  }, [activeRegion]);

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#0B1220] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col ${className}`}
    >
      {/* HUD Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-800 bg-[#050812]/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#35C6F4]/15 border border-[#35C6F4]/40 flex items-center justify-center text-[#35C6F4]">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">REAL LUNAR COORDINATES</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#35D07F]/15 border border-[#35D07F]/30 text-[#35D07F] text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35D07F] animate-pulse" />
                VERIFIED ON-MOON PINPOINT
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white font-sans flex items-center gap-2">
              <span>{activeRegion.name}</span>
              <span className="text-[#35C6F4] font-mono text-xs font-normal">
                [{activeRegion.latitude}, {activeRegion.longitude}]
              </span>
            </h3>
          </div>
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => controlsRef.current?.setZoom(-1.5)}
            className="p-1.5 rounded-lg bg-[#050812] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.setZoom(1.5)}
            className="p-1.5 rounded-lg bg-[#050812] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.focusOnCoordinates(activeRegion.latNum, activeRegion.lngNum)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#35C6F4]/10 border border-[#35C6F4]/30 hover:bg-[#35C6F4]/20 text-[#35C6F4] text-xs font-mono font-semibold cursor-pointer transition-all"
            title="Recenter Camera on Real Crater Pinpoint"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Recenter Pin</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas with Real-Time Telemetry Overlay */}
      <div className="relative flex-1 min-h-[340px] sm:min-h-[400px] w-full bg-[#03060d] flex items-center justify-center overflow-hidden">
        
        {/* 3D Moon WebGL Mount */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Left Geographic Datum HUD */}
        <div className="absolute top-3 left-3 bg-[#0B1220]/85 backdrop-blur-md border border-slate-800 p-3 rounded-xl max-w-xs space-y-1.5 pointer-events-none text-xs font-mono z-10 shadow-lg">
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <MapPin className="w-3 h-3 text-[#35C6F4]" />
            <span>GEOGRAPHIC DATUM</span>
          </div>
          <div className="text-white font-bold text-xs">{activeRegion.name}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[9px]">LATITUDE</span>
              <span className="text-[#35C6F4] font-bold">{activeRegion.latitude}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">LONGITUDE</span>
              <span className="text-[#35C6F4] font-bold">{activeRegion.longitude}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">ELEVATION</span>
              <span className="text-slate-200">{activeRegion.elevation}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px]">DIAMETER</span>
              <span className="text-slate-200">{activeRegion.diameter}</span>
            </div>
          </div>
        </div>

        {/* Top-Right Mission Payload HUD */}
        <div className="absolute top-3 right-3 bg-[#0B1220]/85 backdrop-blur-md border border-slate-800 p-3 rounded-xl max-w-xs space-y-1.5 pointer-events-none text-xs font-mono z-10 shadow-lg hidden sm:block">
          <div className="flex items-center gap-2 text-slate-400 text-[10px]">
            <Satellite className="w-3 h-3 text-[#35D07F]" />
            <span>CHANDRAYAAN-2 ORBITER</span>
          </div>
          <div className="text-[11px] text-slate-300">
            <span className="text-slate-500">Payload Pair:</span>{' '}
            <strong className="text-white">{referenceSensor} ↔ {sourceSensor}</strong>
          </div>
          <div className="text-[10px] text-[#35D07F] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35D07F] animate-ping" />
            <span>100 km Lunar Polar Orbit Track</span>
          </div>
        </div>

        {/* Bottom-Center Interactive Tip */}
        <div className="absolute bottom-3 inset-x-0 mx-auto w-fit bg-[#0B1220]/80 backdrop-blur-md border border-slate-800/80 px-3 py-1 rounded-full text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-2">
          <Crosshair className="w-3 h-3 text-[#35C6F4]" />
          <span>Click and drag to rotate Moon • Scroll wheel to zoom into crater basin</span>
        </div>

      </div>

      {/* Geological Summary & Context Footer */}
      <div className="p-4 bg-[#050812] border-t border-slate-800/80 space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-slate-300">
            <span className="text-slate-500">Geological Formation:</span>{' '}
            <span className="text-slate-200">{activeRegion.geology}</span>
          </div>
        </div>

        {/* Supported Imagery Sensors */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
          <span className="text-slate-500 text-[11px]">Validated Instruments:</span>
          {activeRegion.availableImagery.map((sensor) => (
            <span
              key={sensor}
              className="px-2 py-0.5 rounded-md bg-[#0B1220] border border-slate-800 text-slate-300 text-[10px]"
            >
              {sensor}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
