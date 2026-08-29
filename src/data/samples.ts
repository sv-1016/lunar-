import { SensorType, LunarRegionInfo } from '../types';
import { generateProceduralLunarImage } from '../utils/lunarImageGenerator';

export interface SampleObservationPair {
  id: string;
  name: string;
  region: string;
  coordinates: string;
  referenceSensor: SensorType;
  sourceSensor: SensorType;
  description: string;
  sunAngleRef: number;
  sunAngleSrc: number;
  expectedRmse: number;
  expectedMatches: number;
  expectedInlierRatio: number;
  missionA?: string;
  instrumentA?: string;
  missionB?: string;
  instrumentB?: string;
  transformation: {
    rotationDeg: number;
    scaleFactor: number;
    translationX: number;
    translationY: number;
    homography: number[][];
    shear: number;
  };
}

export const LUNAR_REGIONS: LunarRegionInfo[] = [
  {
    id: 'shackleton_south_pole',
    name: 'Shackleton Crater',
    latitude: '89.9° S',
    longitude: '0.0° E',
    latNum: -89.9,
    lngNum: 0.0,
    elevation: '-4.2 km',
    diameter: '21 km',
    geology: 'Permanently Shadowed Region (PSR) harboring potential water-ice volatiles with ultra-steep elevated rims.',
    availableImagery: ['Chandrayaan-2 OHRC', 'TMC-2 Stereo', 'IIRS Hyperspectral', 'LRO NAC', 'Copernicus'],
    description: 'Prime exploration target for the Artemis and Chandrayaan missions located at the direct lunar South Pole.',
    samplePairId: 'shackleton_south_pole',
  },
  {
    id: 'tycho_central_peak',
    name: 'Tycho Crater',
    latitude: '43.3° S',
    longitude: '11.2° W',
    latNum: -43.3,
    lngNum: -11.2,
    elevation: '+1.6 km central peak',
    diameter: '85 km',
    geology: 'Prominent Copernican-era impact crater with an extensive high-albedo ray system and shocked anorthosite peaks.',
    availableImagery: ['Chandrayaan-2 OHRC', 'TMC-2 Stereo', 'IIRS Hyperspectral', 'LRO NAC'],
    description: 'High-contrast feature complex ideal for testing scale and sun-angle invariant descriptor matching.',
    samplePairId: 'tycho_central_peak',
  },
  {
    id: 'cabeus_crater',
    name: 'Cabeus Crater',
    latitude: '84.9° S',
    longitude: '35.5° W',
    latNum: -84.9,
    lngNum: -35.5,
    elevation: '-3.8 km',
    diameter: '100 km',
    geology: 'LCROSS impact site with confirmed subsurface hydroxyl and water vapor spectral signatures in cold traps.',
    availableImagery: ['Chandrayaan-2 OHRC', 'TMC-2 Stereo', 'IIRS Hyperspectral', 'LRO NAC'],
    description: 'Deep polar basin requiring extreme multi-modal illumination alignment across high sun-angle differentials.',
    samplePairId: 'cabeus_crater',
  },
  {
    id: 'clavius_crater',
    name: 'Clavius Crater',
    latitude: '58.4° S',
    longitude: '14.4° W',
    latNum: -58.4,
    lngNum: -14.4,
    elevation: '-3.5 km',
    diameter: '231 km',
    geology: 'One of the largest southern crater formations, hosting an interior chain of progressively smaller impact craters.',
    availableImagery: ['Chandrayaan-2 OHRC', 'TMC-2 Stereo', 'IIRS Hyperspectral', 'LRO NAC'],
    description: 'Large-scale structural test area for perspective warping and deep feature correspondence.',
    samplePairId: 'clavius_crater',
  },
  {
    id: 'mare_orientale_basin',
    name: 'Mare Orientale',
    latitude: '19.4° S',
    longitude: '92.8° W',
    latNum: -19.4,
    lngNum: -92.8,
    elevation: '-2.0 km',
    diameter: '930 km',
    geology: 'Three concentric mountain rings showing volcanic mare basalts and pristine multiring impact basin crust.',
    availableImagery: ['Chandrayaan-2 TMC-2', 'IIRS Hyperspectral', 'LRO NAC', 'Copernicus'],
    description: 'Massive multi-ring impact basin providing diverse terrain types and cross-mission stereo alignment.',
    samplePairId: 'mare_orientale_basin',
  },
  {
    id: 'copernicus_crater',
    name: 'Copernicus Crater',
    latitude: '9.62° N',
    longitude: '20.08° W',
    latNum: 9.62,
    lngNum: -20.08,
    elevation: '+3.8 km wall relief',
    diameter: '93 km',
    geology: 'Terraced crater walls with prominent central peaks composed of olivine-rich mantle materials.',
    availableImagery: ['Chandrayaan-2 OHRC', 'TMC-2 Stereo', 'LRO NAC', 'IIRS Hyperspectral'],
    description: 'Classic benchmark impact structure for evaluating sub-pixel registration accuracy.',
    samplePairId: 'copernicus_crater',
  },
];

export const SAMPLE_PAIRS: SampleObservationPair[] = [
  {
    id: 'shackleton_south_pole',
    name: 'Shackleton Crater — South Pole',
    region: 'Lunar South Pole (-89.9°S, 0.0°E)',
    coordinates: '89°54′S 0°0′E',
    referenceSensor: 'OHRC',
    sourceSensor: 'TMC',
    missionA: 'Chandrayaan-2',
    instrumentA: 'OHRC',
    missionB: 'Chandrayaan-2',
    instrumentB: 'TMC-2',
    description: 'Permanently shadowed interior with sharp illuminated rim ridges. High-contrast registration test case.',
    sunAngleRef: 35,
    sunAngleSrc: 65,
    expectedRmse: 0.73,
    expectedMatches: 1284,
    expectedInlierRatio: 81.46,
    transformation: {
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
    },
  },
  {
    id: 'tycho_central_peak',
    name: 'Tycho Crater — Central Peak Complex',
    region: 'Southern Highlands (43.3°S, 11.2°W)',
    coordinates: '43°18′S 11°12′W',
    referenceSensor: 'OHRC',
    sourceSensor: 'IIRS',
    missionA: 'Chandrayaan-2',
    instrumentA: 'OHRC',
    missionB: 'Chandrayaan-2',
    instrumentB: 'IIRS',
    description: 'Prominent ray system and multi-layered impact melts. Cross-modal Optical vs Hyperspectral registration.',
    sunAngleRef: 50,
    sunAngleSrc: 25,
    expectedRmse: 0.91,
    expectedMatches: 892,
    expectedInlierRatio: 76.32,
    transformation: {
      rotationDeg: -8.45,
      scaleFactor: 2.14,
      translationX: -15.82,
      translationY: 31.05,
      homography: [
        [0.989, 0.147, -15.82],
        [-0.147, 0.989, 31.05],
        [-0.0001, 0.0003, 1.0],
      ],
      shear: -0.01,
    },
  },
  {
    id: 'cabeus_crater',
    name: 'Cabeus Crater — Deep Cold Trap',
    region: 'Lunar South Polar Region (-84.9°S, 35.5°W)',
    coordinates: '84°54′S 35°30′W',
    referenceSensor: 'OHRC',
    sourceSensor: 'NAC',
    missionA: 'Chandrayaan-2',
    instrumentA: 'OHRC',
    missionB: 'LRO',
    instrumentB: 'NAC',
    description: 'Cross-mission alignment between Chandrayaan-2 OHRC and NASA LRO NAC under extreme oblique sun angles.',
    sunAngleRef: 42,
    sunAngleSrc: 67,
    expectedRmse: 0.83,
    expectedMatches: 2481,
    expectedInlierRatio: 94.7,
    transformation: {
      rotationDeg: 37.2,
      scaleFactor: 1.42,
      translationX: 18.3,
      translationY: -12.4,
      homography: [
        [0.796, -0.605, 18.3],
        [0.605, 0.796, -12.4],
        [0.0001, -0.0001, 1.0],
      ],
      shear: 0.01,
    },
  },
  {
    id: 'clavius_crater',
    name: 'Clavius Crater — Highland Basin',
    region: 'Southern Highlands (58.4°S, 14.4°W)',
    coordinates: '58°24′S 14°24′W',
    referenceSensor: 'TMC',
    sourceSensor: 'NAC',
    missionA: 'Chandrayaan-2',
    instrumentA: 'TMC-2',
    missionB: 'LRO',
    instrumentB: 'NAC',
    description: 'Multi-scale registration of ancient crater chains across varying orbital resolutions.',
    sunAngleRef: 45,
    sunAngleSrc: 70,
    expectedRmse: 0.79,
    expectedMatches: 1842,
    expectedInlierRatio: 91.2,
    transformation: {
      rotationDeg: 12.8,
      scaleFactor: 1.65,
      translationX: -9.5,
      translationY: 14.2,
      homography: [
        [0.975, -0.221, -9.5],
        [0.221, 0.975, 14.2],
        [0.00008, -0.00005, 1.0],
      ],
      shear: 0.012,
    },
  },
  {
    id: 'mare_orientale_basin',
    name: 'Mare Orientale — Multi-Ring Impact Basin',
    region: 'Western Limb (19.4°S, 92.8°W)',
    coordinates: '19°24′S 92°48′W',
    referenceSensor: 'TMC',
    sourceSensor: 'IIRS',
    missionA: 'Chandrayaan-2',
    instrumentA: 'TMC-2',
    missionB: 'Chandrayaan-2',
    instrumentB: 'IIRS',
    description: 'Three concentric mountain rings showing volcanic mare basalts and highland crust boundaries.',
    sunAngleRef: 70,
    sunAngleSrc: 40,
    expectedRmse: 0.65,
    expectedMatches: 1540,
    expectedInlierRatio: 88.19,
    transformation: {
      rotationDeg: 5.12,
      scaleFactor: 1.35,
      translationX: 12.19,
      translationY: -8.64,
      homography: [
        [0.996, -0.089, 12.19],
        [0.089, 0.996, -8.64],
        [0.00005, -0.0001, 1.0],
      ],
      shear: 0.015,
    },
  },
  {
    id: 'copernicus_crater',
    name: 'Copernicus Crater — Terraced Walls',
    region: 'Oceanus Procellarum (9.6°N, 20.1°W)',
    coordinates: '9°37′N 20°05′W',
    referenceSensor: 'OHRC',
    sourceSensor: 'TMC',
    missionA: 'Chandrayaan-2',
    instrumentA: 'OHRC',
    missionB: 'Copernicus Orbiter',
    instrumentB: 'TMC-2',
    description: 'Pristine impact structure with complex ray patterns and terraced crater rims.',
    sunAngleRef: 55,
    sunAngleSrc: 30,
    expectedRmse: 0.68,
    expectedMatches: 2100,
    expectedInlierRatio: 93.4,
    transformation: {
      rotationDeg: -18.3,
      scaleFactor: 1.55,
      translationX: 20.1,
      translationY: 15.6,
      homography: [
        [0.949, 0.314, 20.1],
        [-0.314, 0.949, 15.6],
        [-0.0001, 0.0002, 1.0],
      ],
      shear: -0.008,
    },
  },
];

/**
 * Helper to build initial UploadedImage records for a sample pair.
 */
export function getSampleImages(pairId: string = 'shackleton_south_pole') {
  const pair = SAMPLE_PAIRS.find((p) => p.id === pairId) || SAMPLE_PAIRS[0];

  const refUrl = generateProceduralLunarImage(pair.referenceSensor, 101, pair.sunAngleRef, 600, 600, pair.name);
  const srcUrl = generateProceduralLunarImage(pair.sourceSensor, 202, pair.sunAngleSrc, 600, 600, pair.name);

  return {
    pair,
    reference: {
      id: `ref_${pair.id}`,
      name: `${pair.missionA || 'CH2'}_${pair.instrumentA || pair.referenceSensor}_${pair.id.toUpperCase()}_REF.PNG`,
      url: refUrl,
      width: 2048,
      height: 2048,
      sizeFormatted: '4.8 MB',
      sensor: pair.referenceSensor,
      timestamp: '2023-09-14T08:23:41Z',
      latitude: pair.coordinates.split(' ')[0],
      longitude: pair.coordinates.split(' ')[1],
      targetRegion: pair.name,
      mission: pair.missionA || 'Chandrayaan-2',
      instrument: pair.instrumentA || pair.referenceSensor,
      imageId: `${pair.instrumentA || pair.referenceSensor}-SOUTH-004`,
      resolution: pair.referenceSensor === 'OHRC' ? '0.25 m/pixel' : '5 m/pixel',
      sunAngle: `${pair.sunAngleRef}°`,
      acquisitionDate: '2023-09-14',
    },
    source: {
      id: `src_${pair.id}`,
      name: `${pair.missionB || 'CH2'}_${pair.instrumentB || pair.sourceSensor}_${pair.id.toUpperCase()}_SRC.PNG`,
      url: srcUrl,
      width: 1024,
      height: 1024,
      sizeFormatted: '2.4 MB',
      sensor: pair.sourceSensor,
      timestamp: '2023-11-02T14:15:19Z',
      latitude: pair.coordinates.split(' ')[0],
      longitude: pair.coordinates.split(' ')[1],
      targetRegion: pair.name,
      mission: pair.missionB || 'LRO',
      instrument: pair.instrumentB || pair.sourceSensor,
      imageId: `${pair.instrumentB || pair.sourceSensor}-SOUTH-021`,
      resolution: pair.sourceSensor === 'NAC' ? '0.5 m/pixel' : '5 m/pixel',
      sunAngle: `${pair.sunAngleSrc}°`,
      acquisitionDate: '2023-11-02',
    },
    referenceMetadata: {
      mission: pair.missionA || 'Chandrayaan-2',
      instrument: pair.instrumentA || pair.referenceSensor,
      region: pair.name,
      resolution: pair.referenceSensor === 'OHRC' ? '0.25 m/px' : '5.0 m/px',
      sunAngle: `${pair.sunAngleRef}° (High Oblique)`,
      coordinates: pair.coordinates,
    },
    sourceMetadata: {
      mission: pair.missionB || 'Chandrayaan-2',
      instrument: pair.instrumentB || pair.sourceSensor,
      region: pair.name,
      resolution: pair.sourceSensor === 'NAC' ? '0.5 m/px' : '5.0 m/px',
      sunAngle: `${pair.sunAngleSrc}° (Low Grazing)`,
      coordinates: pair.coordinates,
    },
  };
}

