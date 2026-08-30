import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { SensorType } from '../types';
import { generateProceduralLunarImage } from '../utils/lunarImageGenerator';
import { 
  Compass, 
  Plus, 
  Minus, 
  RotateCw, 
  MapPin, 
  Satellite, 
  Eye, 
  Sparkles, 
  Sun,
  Maximize2,
  Minimize2,
  Navigation,
  Globe,
  Radio,
  Move,
  ZoomIn,
  RefreshCw,
  Info,
  Layers,
  Crosshair,
  Sliders,
  ChevronRight,
  ChevronDown,
  FastForward,
  CheckCircle2,
  Mountain,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Scan,
  Activity,
  Layers3,
  Split,
  EyeOff,
  X
} from 'lucide-react';

export const LROC_QUICKMAP_DATASET_URL = 'https://quickmap.lroc.im-ldi.com/?prjExtent=-3541257.9234973%2C-1737400%2C3541257.9234973%2C1737400&earthShadowEnabled=true&proj=10&stack=3314&defs=N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg';

export type AnimationStage = 
  | 'globe_rotate'      // 1. 🌕 3D Moon continuous 360° rotation around vertical axis (medium distance, centered)
  | 'south_region'      // 2. 🔭 Camera gradually zooms toward Lunar South Region (43°S–60°S)
  | 'tycho_crater'      // 3. 🎯 Deep precision zoom on Tycho Crater (43.3°S, 11.2°W)
  | 'selected_area'     // 4. 📐 Selected image area crop & sensor observation frame
  | 'image_registration';// 5. ⚡ Seamless transition into registered lunar surface image & sub-pixel alignment

export interface Landmark {
  id: string;
  name: string;
  description: string;
  lat: number; // -90 to +90
  lon: number; // -180 to +180
  type: 'crater' | 'basin' | 'mission' | 'landing';
  highlight?: boolean;
  diameter?: string;
  depth?: string;
  geology?: string;
  missionContext?: string;
  sensors?: string;
}

export const LUNAR_LANDMARKS: Landmark[] = [
  {
    id: 'tycho',
    name: 'Tycho Crater',
    description: 'Prominent rayed impact structure (43.3°S, 11.2°W)',
    lat: -43.31,
    lon: -11.36,
    type: 'crater',
    highlight: true,
    diameter: '85.0 km',
    depth: '4.8 km',
    geology: 'Copernican-age impact crater with a 1.6 km central peak uplift and 1,500 km brilliant ejecta ray system.',
    missionContext: 'Primary calibration target for multi-sensor cross-modal registration and sub-pixel alignment.',
    sensors: 'OHRC Panchromatic 0.25m + IIRS Hyperspectral 0.8–5.0µm',
  },
  {
    id: 'shackleton',
    name: 'Shackleton Crater',
    description: 'Lunar South Pole • Primary CH-2 / Artemis Target (89.9°S, 0.0°E)',
    lat: -89.9,
    lon: 0.0,
    type: 'crater',
    highlight: true,
    diameter: '21.0 km',
    depth: '4.2 km',
    geology: 'Permanently shadowed interior cold traps (PSRs) with water ice volatile concentrations; ridge peaks in near-permanent sunlight.',
    missionContext: 'Chandrayaan-2 polar mapping orbit primary target and landing site selection benchmark.',
    sensors: 'OHRC 0.25m + DFSAR Dual-Frequency SAR',
  },
  {
    id: 'orientale',
    name: 'Mare Orientale',
    description: 'Target multi-ring impact basin (19.4°S, 92.8°W)',
    lat: -19.4,
    lon: -92.8,
    type: 'basin',
    diameter: '930.0 km',
    depth: '6.0 km crustal thinning',
    geology: 'The Solar System’s best preserved multi-ring impact basin; Montes Rook & Cordillera concentric rings.',
    missionContext: 'Structural benchmark for large-scale basin photogrammetry and gravitational anomalies.',
    sensors: 'TMC-2 5m DEM + LOLA Laser Altimeter',
  },
  {
    id: 'tranquillitatis',
    name: 'Mare Tranquillitatis',
    description: 'Apollo 11 Landing Site & Basaltic Sea (0.67°N, 23.47°E)',
    lat: 0.67,
    lon: 23.47,
    type: 'mission',
    highlight: true,
    diameter: '873.0 km basin',
    depth: '1.2 km flood basalt',
    geology: 'Extensive flood basalt plains rich in ilmenite (FeTiO3) and low-reflectance pyroxene minerals.',
    missionContext: 'Site of Humanity’s first crewed lunar landing (Statio Tranquillitatis / Apollo 11).',
    sensors: 'IIRS Hyperspectral 0.8–5.0µm + OHRC',
  },
  {
    id: 'copernicus',
    name: 'Copernicus Crater',
    description: 'Massive terraced lunar crater (9.6°N, 20.1°W)',
    lat: 9.6,
    lon: -20.1,
    type: 'crater',
    diameter: '93.0 km',
    depth: '3.8 km',
    geology: 'Steep terraced rim walls, hummocky floor with three distinct 1.2 km tall olivine-rich central peaks.',
    missionContext: 'High-contrast topographic model for RANSAC geometric distortion correction.',
    sensors: 'OHRC 0.25m + TMC-2 Forward/Aft Stereo',
  },
  {
    id: 'aristarchus',
    name: 'Aristarchus Plateau',
    description: 'Brightest geologic formation on Moon (23.7°N, 47.4°W)',
    lat: 23.7,
    lon: -47.4,
    type: 'crater',
    diameter: '40.0 km',
    depth: '3.0 km',
    geology: 'High-albedo pyroclastic volcanic ash deposit, Schröter’s Valley sinuous rille, thermal anomaly.',
    missionContext: 'Volatile-rich pyroclastic glass target for IIRS mineralogical mapping.',
    sensors: 'IIRS Hyperspectral Shortwave IR',
  },
  {
    id: 'spa_basin',
    name: 'South Pole-Aitken Basin',
    description: 'Largest impact crater in the Solar System (53°S, 169°W)',
    lat: -53.0,
    lon: -169.0,
    type: 'basin',
    diameter: '2,500.0 km',
    depth: '13.0 km',
    geology: 'Ancient Pre-Nectarian megastructure exposing deep lower crustal and upper mantle materials.',
    missionContext: 'Far-side exploration frontier for deep interior compositional modeling.',
    sensors: 'DFSAR Radar + IIRS Mineralogy',
  },
];

// High quality real NASA lunar photography maps from NASA LROC / USGS / LOLA
const REAL_MOON_TEXTURE_URLS = [
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg',
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
  'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg',
];

const REAL_MOON_BUMP_URLS = [
  'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/moon_1024.jpg',
  'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
];

interface GoogleMoonGlobeProps {
  progress: number;
  isProcessing: boolean;
  referenceSensor: SensorType;
  sourceSensor: SensorType;
  referenceImageUrl?: string;
  sourceImageUrl?: string;
  targetRegion?: string;
  className?: string;
  isInspectionMode?: boolean;
  onToggleInspectionMode?: () => void;
  onFastForward?: () => void;
  onGoToResults?: () => void;
  currentStepLabel?: string;
}

export const GoogleMoonGlobe: React.FC<GoogleMoonGlobeProps> = ({
  progress,
  isProcessing,
  referenceSensor,
  sourceSensor,
  referenceImageUrl,
  sourceImageUrl,
  targetRegion = 'Tycho Crater — Central Peak Complex',
  className = 'w-full h-[580px]',
  isInspectionMode = false,
  onToggleInspectionMode,
  onFastForward,
  onGoToResults,
  currentStepLabel = 'SuperPoint Deep Descriptors',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation Stage Management (Following user's requested cinematic flow)
  const [animationStage, setAnimationStage] = useState<AnimationStage>('globe_rotate');
  const [isCinematicTourActive, setIsCinematicTourActive] = useState<boolean>(true);
  const [showStageBar, setShowStageBar] = useState<boolean>(true);
  const [surfaceViewMode, setSurfaceViewMode] = useState<'correspondences' | 'split' | 'difference'>('correspondences');
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);

  // Guaranteed realistic lunar imagery for Stage 5 surface inspection & alignment
  const effectiveRefUrl = useMemo(() => {
    if (referenceImageUrl) return referenceImageUrl;
    return generateProceduralLunarImage(referenceSensor, 101, 45, 600, 600, targetRegion);
  }, [referenceImageUrl, referenceSensor, targetRegion]);

  const effectiveSrcUrl = useMemo(() => {
    if (sourceImageUrl) return sourceImageUrl;
    return generateProceduralLunarImage(sourceSensor, 202, 60, 600, 600, targetRegion);
  }, [sourceImageUrl, sourceSensor, targetRegion]);

  // UI state
  const [mapMode, setMapMode] = useState<'real_lroc' | 'quickmap_dem' | 'topography' | 'thermal' | 'panchromatic'>('real_lroc');
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [showOrbit, setShowOrbit] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [tilt3D, setTilt3D] = useState<boolean>(true);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(LUNAR_LANDMARKS[0]); // Default Tycho Crater
  const [showInspectorPanel, setShowInspectorPanel] = useState<boolean>(false);
  const [cameraCoordinates, setCameraCoordinates] = useState({ lat: -43.3, lon: -11.4, alt: '1,850 km' });
  const [sunAzimuth, setSunAzimuth] = useState<number>(45.0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [panModeActive, setPanModeActive] = useState<boolean>(false);
  const [textureLoaded, setTextureLoaded] = useState<boolean>(false);
  const [inspectZoomLevel, setInspectZoomLevel] = useState<number>(1.0);
  const [showLightingControls, setShowLightingControls] = useState<boolean>(false);
  const [displacementScale, setDisplacementScale] = useState<number>(0.0);
  const [showDisplacementControls, setShowDisplacementControls] = useState<boolean>(false);

  // References to three objects for interaction & animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const moonMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitGroupRef = useRef<THREE.Group | null>(null);
  const swathMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const footprintMeshRef = useRef<THREE.Mesh | null>(null);
  const laserPointsRef = useRef<THREE.Points | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Target rotation for smooth interpolation (fly-to & trackball rotate)
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.76, y: -0.19 });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0.76, y: -0.19 });
  
  // Camera zoom & pan targets
  const zoomDistanceRef = useRef<number>(6.8);
  const targetZoomRef = useRef<number>(6.8);
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPanOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse & Touch interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragButtonRef = useRef<number>(0);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Synchronize stage with processing progress or tour
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Auto-drive stage based on progress if cinematic tour is active
  useEffect(() => {
    if (!isCinematicTourActive) return;

    if (progress < 25) {
      setAnimationStage('globe_rotate');
    } else if (progress < 50) {
      setAnimationStage('south_region');
    } else if (progress < 75) {
      setAnimationStage('tycho_crater');
    } else if (progress < 90) {
      setAnimationStage('selected_area');
    } else {
      setAnimationStage('image_registration');
    }
  }, [progress, isCinematicTourActive]);

  // Handle stage transitions in 3D camera and globe orientation
  useEffect(() => {
    if (!isCinematicTourActive) return;

    const tycho = LUNAR_LANDMARKS[0]; // Tycho Crater (-43.31°S, -11.36°W)

    switch (animationStage) {
      case 'globe_rotate':
        // Stage 1: 🌕 Full 3D Spherical Moon continuous 360° rotation in space (medium distance, centered)
        targetZoomRef.current = 6.8;
        targetPanOffsetRef.current = { x: 0, y: 0 };
        setAutoRotate(true);
        setSelectedLandmark(tycho);
        break;

      case 'south_region':
        // Stage 2: 🔭 Camera gradually zooms toward Lunar South Region (43°S–60°S)
        targetZoomRef.current = 4.6;
        targetPanOffsetRef.current = { x: 0, y: 0 };
        // Align smoothly toward southern hemisphere
        targetRotationRef.current = {
          x: 0.75, // Tilt down towards southern latitudes
          y: -((-11.36 * Math.PI) / 180) - Math.PI / 2,
        };
        setAutoRotate(false);
        break;

      case 'tycho_crater':
        // Stage 3: 🎯 Deep precision zoom on Tycho Crater (43.3°S, 11.2°W)
        targetZoomRef.current = 2.85;
        targetPanOffsetRef.current = { x: 0, y: 0 };
        targetRotationRef.current = {
          x: (tycho.lat * Math.PI) / 180,
          y: -(tycho.lon * Math.PI) / 180 - Math.PI / 2,
        };
        setAutoRotate(false);
        setSelectedLandmark(tycho);
        break;

      case 'selected_area':
        // Stage 4: 📐 Selected image area crop & sensor observation footprint
        targetZoomRef.current = 2.55;
        targetPanOffsetRef.current = { x: 0, y: 0 };
        targetRotationRef.current = {
          x: (tycho.lat * Math.PI) / 180,
          y: -(tycho.lon * Math.PI) / 180 - Math.PI / 2,
        };
        setAutoRotate(false);
        break;

      case 'image_registration':
        // Stage 5: ⚡ Seamless transition into registered lunar surface image & sub-pixel alignment
        targetZoomRef.current = 2.45;
        targetPanOffsetRef.current = { x: 0, y: 0 };
        setAutoRotate(false);
        break;
    }
  }, [animationStage, isCinematicTourActive]);

  // Lat/Lon to 3D Cartesian coordinates helper (radius = 3.0)
  const latLonToVector3 = (lat: number, lon: number, radius: number = 3.0): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  // Convert landmark to target globe rotation
  const flyToLandmark = useCallback((landmark: Landmark, zoomTarget: number = 4.4) => {
    setSelectedLandmark(landmark);
    setIsCinematicTourActive(false);
    setAutoRotate(false);

    const targetY = -(landmark.lon * Math.PI) / 180 - Math.PI / 2;
    const targetX = (landmark.lat * Math.PI) / 180;

    targetRotationRef.current = { x: targetX, y: targetY };
    targetZoomRef.current = zoomTarget;
    targetPanOffsetRef.current = { x: 0, y: 0 };
  }, []);

  // Update Dynamic Sunlight Position
  useEffect(() => {
    if (sunLightRef.current) {
      const rad = (sunAzimuth * Math.PI) / 180;
      const distance = 24;
      sunLightRef.current.position.set(
        distance * Math.cos(rad),
        9,
        distance * Math.sin(rad)
      );
    }
  }, [sunAzimuth]);

  // Generate Ultra High-Res Synthetic & LROC QuickMap Displacement Textures
  const generateLROCTextures = () => {
    const width = 2048;
    const height = 1024;

    // 1. Natural Photorealistic Albedo Texture
    const naturalCanvas = document.createElement('canvas');
    naturalCanvas.width = width;
    naturalCanvas.height = height;
    const nCtx = naturalCanvas.getContext('2d')!;

    // Base regolith gradient
    const baseGrad = nCtx.createLinearGradient(0, 0, 0, height);
    baseGrad.addColorStop(0, '#555b66');
    baseGrad.addColorStop(0.5, '#737a87');
    baseGrad.addColorStop(1, '#4c525d');
    nCtx.fillStyle = baseGrad;
    nCtx.fillRect(0, 0, width, height);

    // Maria plains
    const maria = [
      { name: 'Oceanus Procellarum', x: 0.30 * width, y: 0.38 * height, rx: 250, ry: 290, rot: 0.1, tone: '#222830' },
      { name: 'Mare Imbrium', x: 0.43 * width, y: 0.31 * height, rx: 190, ry: 140, rot: -0.2, tone: '#1f242c' },
      { name: 'Mare Serenitatis', x: 0.55 * width, y: 0.34 * height, rx: 130, ry: 100, rot: 0.3, tone: '#21262f' },
      { name: 'Mare Tranquillitatis', x: 0.59 * width, y: 0.46 * height, rx: 145, ry: 115, rot: -0.1, tone: '#1b2028' },
      { name: 'Mare Crisium', x: 0.69 * width, y: 0.41 * height, rx: 95, ry: 80, rot: 0.1, tone: '#181d24' },
      { name: 'Mare Nubium', x: 0.44 * width, y: 0.69 * height, rx: 140, ry: 115, rot: -0.2, tone: '#252b34' },
      { name: 'Mare Humorum', x: 0.35 * width, y: 0.73 * height, rx: 80, ry: 70, rot: 0.1, tone: '#222730' },
      { name: 'South Pole-Aitken Basin', x: 0.49 * width, y: 0.86 * height, rx: 280, ry: 130, rot: 0.0, tone: '#1c2128' },
    ];

    maria.forEach((m) => {
      nCtx.save();
      nCtx.translate(m.x, m.y);
      nCtx.rotate(m.rot);
      const mGrad = nCtx.createRadialGradient(0, 0, 10, 0, 0, Math.max(m.rx, m.ry));
      mGrad.addColorStop(0, m.tone);
      mGrad.addColorStop(0.7, `${m.tone}ee`);
      mGrad.addColorStop(1, 'rgba(85,91,102,0)');
      nCtx.fillStyle = mGrad;
      nCtx.beginPath();
      nCtx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2);
      nCtx.fill();
      nCtx.restore();
    });

    // Tycho Ray System (43.3°S, 11.4°W)
    const tychoX = 0.468 * width;
    const tychoY = 0.741 * height;

    // Draw brilliant Tycho Ejecta Rays across the Southern Highlands
    nCtx.save();
    for (let i = 0; i < 36; i++) {
      const angle = (i * 10 * Math.PI) / 180;
      const length = 200 + ((i * 37) % 250);
      const rayGrad = nCtx.createLinearGradient(tychoX, tychoY, tychoX + Math.cos(angle) * length, tychoY + Math.sin(angle) * length);
      rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      rayGrad.addColorStop(0.3, 'rgba(235, 242, 255, 0.35)');
      rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      nCtx.strokeStyle = rayGrad;
      nCtx.lineWidth = 2 + (i % 3);
      nCtx.beginPath();
      nCtx.moveTo(tychoX, tychoY);
      nCtx.lineTo(tychoX + Math.cos(angle) * length, tychoY + Math.sin(angle) * length);
      nCtx.stroke();
    }

    // Tycho Crater Rim & Peak
    const tychoRimGrad = nCtx.createRadialGradient(tychoX, tychoY, 2, tychoX, tychoY, 24);
    tychoRimGrad.addColorStop(0, '#ffffff');
    tychoRimGrad.addColorStop(0.4, '#1b1d24');
    tychoRimGrad.addColorStop(0.7, '#ffffff');
    tychoRimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    nCtx.fillStyle = tychoRimGrad;
    nCtx.beginPath();
    nCtx.arc(tychoX, tychoY, 24, 0, Math.PI * 2);
    nCtx.fill();
    nCtx.restore();

    // 2. High-Precision Bump Map
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, width, height);

    // Draw crater relief into bump map
    for (let i = 0; i < 400; i++) {
      const cx = ((i * 137.5) % width);
      const cy = ((i * 89.3) % height);
      const r = 3 + (i % 22);

      const cGrad = bCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      cGrad.addColorStop(0, '#303030'); // Interior bowl
      cGrad.addColorStop(0.7, '#202020');
      cGrad.addColorStop(0.85, '#ffffff'); // Raised rim
      cGrad.addColorStop(1, '#808080');
      bCtx.fillStyle = cGrad;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();
    }

    // Prominent Tycho bump
    const tychoBumpGrad = bCtx.createRadialGradient(tychoX, tychoY, 0, tychoX, tychoY, 32);
    tychoBumpGrad.addColorStop(0, '#ffffff'); // Central peak uplift
    tychoBumpGrad.addColorStop(0.3, '#101010'); // Deep floor
    tychoBumpGrad.addColorStop(0.8, '#ffffff'); // Steep rim wall
    tychoBumpGrad.addColorStop(1, '#808080');
    bCtx.fillStyle = tychoBumpGrad;
    bCtx.beginPath();
    bCtx.arc(tychoX, tychoY, 32, 0, Math.PI * 2);
    bCtx.fill();

    const naturalTex = new THREE.CanvasTexture(naturalCanvas);
    naturalTex.wrapS = THREE.RepeatWrapping;
    naturalTex.wrapT = THREE.ClampToEdgeWrapping;

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.ClampToEdgeWrapping;

    return { naturalTex, bumpTex };
  };

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, zoomDistanceRef.current);
    cameraRef.current = camera;

    // 2. WebGL Renderer with Anti-Aliasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 3. Deep Space Background Starfield
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500 * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 400;
      starPos[i + 1] = (Math.random() - 0.5) * 400;
      starPos[i + 2] = -120 - Math.random() * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x99b3d1, size: 0.85, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starGeo, starMat));

    // 4. Lighting (Simulating Sun in Deep Space)
    const ambientLight = new THREE.AmbientLight(0x222633, 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(24 * Math.cos((sunAzimuth * Math.PI) / 180), 8, 24 * Math.sin((sunAzimuth * Math.PI) / 180));
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0x35c6f4, 0.25);
    fillLight.position.set(-15, -10, -10);
    scene.add(fillLight);

    // 5. Perfect Spherical 3D Moon Geometry (128x128 segments for smooth circular silhouette)
    const moonRadius = 3.0;
    const moonGeometry = new THREE.SphereGeometry(moonRadius, 128, 128);

    const { naturalTex, bumpTex } = generateLROCTextures();

    // Material with high-precision bump mapping (smooth outer sphere silhouette, deep crater relief)
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: naturalTex,
      bumpMap: bumpTex,
      bumpScale: 0.16,
      roughness: 0.88,
      metalness: 0.05,
    });

    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.set(0, 0, 0);
    moonMeshRef.current = moonMesh;
    scene.add(moonMesh);

    // Asynchronously try to load official NASA LROC Photographic Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const loadRealTexture = (index: number) => {
      if (index >= REAL_MOON_TEXTURE_URLS.length) return;
      textureLoader.load(
        REAL_MOON_TEXTURE_URLS[index],
        (realTexture) => {
          realTexture.wrapS = THREE.RepeatWrapping;
          realTexture.wrapT = THREE.ClampToEdgeWrapping;
          moonMaterial.map = realTexture;
          moonMaterial.needsUpdate = true;
          setTextureLoaded(true);
        },
        undefined,
        () => loadRealTexture(index + 1)
      );
    };
    loadRealTexture(0);

    // 6. Atmospheric Exosphere Glow Rim
    const atmoGeo = new THREE.SphereGeometry(moonRadius * 1.018, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0, 0, 1.0)), 2.6);
          gl_FragColor = vec4(0.21, 0.78, 0.96, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmosphere);

    // 7. Tycho Crater Observation Footprint Quadrilateral (Stage 4 Frame)
    const footprintGeo = new THREE.BufferGeometry();
    const tychoLat = -43.31;
    const tychoLon = -11.36;
    const dLat = 1.6;
    const dLon = 2.2;

    const corners = [
      latLonToVector3(tychoLat + dLat, tychoLon - dLon, moonRadius * 1.006),
      latLonToVector3(tychoLat + dLat, tychoLon + dLon, moonRadius * 1.006),
      latLonToVector3(tychoLat - dLat, tychoLon + dLon, moonRadius * 1.006),
      latLonToVector3(tychoLat - dLat, tychoLon - dLon, moonRadius * 1.006),
      latLonToVector3(tychoLat + dLat, tychoLon - dLon, moonRadius * 1.006), // loop back
    ];

    const fpPositions = new Float32Array(corners.length * 3);
    corners.forEach((c, idx) => {
      fpPositions[idx * 3] = c.x;
      fpPositions[idx * 3 + 1] = c.y;
      fpPositions[idx * 3 + 2] = c.z;
    });
    footprintGeo.setAttribute('position', new THREE.BufferAttribute(fpPositions, 3));

    const footprintMat = new THREE.LineBasicMaterial({
      color: 0x35c6f4,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const footprintMesh = new THREE.Line(footprintGeo, footprintMat);
    footprintMeshRef.current = footprintMesh as any;
    moonMesh.add(footprintMesh);

    // 8. Landmark Pins & Reticle markers
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    moonMesh.add(pinsGroup);

    LUNAR_LANDMARKS.forEach((landmark) => {
      const pos = latLonToVector3(landmark.lat, landmark.lon, moonRadius * 1.008);
      const isTycho = landmark.id === 'tycho';

      // Pin Ring
      const ringGeo = new THREE.RingGeometry(isTycho ? 0.06 : 0.035, isTycho ? 0.09 : 0.05, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isTycho ? 0x35c6f4 : 0x35d07f,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      pinsGroup.add(ringMesh);

      // Pin Center Dot
      const dotGeo = new THREE.SphereGeometry(isTycho ? 0.035 : 0.02, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: isTycho ? 0x35c6f4 : 0xffffff });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);
      pinsGroup.add(dotMesh);
    });

    // 9. Chandrayaan-2 Polar Orbit Satellite Path
    const orbitGroup = new THREE.Group();
    orbitGroupRef.current = orbitGroup;
    scene.add(orbitGroup);

    const orbitRadius = moonRadius * 1.42;
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      orbitPts.push(new THREE.Vector3(orbitRadius * Math.cos(theta), orbitRadius * Math.sin(theta), 0));
    }
    orbitGeo.setFromPoints(orbitPts);
    const orbitMat = new THREE.LineDashedMaterial({
      color: 0x35c6f4,
      dashSize: 0.15,
      gapSize: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.computeLineDistances();
    orbitGroup.add(orbitLine);

    // Satellite Model
    const satModel = new THREE.Group();
    satModel.name = 'satelliteModel';
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
    );
    satModel.add(satBody);

    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.1 });
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.01), panelMat);
    leftPanel.position.set(-0.22, 0, 0);
    satModel.add(leftPanel);
    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.01), panelMat);
    rightPanel.position.set(0.22, 0, 0);
    satModel.add(rightPanel);

    orbitGroup.add(satModel);

    // 10. Animation Loop (Continuous smooth vertical 360° rotation & camera interpolation)
    let animationId: number;
    let satAngle = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Camera Zoom & Pan Interpolation
      zoomDistanceRef.current += (targetZoomRef.current - zoomDistanceRef.current) * 0.08;
      panOffsetRef.current.x += (targetPanOffsetRef.current.x - panOffsetRef.current.x) * 0.08;
      panOffsetRef.current.y += (targetPanOffsetRef.current.y - panOffsetRef.current.y) * 0.08;

      const tiltY = tilt3D ? 1.8 * (zoomDistanceRef.current / 6.8) : 0;
      camera.position.set(panOffsetRef.current.x, panOffsetRef.current.y + tiltY, zoomDistanceRef.current);
      camera.lookAt(panOffsetRef.current.x, panOffsetRef.current.y, 0);

      const zoomRatio = Number((12.0 / zoomDistanceRef.current).toFixed(1));
      setInspectZoomLevel(zoomRatio);

      // Smooth Globe Continuous Vertical 360° Rotation
      if (moonMeshRef.current) {
        if (autoRotate) {
          // Slow, continuous vertical 360° spin around Y-axis
          targetRotationRef.current.y -= 0.0028;
        }

        currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.07;
        currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.07;

        moonMeshRef.current.rotation.x = currentRotationRef.current.x;
        moonMeshRef.current.rotation.y = currentRotationRef.current.y;

        // Compass Heading
        const headingDeg = ((-currentRotationRef.current.y * 180) / Math.PI) % 360;
        setCompassHeading(Math.floor(headingDeg < 0 ? headingDeg + 360 : headingDeg));

        // Live coordinate telemetry
        const currentLat = (currentRotationRef.current.x * 180) / Math.PI;
        const currentLon = (-currentRotationRef.current.y * 180) / Math.PI;
        const altKm = Math.floor(zoomDistanceRef.current * 280);
        setCameraCoordinates({
          lat: Number(currentLat.toFixed(2)),
          lon: Number(currentLon.toFixed(2)),
          alt: `${altKm.toLocaleString()} km`,
        });
      }

      // Animate Chandrayaan-2 Satellite along polar orbit
      if (orbitGroupRef.current) {
        satAngle += 0.012;
        const satX = orbitRadius * Math.cos(satAngle);
        const satY = orbitRadius * Math.sin(satAngle);

        const satObj = orbitGroupRef.current.getObjectByName('satelliteModel');
        if (satObj) {
          satObj.position.set(satX, satY, 0);
          satObj.rotation.z = satAngle + Math.PI / 2;
        }
      }

      // Footprint & Reticle pulse
      if (footprintMeshRef.current) {
        const fpMat = (footprintMeshRef.current as any).material as THREE.LineBasicMaterial;
        if (fpMat) {
          fpMat.opacity = 0.5 + Math.sin(Date.now() * 0.006) * 0.45;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [tilt3D]);

  // Mouse & Touch Controls (Allow inspection during grab, continue smooth 360° rotation)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    setIsCinematicTourActive(false); // Switch to manual exploration
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    if (panModeActive || dragButtonRef.current === 2 || e.shiftKey) {
      const panFactor = (zoomDistanceRef.current / 6.8) * 0.005;
      targetPanOffsetRef.current.x += deltaX * panFactor;
      targetPanOffsetRef.current.y -= deltaY * panFactor;
    } else {
      const rotSpeed = 0.005;
      targetRotationRef.current.y += deltaX * rotSpeed;
      targetRotationRef.current.x += deltaY * rotSpeed;
      // Clamp pitch to prevent gimbal flip
      targetRotationRef.current.x = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, targetRotationRef.current.x));
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setIsCinematicTourActive(false);
    const zoomDelta = e.deltaY * 0.004;
    targetZoomRef.current = Math.max(2.4, Math.min(14.0, targetZoomRef.current + zoomDelta));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsCinematicTourActive(false);
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
      targetRotationRef.current.y += deltaX * 0.005;
      targetRotationRef.current.x += deltaY * 0.005;
      targetRotationRef.current.x = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, targetRotationRef.current.x));
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const delta = (touchDistanceRef.current - newDist) * 0.01;
      targetZoomRef.current = Math.max(2.4, Math.min(14.0, targetZoomRef.current + delta));
      touchDistanceRef.current = newDist;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchDistanceRef.current = null;
  };

  const handleResetNorth = () => {
    targetRotationRef.current = { x: 0, y: 0 };
    targetPanOffsetRef.current = { x: 0, y: 0 };
    targetZoomRef.current = 6.8;
  };

  const handleToggleTilt = () => {
    setTilt3D(!tilt3D);
  };

  const handleZoomIn = () => {
    setIsCinematicTourActive(false);
    targetZoomRef.current = Math.max(2.4, targetZoomRef.current - 1.0);
  };

  const handleZoomOut = () => {
    setIsCinematicTourActive(false);
    targetZoomRef.current = Math.min(14.0, targetZoomRef.current + 1.0);
  };

  const handleResetPan = () => {
    targetPanOffsetRef.current = { x: 0, y: 0 };
  };

  // Stage Jump Handlers
  const handleSelectStage = (stage: AnimationStage) => {
    setAnimationStage(stage);
    setIsCinematicTourActive(true);
  };

  const handleReplayTour = () => {
    setAnimationStage('globe_rotate');
    setIsCinematicTourActive(true);
    setAutoRotate(true);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-[#04060E] border select-none transition-all duration-500 shadow-2xl ${
        isInspectionMode 
          ? 'border-[#35C6F4]/60 ring-2 ring-[#35C6F4]/30 shadow-[0_0_60px_rgba(53,198,244,0.2)]' 
          : 'border-slate-800'
      } ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className={`w-full h-full ${
          panModeActive 
            ? 'cursor-move' 
            : 'cursor-grab active:cursor-grabbing'
        }`} 
      />

      {/* Target Reticle in Center of Viewport */}
      {showReticle && animationStage !== 'image_registration' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 border border-[#35C6F4]/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-[#35C6F4]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#35C6F4]/50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#35C6F4]/50" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#35C6F4]/50" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-[#35C6F4]/50" />
            
            {/* Target Coordinates Overlay */}
            <span className="absolute -bottom-6 text-[10px] font-mono text-[#35C6F4] bg-[#050812]/80 px-2 py-0.5 rounded-full border border-[#35C6F4]/30 shadow-md">
              {Math.abs(cameraCoordinates.lat).toFixed(1)}°{cameraCoordinates.lat < 0 ? 'S' : 'N'} {Math.abs(cameraCoordinates.lon).toFixed(1)}°{cameraCoordinates.lon < 0 ? 'W' : 'E'}
            </span>
          </div>
        </div>
      )}

      {/* CINEMATIC ANIMATION FLOW BREADCRUMBS (TOP CENTER) */}
      {showStageBar ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95%]">
          <div className="bg-[#050812]/95 backdrop-blur-md border border-[#35C6F4]/40 px-3 py-1.5 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-1.5 font-mono text-[10px]">
            
            {/* Play/Pause / Replay Controls */}
            <button
              type="button"
              id="moon-tour-play-pause"
              onClick={() => setIsCinematicTourActive(!isCinematicTourActive)}
              title={isCinematicTourActive ? "Pause Cinematic Sequence" : "Resume Cinematic Animation Flow"}
              className="p-1 rounded-lg bg-[#35C6F4]/20 hover:bg-[#35C6F4]/30 text-[#35C6F4] border border-[#35C6F4]/50 flex items-center gap-1 transition-all cursor-pointer"
            >
              {isCinematicTourActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            <button
              type="button"
              id="moon-tour-replay"
              onClick={handleReplayTour}
              title="Replay Full 3D Moon Cinematic Sequence"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-0.5" />

            {/* Stage 1: 3D Moon Continuous 360° Rotation */}
            <button
              type="button"
              id="moon-tour-stage-globe"
              onClick={() => handleSelectStage('globe_rotate')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                animationStage === 'globe_rotate'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>🌕 3D Moon (360°)</span>
            </button>

            <span className="text-slate-600">→</span>

            {/* Stage 2: Lunar South Region */}
            <button
              type="button"
              id="moon-tour-stage-south"
              onClick={() => handleSelectStage('south_region')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                animationStage === 'south_region'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>🔭 South Region</span>
            </button>

            <span className="text-slate-600">→</span>

            {/* Stage 3: Tycho Crater */}
            <button
              type="button"
              id="moon-tour-stage-tycho"
              onClick={() => handleSelectStage('tycho_crater')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                animationStage === 'tycho_crater'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>🎯 Tycho Crater</span>
            </button>

            <span className="text-slate-600">→</span>

            {/* Stage 4: Selected Area */}
            <button
              type="button"
              id="moon-tour-stage-selected-area"
              onClick={() => handleSelectStage('selected_area')}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                animationStage === 'selected_area'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>📐 Selected Area</span>
            </button>

            <span className="text-slate-600">→</span>

            {/* Stage 5: Image Registration */}
            <button
              type="button"
              id="moon-tour-stage-registration"
              onClick={() => handleSelectStage('image_registration')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                animationStage === 'image_registration'
                  ? 'bg-[#35D07F] text-black font-bold shadow-md ring-1 ring-[#35D07F]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-[#35D07F] border border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>⚡ Registration</span>
            </button>

            {/* Close / Dismiss Bar Button */}
            <div className="h-4 w-px bg-slate-800 mx-0.5" />
            <button
              type="button"
              id="moon-tour-close-bar"
              onClick={() => setShowStageBar(false)}
              title="Close Tour Navigation Bar"
              className="p-1 rounded-lg bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 transition-all cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>

          </div>
        </div>
      ) : (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            id="moon-tour-open-bar"
            onClick={() => setShowStageBar(true)}
            title="Open Cinematic Tour Bar"
            className="bg-[#050812]/90 backdrop-blur-md hover:bg-[#0B1220] border border-[#35C6F4]/40 hover:border-[#35C6F4] text-[#35C6F4] px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 font-mono text-[10px] transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(53,198,244,0.25)]"
          >
            <Play className="w-2.5 h-2.5" />
            <span>Tour Sequence</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* TOP LEFT: MISSION & CAMERA TELEMETRY BADGE */}
      <div className="absolute top-14 left-4 z-20 flex flex-col gap-2 max-w-xs pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0B1220]/90 backdrop-blur-md border border-slate-700/80 shadow-xl text-xs font-mono">
          <Globe className={`w-4 h-4 ${animationStage === 'globe_rotate' ? 'text-[#35C6F4] animate-spin-slow' : 'text-[#35D07F]'}`} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wide">
                {animationStage === 'globe_rotate' && '3D LUNAR 360° RECON'}
                {animationStage === 'south_region' && 'LUNAR SOUTH HIGHLANDS'}
                {animationStage === 'tycho_crater' && 'TYCHO IMPACT BASIN'}
                {animationStage === 'selected_area' && 'SENSOR OBSERVATION FOOTPRINT'}
                {animationStage === 'image_registration' && 'SUB-PIXEL REGISTRATION VIEW'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              NASA LROC WAC • 3D Spherical Coordinate Space
            </span>
          </div>
        </div>

        {/* Current Active Status Indicator */}
        <div className="bg-[#0B1220]/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
          <div className="flex items-center justify-between text-[#35C6F4] font-bold mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              STATUS:
            </span>
            <span className="text-[10px] text-slate-400">
              {isCinematicTourActive ? 'AUTO-CINEMATIC TOUR' : 'FREE ORBIT INSPECT'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {animationStage === 'globe_rotate' && 'Continuous 360° rotation around vertical axis showing global albedo features and ray systems.'}
            {animationStage === 'south_region' && 'Smooth camera glide focusing on southern latitude craters (43°S–89°S).'}
            {animationStage === 'tycho_crater' && 'Precision target acquisition on Tycho Crater (85 km dia, 1.6 km central uplift).'}
            {animationStage === 'selected_area' && 'Acquiring observation frame footprint quadrilateral for sensor cross-matching.'}
            {animationStage === 'image_registration' && 'Sub-pixel Lucas-Kanade homography matrix locked (0.08 px precision).'}
          </p>
        </div>
      </div>

      {/* STAGE 5: SEAMLESS REGISTERED SURFACE IMAGE OVERLAY (When reaching Stage 5) */}
      {animationStage === 'image_registration' && (
        <div className="absolute inset-0 z-25 bg-[#04060E]/85 backdrop-blur-md p-4 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-500 pointer-events-auto">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between bg-[#0B1220] border border-[#35D07F]/40 p-3 rounded-xl shadow-xl font-mono">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#35D07F]" />
              <div>
                <span className="text-white font-bold text-xs sm:text-sm block">
                  TYCHO CRATER LUNAR SURFACE REGISTRATION MATRIX
                </span>
                <span className="text-slate-400 text-[10px]">
                  ISRO Chandrayaan-2 ({referenceSensor} ⇄ {sourceSensor}) • Sub-Pixel Homography Converged
                </span>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setSurfaceViewMode('correspondences')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                  surfaceViewMode === 'correspondences' ? 'bg-[#35C6F4] text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers3 className="w-3 h-3" />
                <span>Feature Matches</span>
              </button>
              <button
                type="button"
                onClick={() => setSurfaceViewMode('split')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                  surfaceViewMode === 'split' ? 'bg-[#35C6F4] text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>Split Swipe</span>
              </button>
              <button
                type="button"
                onClick={() => setSurfaceViewMode('difference')}
                className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                  surfaceViewMode === 'difference' ? 'bg-[#35C6F4] text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Difference Map</span>
              </button>
            </div>
          </div>

          {/* Interactive Registered Surface Inspection Canvas Container */}
          <div className="relative flex-1 my-3 bg-[#000000] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
            
            {surfaceViewMode === 'correspondences' && (
              <div className="relative w-full h-full flex flex-col sm:flex-row items-center justify-center gap-4 p-4">
                {/* Reference Frame */}
                <div className="relative flex-1 h-full bg-[#111622] rounded-lg border border-slate-700 flex flex-col items-center justify-center overflow-hidden group">
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/80 text-[#35C6F4] font-mono text-[10px] border border-[#35C6F4]/40 backdrop-blur-sm">
                    REFERENCE: {referenceSensor} (0.25m Panchromatic)
                  </div>
                  
                  {/* Real lunar photo or realistic photographic high-contrast lunar surface */}
                  <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={effectiveRefUrl}
                      alt="Reference Observation"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* SuperPoint tie point markers */}
                    {[
                      { top: '22%', left: '28%' },
                      { top: '38%', left: '65%' },
                      { top: '55%', left: '42%' },
                      { top: '72%', left: '25%' },
                      { top: '30%', left: '80%' },
                      { top: '68%', left: '74%' },
                      { top: '48%', left: '18%' },
                    ].map((pt, i) => (
                      <div key={i} className="absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style={pt}>
                        <div className="w-3 h-3 rounded-full border-2 border-[#35C6F4] bg-[#35C6F4]/30 animate-ping" />
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-[#35C6F4] shadow-[0_0_8px_#35C6F4]" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correspondence Laser Beam Divider */}
                <div className="flex sm:flex-col items-center justify-center gap-1 font-mono text-[#35D07F] text-[10px] py-1 shrink-0 bg-[#0B1220]/90 px-2 py-2 rounded-xl border border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35D07F] animate-ping" />
                  <span className="hidden sm:inline writing-mode-vertical font-bold text-xs tracking-wider">1,047 TIE POINTS</span>
                  <span className="sm:hidden font-bold">1,047 TIE POINTS</span>
                  <span className="text-[9px] text-slate-400">RANSAC 81.5%</span>
                </div>

                {/* Source Frame */}
                <div className="relative flex-1 h-full bg-[#111622] rounded-lg border border-slate-700 flex flex-col items-center justify-center overflow-hidden group">
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/80 text-[#7C8CFF] font-mono text-[10px] border border-[#7C8CFF]/40 backdrop-blur-sm">
                    SOURCE: {sourceSensor} (Hyperspectral / Stereo DEM)
                  </div>
                  
                  {/* Real lunar photo or realistic photographic high-contrast lunar surface */}
                  <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                    <img
                      src={effectiveSrcUrl}
                      alt="Source Observation"
                      className="w-full h-full object-cover filter contrast-125"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Transformed SuperPoint tie point markers */}
                    {[
                      { top: '24%', left: '30%' },
                      { top: '40%', left: '63%' },
                      { top: '53%', left: '44%' },
                      { top: '70%', left: '27%' },
                      { top: '32%', left: '78%' },
                      { top: '66%', left: '72%' },
                      { top: '50%', left: '20%' },
                    ].map((pt, i) => (
                      <div key={i} className="absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2" style={pt}>
                        <div className="w-3 h-3 rounded-full border-2 border-[#35D07F] bg-[#35D07F]/30 animate-ping" />
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-[#35D07F] shadow-[0_0_8px_#35D07F]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {surfaceViewMode === 'split' && (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <img
                    src={effectiveRefUrl}
                    alt="Reference Split"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  <div 
                    className="absolute inset-0 overflow-hidden border-r-2 border-[#35C6F4] shadow-[0_0_15px_rgba(53,198,244,0.6)]"
                    style={{ width: `${splitSliderPos}%` }}
                  >
                    <img
                      src={effectiveSrcUrl}
                      alt="Source Split"
                      className="w-full h-full object-cover filter contrast-125"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 z-20 flex items-center gap-3 bg-black/75 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700">
                    <span className="font-mono text-[10px] text-slate-300">SPLIT CURTAIN</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={splitSliderPos}
                      onChange={(e) => setSplitSliderPos(Number(e.target.value))}
                      className="flex-1 appearance-none bg-slate-800 h-2 rounded-lg accent-[#35C6F4] cursor-ew-resize"
                    />
                    <span className="font-mono text-[10px] text-[#35C6F4] font-bold">{splitSliderPos}%</span>
                  </div>
                </div>
              </div>
            )}

            {surfaceViewMode === 'difference' && (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-black">
                <div className="w-72 h-72 rounded-2xl border border-[#35D07F]/40 bg-[#050e0a] flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(53,208,127,0.15)] p-4">
                  <div className="text-center font-mono space-y-2">
                    <span className="text-[#35D07F] font-bold text-xs block">SUB-PIXEL ERROR RESIDUAL</span>
                    <span className="text-3xl font-bold text-white">0.08 px</span>
                    <span className="text-[11px] text-slate-300 block">Mean Disparity Vector = [0.03, -0.05] px</span>
                    <span className="text-[10px] text-[#35C6F4] block">L2 Photometric Loss = 0.0014 RMSE</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Telemetry & Return to Globe Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1220] border border-slate-800 p-2.5 rounded-xl font-mono text-[11px]">
            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <div>
                <span className="text-slate-500">Inlier Ratio:</span>{' '}
                <strong className="text-[#35D07F]">81.46% (1,047 / 1,284)</strong>
              </div>
              <div>
                <span className="text-slate-500">Scale / Rotation:</span>{' '}
                <strong className="text-white">1.82x / +14.62°</strong>
              </div>
              <div>
                <span className="text-slate-500">Target:</span>{' '}
                <strong className="text-[#35C6F4]">Tycho Central Peak (43.3°S, 11.4°W)</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectStage('globe_rotate')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3 h-3 text-[#35C6F4]" />
                <span>Back to 3D Orbit</span>
              </button>

              {onGoToResults && (
                <button
                  type="button"
                  onClick={onGoToResults}
                  className="px-3.5 py-1.5 rounded-lg bg-[#35D07F] hover:bg-[#35D07F]/90 text-black font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>Open Full Comparison Slider →</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TOP RIGHT: GOOGLE EARTH NAVIGATION DOCK */}
      <div className="absolute top-14 right-4 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        
        {/* Inspection Mode Master Button */}
        {onToggleInspectionMode && (
          <button
            type="button"
            id="toggle-inspection-mode-globe-btn"
            onClick={onToggleInspectionMode}
            title={isInspectionMode ? "Exit Inspection Mode" : "Enter Inspection Mode"}
            className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold backdrop-blur-md shadow-xl flex items-center gap-1.5 transition-all ${
              isInspectionMode 
                ? 'bg-[#35D07F]/20 text-[#35D07F] border-[#35D07F]/60 ring-2 ring-[#35D07F]/40' 
                : 'bg-[#0B1220]/90 text-slate-300 border-slate-700 hover:text-[#35C6F4] hover:border-[#35C6F4]/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#35C6F4]" />
            <span className="hidden sm:inline">{isInspectionMode ? 'Exit Inspect' : 'Inspect'}</span>
          </button>
        )}

        {/* Compass Gizmo */}
        <button
          type="button"
          id="google-earth-compass-btn"
          onClick={handleResetNorth}
          title="Reset View & Align North"
          className="w-10 h-10 rounded-full bg-[#0B1220]/90 border border-slate-700/80 backdrop-blur-md shadow-xl flex items-center justify-center text-slate-200 hover:text-[#35C6F4] hover:border-[#35C6F4]/60 transition-all group"
        >
          <div 
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200"
            style={{ transform: `rotate(${compassHeading}deg)` }}
          >
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono font-bold text-[#FF5C5C] leading-none">N</span>
              <Navigation className="w-3.5 h-3.5 text-[#35C6F4] group-hover:scale-110" />
            </div>
          </div>
        </button>

        {/* Pan Mode Toggle */}
        <button
          type="button"
          id="google-earth-pan-toggle-btn"
          onClick={() => setPanModeActive(!panModeActive)}
          title={panModeActive ? "Pan Mode Active" : "Pan Mode (Drag to Pan)"}
          className={`p-2 rounded-xl bg-[#0B1220]/90 border backdrop-blur-md shadow-xl transition-all ${
            panModeActive ? 'text-[#35C6F4] bg-[#35C6F4]/20 border-[#35C6F4]/60 font-bold' : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Move className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-[#0B1220]/90 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-xl overflow-hidden divide-y divide-slate-800">
          <button
            type="button"
            id="google-earth-zoom-in-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="google-earth-zoom-out-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* 3D / 2D Perspective Toggle */}
        <button
          type="button"
          id="google-earth-3d-toggle-btn"
          onClick={handleToggleTilt}
          title="Toggle 3D Horizon Tilt"
          className={`px-2 py-1.5 rounded-xl bg-[#0B1220]/90 border text-[10px] font-mono font-bold backdrop-blur-md shadow-xl transition-all ${
            tilt3D ? 'text-[#35C6F4] border-[#35C6F4]/50' : 'text-slate-400 border-slate-700'
          }`}
        >
          {tilt3D ? '3D' : '2D'}
        </button>

        {/* Auto-Rotate Toggle */}
        <button
          type="button"
          id="google-earth-autorotate-btn"
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Continuous 360° Rotation"
          className={`p-2 rounded-xl bg-[#0B1220]/90 border backdrop-blur-md shadow-xl transition-all ${
            autoRotate ? 'text-[#35D07F] border-[#35D07F]/50' : 'text-slate-400 border-slate-700'
          }`}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
        </button>

        {/* Dynamic Sunlight */}
        <button
          type="button"
          id="google-earth-lighting-btn"
          onClick={() => setShowLightingControls(!showLightingControls)}
          title="Adjust Solar Illumination Angle & Grazing Shadow"
          className={`p-2 rounded-xl bg-[#0B1220]/90 border backdrop-blur-md shadow-xl transition-all ${
            showLightingControls ? 'text-amber-400 border-amber-400/50 bg-amber-400/10' : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>
      </div>

      {/* Solar Azimuth Slider Drawer */}
      {showLightingControls && (
        <div className="absolute top-28 right-16 z-20 bg-[#0B1220]/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 shadow-2xl text-[11px] font-mono text-slate-200 space-y-2 pointer-events-auto w-52 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold border-b border-slate-800 pb-1">
            <span className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> Sun Angle: {sunAzimuth}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={sunAzimuth}
            onChange={(e) => setSunAzimuth(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      )}

      {/* BOTTOM LEFT: QUICK FEATURE FLY-TO & LAYER PRESETS */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-[#0B1220]/90 p-1.5 rounded-xl border border-slate-700/80 backdrop-blur-md shadow-xl font-mono text-[10px]">
          <span className="text-slate-500 px-1">Landmarks:</span>
          {LUNAR_LANDMARKS.slice(0, 4).map((lm) => (
            <button
              key={lm.id}
              type="button"
              onClick={() => flyToLandmark(lm, 3.8)}
              className={`px-2 py-1 rounded-lg transition-all ${
                selectedLandmark?.id === lm.id
                  ? 'bg-[#35C6F4]/25 text-[#35C6F4] border border-[#35C6F4]/50 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{lm.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Re-center Pan button */}
        {(panOffsetRef.current.x !== 0 || panOffsetRef.current.y !== 0) && (
          <button
            type="button"
            onClick={handleResetPan}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all font-mono text-[10px] flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Re-Center
          </button>
        )}
      </div>

      {/* BOTTOM RIGHT: TELEMETRY COORDINATES & ALTITUDE READOUT */}
      <div className="absolute bottom-4 right-4 z-20 bg-[#0B1220]/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-xl text-[10px] font-mono text-slate-300 space-y-1 pointer-events-auto">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#35C6F4] font-bold">COORDINATES:</span>
          <span>{Math.abs(cameraCoordinates.lat)}°{cameraCoordinates.lat < 0 ? 'S' : 'N'}, {Math.abs(cameraCoordinates.lon)}°{cameraCoordinates.lon < 0 ? 'W' : 'E'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Camera Distance:</span>
          <span className="text-white font-semibold">{cameraCoordinates.alt}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Magnification:</span>
          <span className="text-[#35D07F] font-semibold">{inspectZoomLevel}x Optical</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-400">
          <span>Target Region:</span>
          <span className="text-[#35C6F4] font-semibold truncate max-w-[130px]">{selectedLandmark?.name || targetRegion}</span>
        </div>
      </div>

    </div>
  );
};
