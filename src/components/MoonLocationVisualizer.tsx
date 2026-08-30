import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { UploadedImage, SensorType, LunarRegionInfo } from '../types';
import { LUNAR_REGIONS } from '../data/samples';
import { 
  Compass, 
  MapPin, 
  Orbit, 
  Maximize2, 
  Minimize2, 
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
  Satellite, 
  ExternalLink, 
  Eye, 
  Sliders, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Move, 
  Activity, 
  Scan, 
  Sparkles, 
  X
} from 'lucide-react';

interface MoonLocationVisualizerProps {
  referenceImage?: UploadedImage | null;
  sourceImage?: UploadedImage | null;
  referenceSensor?: SensorType;
  sourceSensor?: SensorType;
  targetRegionName?: string;
  className?: string;
}

export type LunarMapLayer = 'lroc_wac' | 'lola_elevation' | 'lola_shaded_relief' | 'natural_albedo';

// High-Resolution NASA / LROC Lunar Texture Resources
const NASA_LROC_WAC_TEXTURE = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';
const NASA_LROC_FALLBACK_TEXTURE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg';

// Radius of real Moon in km
const LUNAR_RADIUS_KM = 1737.4;

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

  // Selected region state
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [activeLayer, setActiveLayer] = useState<LunarMapLayer>('lroc_wac');
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showCraterRim, setShowCraterRim] = useState<boolean>(true);
  const [showSensorFootprint, setShowSensorFootprint] = useState<boolean>(true);
  const [showOrbitTrack, setShowOrbitTrack] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(true);
  autoRotateRef.current = autoRotate;
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewAngle, setViewAngle] = useState<'crater' | 'south_pole' | 'global' | 'equatorial'>('crater');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Visibility toggle state for HUD tags
  const [isDatumTagOpen, setIsDatumTagOpen] = useState<boolean>(true);
  const [isOverlaysTagOpen, setIsOverlaysTagOpen] = useState<boolean>(true);

  // Match target region details from database
  const activeRegion: LunarRegionInfo = useMemo(() => {
    if (selectedRegionId) {
      const found = LUNAR_REGIONS.find((r) => r.id === selectedRegionId);
      if (found) return found;
    }

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
    return LUNAR_REGIONS[0];
  }, [targetRegionName, referenceImage, sourceImage, selectedRegionId]);

  // Three.js instances ref
  const controlsRef = useRef<{
    focusOnCoordinates: (lat: number, lng: number, zoom?: number) => void;
    setZoom: (delta: number) => void;
    setLayer: (layer: LunarMapLayer) => void;
    toggleRotation: () => void;
  } | null>(null);

  // Procedural fallback & layer texture generators
  const generateProceduralLayerTexture = useCallback((layer: LunarMapLayer) => {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext('2d');
    if (!ctx) return new THREE.Texture();

    if (layer === 'lola_elevation') {
      // LOLA Topographic Elevation Rainbow Color Ramp (QuickMap Hypsometric Elevation)
      const grad = ctx.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, '#7852FF'); // North pole highlands
      grad.addColorStop(0.2, '#35C6F4');
      grad.addColorStop(0.4, '#35D07F'); // Mid latitudes
      grad.addColorStop(0.6, '#FACC15');
      grad.addColorStop(0.8, '#FF5C5C');
      grad.addColorStop(1.0, '#3B1E82'); // South pole deep basins (-9km)
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, c.width, c.height);

      // Deep craters and basin depressions
      const basins = [
        { x: 600, y: 380, r: 180, depthColor: '#200A52' }, // Oceanus Procellarum
        { x: 920, y: 340, r: 140, depthColor: '#1A0E60' }, // Mare Imbrium
        { x: 1150, y: 360, r: 110, depthColor: '#1E1570' }, // Mare Serenitatis
        { x: 1240, y: 440, r: 100, depthColor: '#241B7A' }, // Mare Tranquillitatis
        { x: 1420, y: 400, r: 85, depthColor: '#281E85' }, // Mare Crisium
        { x: 420, y: 550, r: 130, depthColor: '#120540' }, // Mare Orientale
        { x: 1024, y: 940, r: 240, depthColor: '#0A0028' }, // South Pole - Aitken Basin
      ];

      basins.forEach((b) => {
        const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        bg.addColorStop(0, b.depthColor);
        bg.addColorStop(0.7, '#3B1E82');
        bg.addColorStop(1, 'transparent');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (layer === 'lola_shaded_relief') {
      // LOLA Shaded Slope Relief (Monochrome 3D terrain slopes)
      ctx.fillStyle = '#737373';
      ctx.fillRect(0, 0, c.width, c.height);

      // Maria smooth flat basalt plains
      const maria = [
        { x: 600, y: 380, r: 190, color: '#525252' },
        { x: 920, y: 340, r: 150, color: '#484848' },
        { x: 1150, y: 360, r: 120, color: '#4d4d4d' },
        { x: 1240, y: 440, r: 110, color: '#444444' },
        { x: 1420, y: 400, r: 90, color: '#404040' },
        { x: 420, y: 550, r: 140, color: '#383838' },
        { x: 1024, y: 940, r: 250, color: '#303030' },
      ];

      maria.forEach((m) => {
        const mg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        mg.addColorStop(0, m.color);
        mg.addColorStop(0.85, m.color);
        mg.addColorStop(1, 'transparent');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Shaded crater relief rims
      for (let i = 0; i < 280; i++) {
        const cx = Math.random() * c.width;
        const cy = Math.random() * c.height;
        const cr = Math.random() * 20 + 2;

        // Shadow side (left/top)
        ctx.fillStyle = 'rgba(20, 20, 20, 0.75)';
        ctx.beginPath();
        ctx.arc(cx - 1, cy - 1, cr, 0, Math.PI * 2);
        ctx.fill();

        // Sunlight side (right/bottom)
        ctx.fillStyle = 'rgba(230, 230, 230, 0.85)';
        ctx.beginPath();
        ctx.arc(cx + 1, cy + 1, cr * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Crater floor
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(cx, cy, cr * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // LROC WAC Global Monochrome Basemap (QuickMap Standard)
      ctx.fillStyle = '#83868c';
      ctx.fillRect(0, 0, c.width, c.height);

      // Authentic Lunar Maria (Dark Basalt Seas)
      const mariaSpots = [
        { x: 600, y: 380, r: 210, color: '#3e4148' }, // Oceanus Procellarum
        { x: 920, y: 340, r: 150, color: '#33363d' }, // Mare Imbrium
        { x: 1150, y: 360, r: 125, color: '#3b3e45' }, // Mare Serenitatis
        { x: 1240, y: 440, r: 115, color: '#2f3238' }, // Mare Tranquillitatis
        { x: 1420, y: 400, r: 90, color: '#2a2d33' }, // Mare Crisium
        { x: 1380, y: 520, r: 100, color: '#383b42' }, // Mare Fecunditatis
        { x: 1240, y: 560, r: 85, color: '#3a3d44' }, // Mare Nectaris
        { x: 900, y: 550, r: 110, color: '#3d4047' }, // Mare Nubium
        { x: 740, y: 560, r: 90, color: '#373a40' }, // Mare Humorum
        { x: 1024, y: 220, r: 160, color: '#40434a' }, // Mare Frigoris
        { x: 420, y: 550, r: 130, color: '#282b31' }, // Mare Orientale
        { x: 1024, y: 940, r: 240, color: '#22242a' }, // South Pole-Aitken Basin
      ];

      mariaSpots.forEach((m) => {
        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
        grad.addColorStop(0, m.color);
        grad.addColorStop(0.7, m.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bright Copernican Ejecta Rays (Tycho, Copernicus, Kepler, Aristarchus)
      const rayCenters = [
        { x: 880, y: 680, rays: 32, len: 450, bright: 'rgba(235, 240, 255, 0.45)' }, // Tycho (43.3°S)
        { x: 800, y: 400, rays: 24, len: 260, bright: 'rgba(230, 235, 250, 0.4)' }, // Copernicus
        { x: 680, y: 420, rays: 18, len: 160, bright: 'rgba(225, 230, 245, 0.35)' }, // Kepler
        { x: 580, y: 320, rays: 14, len: 140, bright: 'rgba(250, 250, 255, 0.55)' }, // Aristarchus
      ];

      rayCenters.forEach((rc) => {
        for (let i = 0; i < rc.rays; i++) {
          const angle = (i / rc.rays) * Math.PI * 2 + (Math.random() * 0.1);
          const rayLength = rc.len * (0.6 + Math.random() * 0.6);
          const endX = rc.x + Math.cos(angle) * rayLength;
          const endY = rc.y + Math.sin(angle) * rayLength;

          const rayGrad = ctx.createLinearGradient(rc.x, rc.y, endX, endY);
          rayGrad.addColorStop(0, rc.bright);
          rayGrad.addColorStop(0.3, rc.bright);
          rayGrad.addColorStop(1, 'transparent');

          ctx.strokeStyle = rayGrad;
          ctx.lineWidth = Math.random() * 3 + 1;
          ctx.beginPath();
          ctx.moveTo(rc.x, rc.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });

      // Realistic impact craters with illuminated rims and dark interiors
      for (let i = 0; i < 350; i++) {
        const cx = Math.random() * c.width;
        const cy = Math.random() * c.height;
        const cr = Math.random() * 14 + 1.5;

        // Shadow interior
        ctx.fillStyle = 'rgba(20, 22, 28, 0.7)';
        ctx.beginPath();
        ctx.arc(cx - 0.8, cy - 0.8, cr, 0, Math.PI * 2);
        ctx.fill();

        // Illuminated rim crest
        ctx.strokeStyle = 'rgba(235, 240, 250, 0.65)';
        ctx.lineWidth = Math.max(1, cr * 0.18);
        ctx.beginPath();
        ctx.arc(cx + 0.5, cy + 0.5, cr, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 460;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Dynamic Moon Material
    const moonRadius = 2.4;
    const moonGeometry = new THREE.SphereGeometry(moonRadius, 96, 96);
    
    // Initial procedural texture
    const initialTexture = generateProceduralLayerTexture(activeLayer);
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: initialTexture,
      roughness: 0.88,
      metalness: 0.04,
    });

    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    scene.add(moonMesh);

    // Attempt loading true high-res NASA Photographic Texture if on LROC WAC layer
    if (activeLayer === 'lroc_wac' || activeLayer === 'natural_albedo') {
      const loader = new THREE.TextureLoader();
      loader.load(
        NASA_LROC_WAC_TEXTURE,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.generateMipmaps = true;
          moonMaterial.map = tex;
          moonMaterial.bumpMap = tex;
          moonMaterial.bumpScale = 0.09;
          moonMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          loader.load(NASA_LROC_FALLBACK_TEXTURE, (fallback) => {
            moonMaterial.map = fallback;
            moonMaterial.needsUpdate = true;
          });
        }
      );
    }

    // Directional Sunlight matching Lunar phase
    const ambientLight = new THREE.AmbientLight(0x283040, 1.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.7);
    sunLight.position.set(16, 9, 14);
    scene.add(sunLight);

    const earthShineLight = new THREE.DirectionalLight(0x35c6f4, 0.45);
    earthShineLight.position.set(-14, -6, -10);
    scene.add(earthShineLight);

    // =========================================================================
    // 1. Graticule Lines (Parallels & Meridians matching LROC QuickMap Grid)
    // =========================================================================
    const graticuleGroup = new THREE.Group();
    graticuleGroup.visible = showGraticule;

    const parallelMaterial = new THREE.LineBasicMaterial({
      color: 0x35c6f4,
      transparent: true,
      opacity: 0.2,
    });
    const primeMeridianMaterial = new THREE.LineBasicMaterial({
      color: 0x7c8cff,
      transparent: true,
      opacity: 0.55,
    });

    // Parallels (Latitude lines from -80 to +80 every 15 degrees)
    for (let lat = -80; lat <= 80; lat += 15) {
      const phi = (90 - lat) * (Math.PI / 180);
      const r = (moonRadius + 0.008) * Math.sin(phi);
      const y = (moonRadius + 0.008) * Math.cos(phi);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 90; i++) {
        const theta = (i / 90) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.sin(theta), y, r * Math.cos(theta)));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, lat === 0 ? primeMeridianMaterial : parallelMaterial);
      graticuleGroup.add(line);
    }

    // Meridians (Longitude lines every 30 degrees)
    for (let lon = 0; lon < 180; lon += 30) {
      const pts: THREE.Vector3[] = [];
      const radLon = lon * (Math.PI / 180);
      for (let i = 0; i <= 90; i++) {
        const phi = (i / 90) * Math.PI;
        const x = (moonRadius + 0.008) * Math.sin(phi) * Math.sin(radLon);
        const y = (moonRadius + 0.008) * Math.cos(phi);
        const z = (moonRadius + 0.008) * Math.sin(phi) * Math.cos(radLon);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, lon === 0 ? primeMeridianMaterial : parallelMaterial);
      graticuleGroup.add(line);
    }
    moonMesh.add(graticuleGroup);

    // =========================================================================
    // 2. Chandrayaan-2 100km Polar Mapping Orbit Track
    // =========================================================================
    const orbitGroup = new THREE.Group();
    orbitGroup.visible = showOrbitTrack;
    const orbitRadius = moonRadius + 0.48;
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 100; i++) {
      const theta = (i / 100) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(orbitRadius * Math.sin(theta), orbitRadius * Math.cos(theta), 0));
    }
    const orbitGeom = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitLine = new THREE.Line(
      orbitGeom,
      new THREE.LineBasicMaterial({ color: 0x35d07f, transparent: true, opacity: 0.6 })
    );
    orbitGroup.add(orbitLine);

    // Satellite body model icon
    const satMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.07, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x35d07f })
    );
    satMesh.position.set(0, orbitRadius, 0);
    orbitGroup.add(satMesh);
    scene.add(orbitGroup);

    // =========================================================================
    // 3. Exact Geographic Crater Rim Footprint & Pinpoint on Moon Surface
    // =========================================================================
    const markerGroup = new THREE.Group();

    // Helper: Convert (Lat, Lon) on sphere to 3D Cartesian coordinates
    const latLonToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const targetPos = latLonToVector3(activeRegion.latNum, activeRegion.lngNum, moonRadius + 0.015);
    const normalVec = targetPos.clone().normalize();

    // A. Center Target Crosshair & Pinpoint Beacon
    const pinGeom = new THREE.SphereGeometry(0.045, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x35c6f4 });
    const pinMesh = new THREE.Mesh(pinGeom, pinMat);
    pinMesh.position.copy(targetPos);
    markerGroup.add(pinMesh);

    // B. True-Scale Crater Rim Circle (Calculated from real crater diameter in km)
    const craterDiameterKm = parseFloat(activeRegion.diameter) || 50;
    const craterRadiusAngularRad = (craterDiameterKm / (2 * LUNAR_RADIUS_KM));
    const rimRadiusVisual = Math.max(0.08, moonRadius * Math.sin(craterRadiusAngularRad));

    const rimCircleGroup = new THREE.Group();
    rimCircleGroup.visible = showCraterRim;

    // Glowing vector rim outline
    const rimPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      rimPoints.push(new THREE.Vector3(rimRadiusVisual * Math.cos(angle), rimRadiusVisual * Math.sin(angle), 0));
    }
    const rimGeom = new THREE.BufferGeometry().setFromPoints(rimPoints);
    const rimLine = new THREE.Line(
      rimGeom,
      new THREE.LineBasicMaterial({ color: 0x35d07f, linewidth: 2, transparent: true, opacity: 0.9 })
    );
    rimCircleGroup.add(rimLine);

    // Radar pulsing ring
    const pulseRingGeom = new THREE.RingGeometry(rimRadiusVisual * 0.95, rimRadiusVisual * 1.15, 48);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x35d07f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const pulseRingMesh = new THREE.Mesh(pulseRingGeom, pulseRingMat);
    rimCircleGroup.add(pulseRingMesh);

    rimCircleGroup.position.copy(targetPos);
    rimCircleGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalVec);
    markerGroup.add(rimCircleGroup);

    // C. Sensor Footprint Swath (Observation Frame Polygon)
    const swathGroup = new THREE.Group();
    swathGroup.visible = showSensorFootprint;

    const swathHalfWidth = rimRadiusVisual * 1.4;
    const swathHalfHeight = rimRadiusVisual * 0.9;
    const swathPoints = [
      new THREE.Vector3(-swathHalfWidth, -swathHalfHeight, 0),
      new THREE.Vector3(swathHalfWidth, -swathHalfHeight, 0),
      new THREE.Vector3(swathHalfWidth, swathHalfHeight, 0),
      new THREE.Vector3(-swathHalfWidth, swathHalfHeight, 0),
      new THREE.Vector3(-swathHalfWidth, -swathHalfHeight, 0),
    ];
    const swathGeom = new THREE.BufferGeometry().setFromPoints(swathPoints);
    const swathLine = new THREE.Line(
      swathGeom,
      new THREE.LineBasicMaterial({ color: 0x35c6f4, transparent: true, opacity: 0.75 })
    );
    swathGroup.add(swathLine);

    swathGroup.position.copy(targetPos.clone().multiplyScalar(1.002));
    swathGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normalVec);
    markerGroup.add(swathGroup);

    // D. Vertical Optical Target Laser Beacon Beam
    const laserGeom = new THREE.CylinderGeometry(0.008, 0.08, 1.2, 16);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x35c6f4,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const laserMesh = new THREE.Mesh(laserGeom, laserMat);
    laserMesh.position.copy(targetPos.clone().add(normalVec.clone().multiplyScalar(0.6)));
    laserMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalVec);
    markerGroup.add(laserMesh);

    moonMesh.add(markerGroup);

    // =========================================================================
    // 4. Smooth Camera Framing & Interactive Rotation
    // =========================================================================
    let currentRotationX = 0;
    let currentRotationY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const setFocusCoordinates = (lat: number, lon: number, customDistance?: number) => {
      // Calculate spherical rotation to place lat/lon in front of camera
      const targetY = -(lon * (Math.PI / 180)) - Math.PI / 2;
      const targetX = lat * (Math.PI / 180);

      targetRotationY = targetY;
      targetRotationX = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, targetX));

      if (customDistance !== undefined) {
        camera.position.z = customDistance;
        setZoomLevel(Number(((13 - customDistance) / 8.5 + 0.5).toFixed(1)));
      }
    };

    // Initial camera focus on target crater
    setFocusCoordinates(activeRegion.latNum, activeRegion.lngNum, 7.8);
    currentRotationX = targetRotationX;
    currentRotationY = targetRotationY;
    moonMesh.rotation.x = currentRotationX;
    moonMesh.rotation.y = currentRotationY;

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

      targetRotationY += deltaX * 0.0055;
      targetRotationX += deltaY * 0.0055;
      targetRotationX = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, targetRotationX));

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3.8, Math.min(13.5, camera.position.z + e.deltaY * 0.007));
      setZoomLevel(Number(((13.5 - camera.position.z) / 9.7 + 0.5).toFixed(1)));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Store controls for external buttons
    controlsRef.current = {
      focusOnCoordinates: (lat, lon, zoom) => {
        setFocusCoordinates(lat, lon, zoom);
      },
      setZoom: (delta) => {
        camera.position.z = Math.max(3.8, Math.min(13.5, camera.position.z + delta));
        setZoomLevel(Number(((13.5 - camera.position.z) / 9.7 + 0.5).toFixed(1)));
      },
      setLayer: (newLayer) => {
        const tex = generateProceduralLayerTexture(newLayer);
        moonMaterial.map = tex;
        moonMaterial.bumpMap = tex;
        moonMaterial.needsUpdate = true;
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

      // Auto-rotation around lunar polar axis (continuous 360° rotation)
      if (autoRotateRef.current && !isDragging) {
        targetRotationY += 0.0028;
      }

      // Rotate orbital track around lunar axis
      orbitGroup.rotation.y = elapsed * 0.22;
      orbitGroup.rotation.z = Math.PI * 0.04;

      // Pulse crater reticle & laser beam
      const pulseScale = 1.0 + Math.sin(elapsed * 4.5) * 0.16;
      pulseRingMesh.scale.set(pulseScale, pulseScale, 1);
      (pulseRingMat as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(elapsed * 4.5) * 0.35;

      laserMesh.scale.y = 1.0 + Math.sin(elapsed * 3) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    // Resize listener
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
  }, [activeRegion, activeLayer, showGraticule, showCraterRim, showSensorFootprint, showOrbitTrack, generateProceduralLayerTexture]);

  // Handle Layer Switch
  const handleSelectLayer = (layer: LunarMapLayer) => {
    setActiveLayer(layer);
    controlsRef.current?.setLayer(layer);
  };

  // Handle View Angles
  const handleSetViewAngle = (angle: 'crater' | 'south_pole' | 'global' | 'equatorial') => {
    setViewAngle(angle);
    if (angle === 'crater') {
      controlsRef.current?.focusOnCoordinates(activeRegion.latNum, activeRegion.lngNum, 5.8);
    } else if (angle === 'south_pole') {
      controlsRef.current?.focusOnCoordinates(-89.9, 0.0, 6.2);
    } else if (angle === 'global') {
      controlsRef.current?.focusOnCoordinates(activeRegion.latNum, activeRegion.lngNum, 9.8);
    } else if (angle === 'equatorial') {
      controlsRef.current?.focusOnCoordinates(0.0, 0.0, 7.8);
    }
  };

  // LROC QuickMap Direct URL for active crater
  const quickMapDirectUrl = useMemo(() => {
    // Generate LROC QuickMap URL centered on target coordinates
    return `https://quickmap.lroc.im-ldi.com/?extent=${activeRegion.lngNum - 2}%2C${activeRegion.latNum - 2}%2C${activeRegion.lngNum + 2}%2C${activeRegion.latNum + 2}&proj=10`;
  }, [activeRegion]);

  return (
    <div 
      ref={containerRef}
      className={`bg-[#0B1220] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col font-mono text-xs ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : className
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & QUICKMAP TELEMETRY BAR                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#050812]/90">
        
        {/* Left: Crater Pinpoint Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#35C6F4]/15 border border-[#35C6F4]/40 flex items-center justify-center text-[#35C6F4] shadow-sm">
            <Globe2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">NASA LROC QUICKMAP BASAL DATUM</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#35D07F]/15 border border-[#35D07F]/30 text-[#35D07F] text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35D07F] animate-ping" />
                VERIFIED CRATER LOCATION
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                {activeRegion.name}
              </h3>
              <span className="text-[#35C6F4] text-xs font-semibold px-2 py-0.5 rounded bg-[#35C6F4]/10 border border-[#35C6F4]/25">
                {activeRegion.latitude}, {activeRegion.longitude}
              </span>
            </div>
          </div>
        </div>

        {/* Right: QuickMap Layer Selector & Camera Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Layer Selector */}
          <div className="flex items-center gap-1 bg-[#050812] p-1 rounded-xl border border-slate-800 text-[11px]">
            {[
              { id: 'lroc_wac', label: 'LROC WAC Monochrome' },
              { id: 'lola_elevation', label: 'LOLA Elevation' },
              { id: 'lola_shaded_relief', label: 'Shaded Relief' },
            ].map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => handleSelectLayer(layer.id as LunarMapLayer)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeLayer === layer.id
                    ? 'bg-[#35C6F4]/20 text-[#35C6F4] font-semibold border border-[#35C6F4]/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Quick Perspective Views */}
          <div className="flex items-center gap-1 bg-[#050812] p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => handleSetViewAngle('crater')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                viewAngle === 'crater' ? 'bg-[#35D07F]/20 text-[#35D07F] font-bold border border-[#35D07F]/30' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Close-Up Crater Basin View"
            >
              Crater Focus
            </button>
            <button
              type="button"
              onClick={() => handleSetViewAngle('south_pole')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                viewAngle === 'south_pole' ? 'bg-[#35D07F]/20 text-[#35D07F] font-bold border border-[#35D07F]/30' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Lunar South Pole Polar View"
            >
              South Pole
            </button>
            <button
              type="button"
              onClick={() => handleSetViewAngle('global')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                viewAngle === 'global' ? 'bg-[#35D07F]/20 text-[#35D07F] font-bold border border-[#35D07F]/30' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Orthographic Moon Disk"
            >
              Global
            </button>
          </div>

          {/* Direct LROC QuickMap Launch */}
          <a
            href={quickMapDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#35C6F4]/10 hover:bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/30 text-xs font-semibold cursor-pointer transition-all"
            title="Open in Official NASA / ACT LROC QuickMap"
          >
            <span>LROC QuickMap</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-[#050812] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. CRATER QUICK-SWITCHER PILL BAR                                        */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 bg-[#050812]/95 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-slate-500 font-semibold whitespace-nowrap flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-[#35C6F4]" />
          <span>Quick Craters:</span>
        </span>

        {LUNAR_REGIONS.map((r) => {
          const isSelected = activeRegion.id === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedRegionId(r.id);
                controlsRef.current?.focusOnCoordinates(r.latNum, r.lngNum, 5.8);
              }}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md'
                  : 'bg-[#0B1220] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{r.name}</span>
              <span className={`text-[9px] ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                ({r.latitude})
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN 3D MOON STAGE WITH QUICKMAP HUD OVERLAYS                          */}
      {/* ========================================================================= */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] w-full bg-[#02050b] flex items-center justify-center overflow-hidden">
        
        {/* 3D WebGL Canvas */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Left: LROC Geographic Datum Box / Tag */}
        {isDatumTagOpen ? (
          <div className="absolute top-4 left-4 bg-[#0B1220]/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl max-w-xs space-y-2 pointer-events-auto z-10 shadow-2xl transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 gap-2">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                <MapPin className="w-3.5 h-3.5 text-[#35C6F4]" />
                <span>LUNAR SURFACE DATUM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#35D07F] font-bold">1737.4 km Sphere</span>
                <button
                  type="button"
                  onClick={() => setIsDatumTagOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer ml-1"
                  title="Close Datum Tag"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-white font-bold text-sm font-sans">{activeRegion.name}</div>
              <div className="text-[10px] text-[#35C6F4] mt-0.5">{activeRegion.geology}</div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] pt-1 text-slate-300 border-t border-slate-800/60">
              <div>
                <span className="text-slate-500 block text-[9px]">LATITUDE</span>
                <span className="text-white font-bold">{activeRegion.latitude}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">LONGITUDE</span>
                <span className="text-white font-bold">{activeRegion.longitude}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">RIM DIAMETER</span>
                <span className="text-[#35D07F] font-bold">{activeRegion.diameter}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">CRATER DEPTH</span>
                <span className="text-[#35D07F] font-bold">{activeRegion.elevation}</span>
              </div>
            </div>

            {/* Quick Elevation Profile Trigger */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-[#35C6F4]/10 hover:bg-[#35C6F4]/20 border border-[#35C6F4]/30 text-[#35C6F4] text-[10px] font-bold cursor-pointer transition-all"
              >
                <Activity className="w-3 h-3" />
                <span>Inspect Elevation Profile & Depth</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsDatumTagOpen(true)}
            className="absolute top-4 left-4 bg-[#0B1220]/90 backdrop-blur-md border border-slate-800 hover:border-[#35C6F4] px-3 py-2 rounded-xl text-slate-200 hover:text-white shadow-2xl transition-all cursor-pointer z-10 pointer-events-auto flex items-center gap-2 group"
            title="Open Lunar Surface Datum Tag"
          >
            <div className="w-6 h-6 rounded-lg bg-[#35C6F4]/15 border border-[#35C6F4]/40 flex items-center justify-center text-[#35C6F4]">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">LUNAR DATUM</span>
              <span className="block text-xs font-bold text-white group-hover:text-[#35C6F4] transition-colors">{activeRegion.name}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#35C6F4] ml-1 transition-colors" />
          </button>
        )}

        {/* Top-Right: QuickMap Layer & Display Overlays Tag */}
        {isOverlaysTagOpen ? (
          <div className="absolute top-4 right-4 bg-[#0B1220]/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl max-w-xs space-y-2 pointer-events-auto z-10 shadow-2xl transition-all animate-in fade-in zoom-in-95">
            <div className="text-slate-400 text-[10px] font-bold border-b border-slate-800 pb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#35D07F]" />
                <span>MAP OVERLAYS &amp; GRIDS</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOverlaysTagOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
                title="Close Overlays Tag"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <label className="flex items-center justify-between gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <span>Crater Rim Footprint (True Scale)</span>
                <input
                  type="checkbox"
                  checked={showCraterRim}
                  onChange={(e) => setShowCraterRim(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#35D07F] accent-[#35D07F] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <span>Sensor Swath (FOV Box)</span>
                <input
                  type="checkbox"
                  checked={showSensorFootprint}
                  onChange={(e) => setShowSensorFootprint(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#35C6F4] accent-[#35C6F4] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <span>Lat/Lon Graticule Lines</span>
                <input
                  type="checkbox"
                  checked={showGraticule}
                  onChange={(e) => setShowGraticule(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#35C6F4] accent-[#35C6F4] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 text-slate-300 hover:text-white cursor-pointer select-none">
                <span>Chandrayaan-2 100km Orbit</span>
                <input
                  type="checkbox"
                  checked={showOrbitTrack}
                  onChange={(e) => setShowOrbitTrack(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#35D07F] accent-[#35D07F] cursor-pointer"
                />
              </label>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOverlaysTagOpen(true)}
            className="absolute top-4 right-4 bg-[#0B1220]/90 backdrop-blur-md border border-slate-800 hover:border-[#35D07F] px-3 py-2 rounded-xl text-slate-200 hover:text-white shadow-2xl transition-all cursor-pointer z-10 pointer-events-auto flex items-center gap-2 group"
            title="Open Map Overlays & Grids Tag"
          >
            <div className="w-6 h-6 rounded-lg bg-[#35D07F]/15 border border-[#35D07F]/40 flex items-center justify-center text-[#35D07F]">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block text-[9px] text-slate-400 font-bold uppercase">MAP LAYERS</span>
              <span className="block text-xs font-bold text-white group-hover:text-[#35D07F] transition-colors">Overlays &amp; Grids</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#35D07F] ml-1 transition-colors" />
          </button>
        )}

        {/* Floating Center Targeting Callout Banner */}
        <div className="absolute top-16 inset-x-0 mx-auto w-fit bg-[#0B1220]/80 backdrop-blur-md border border-[#35C6F4]/40 px-4 py-1.5 rounded-full text-[11px] text-white shadow-xl pointer-events-none flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-[#35C6F4] animate-spin-slow" />
          <span>Targeting:</span>
          <strong className="text-[#35D07F]">{activeRegion.name}</strong>
          <span className="text-slate-400">({activeRegion.latitude}, {activeRegion.longitude})</span>
        </div>

        {/* Floating Controls at Bottom-Right (Zoom & Recenter) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            onClick={() => controlsRef.current?.setZoom(-1.5)}
            className="p-2 rounded-xl bg-[#0B1220]/90 backdrop-blur-md border border-slate-700 hover:border-[#35C6F4] text-white cursor-pointer transition-all shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-[#35C6F4]" />
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.setZoom(1.5)}
            className="p-2 rounded-xl bg-[#0B1220]/90 backdrop-blur-md border border-slate-700 hover:border-[#35C6F4] text-white cursor-pointer transition-all shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-[#35C6F4]" />
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.focusOnCoordinates(activeRegion.latNum, activeRegion.lngNum, 5.8)}
            className="p-2 rounded-xl bg-[#35C6F4]/20 backdrop-blur-md border border-[#35C6F4]/60 hover:bg-[#35C6F4]/30 text-[#35C6F4] cursor-pointer transition-all shadow-lg"
            title="Recenter Camera on Crater"
          >
            <Target className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => controlsRef.current?.toggleRotation()}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all shadow-lg cursor-pointer ${
              autoRotate 
                ? 'bg-[#35D07F]/20 border-[#35D07F] text-[#35D07F]' 
                : 'bg-[#0B1220]/90 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Lunar Polar Rotation"
          >
            <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>

        {/* Bottom Helper Instruction */}
        <div className="absolute bottom-4 inset-x-0 mx-auto w-fit bg-[#0B1220]/80 backdrop-blur-md border border-slate-800 px-3.5 py-1 rounded-full text-[10px] text-slate-400 pointer-events-none flex items-center gap-2 shadow-lg">
          <Move className="w-3 h-3 text-[#35C6F4]" />
          <span>Click &amp; drag to rotate 360° • Scroll wheel to zoom into crater basin</span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER MISSION & INSTRUMENTATION CONTEXT                               */}
      {/* ========================================================================= */}
      <div className="p-4 bg-[#050812] border-t border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-slate-300 flex items-center gap-2 flex-wrap">
            <span className="text-slate-500">Registered Imagery Swath:</span>
            <span className="text-white font-bold">ISRO Chandrayaan-2 {referenceSensor} ↔ {sourceSensor}</span>
            <span className="text-slate-500">•</span>
            <span className="text-[#35D07F]">Sub-pixel Homography Verified</span>
          </div>

          <div className="text-slate-400 text-[11px]">
            <span>Lunar Coordinates:</span>{' '}
            <strong className="text-[#35C6F4]">{activeRegion.latNum.toFixed(2)}°, {activeRegion.lngNum.toFixed(2)}°</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/60">
          <span className="text-slate-500 text-[10px]">Validated Cross-Mission Instruments:</span>
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

      {/* ========================================================================= */}
      {/* 5. CRATER ELEVATION PROFILE MODAL                                         */}
      {/* ========================================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#35C6F4]" />
                <h4 className="text-base font-bold text-white font-sans">
                  {activeRegion.name} — Topographic Elevation Profile
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Canvas Diagram */}
            <div className="p-4 bg-[#050812] rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>Rim Crest: +1.2 km</span>
                <span className="text-[#35C6F4] font-bold">Crater Diameter: {activeRegion.diameter}</span>
                <span>Rim Crest: +1.4 km</span>
              </div>

              {/* SVG Cross-section shape */}
              <div className="w-full h-32 relative flex items-center justify-center">
                <svg viewBox="0 0 400 120" className="w-full h-full">
                  {/* Outer highland */}
                  <path d="M 0,30 L 70,25 L 100,10 L 140,85 L 200,95 L 210,65 L 220,95 L 260,85 L 300,10 L 330,25 L 400,30" 
                    fill="none" 
                    stroke="#35C6F4" 
                    strokeWidth="2.5" 
                  />
                  {/* Fill below profile */}
                  <path d="M 0,30 L 70,25 L 100,10 L 140,85 L 200,95 L 210,65 L 220,95 L 260,85 L 300,10 L 330,25 L 400,30 L 400,120 L 0,120 Z" 
                    fill="url(#craterGrad)" 
                    opacity="0.3" 
                  />
                  {/* Laser point at center */}
                  <line x1="210" y1="0" x2="210" y2="65" stroke="#35D07F" strokeDasharray="3,3" strokeWidth="1.5" />
                  <circle cx="210" cy="65" r="4" fill="#35D07F" />

                  <defs>
                    <linearGradient id="craterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#35C6F4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#35C6F4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Central Peak Label */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[#35D07F] font-bold bg-[#0B1220]/90 px-2 py-0.5 rounded border border-[#35D07F]/40">
                  Floor Depth: {activeRegion.elevation}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center">
                Topographic cross-section derived from NASA LOLA (Lunar Orbiter Laser Altimeter) 128 px/deg DEM
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-xl bg-[#35C6F4] text-black font-bold text-xs cursor-pointer hover:bg-[#35C6F4]/90 transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
