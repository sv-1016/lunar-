import { SensorType } from '../types';
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
  transformation: {
    rotationDeg: number;
    scaleFactor: number;
    translationX: number;
    translationY: number;
    homography: number[][];
    shear: number;
  };
}

export const SAMPLE_PAIRS: SampleObservationPair[] = [
  {
    id: 'shackleton_south_pole',
    name: 'Shackleton Crater — South Pole',
    region: 'Lunar South Pole (-89.9°S, 0.0°E)',
    coordinates: '89°54′S 0°0′E',
    referenceSensor: 'OHRC',
    sourceSensor: 'TMC',
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
    id: 'mare_orientale_basin',
    name: 'Mare Orientale — Multi-Ring Impact Basin',
    region: 'Western Limb (19.4°S, 92.8°W)',
    coordinates: '19°24′S 92°48′W',
    referenceSensor: 'TMC',
    sourceSensor: 'IIRS',
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
      name: `CH2_${pair.referenceSensor}_${pair.id.toUpperCase()}_REF.PNG`,
      url: refUrl,
      width: 2048,
      height: 2048,
      sizeFormatted: '4.8 MB',
      sensor: pair.referenceSensor,
      timestamp: '2023-09-14T08:23:41Z',
      latitude: pair.coordinates.split(' ')[0],
      longitude: pair.coordinates.split(' ')[1],
      targetRegion: pair.name,
    },
    source: {
      id: `src_${pair.id}`,
      name: `CH2_${pair.sourceSensor}_${pair.id.toUpperCase()}_SRC.PNG`,
      url: srcUrl,
      width: 1024,
      height: 1024,
      sizeFormatted: '2.4 MB',
      sensor: pair.sourceSensor,
      timestamp: '2023-11-02T14:15:19Z',
      latitude: pair.coordinates.split(' ')[0],
      longitude: pair.coordinates.split(' ')[1],
      targetRegion: pair.name,
    },
  };
}
