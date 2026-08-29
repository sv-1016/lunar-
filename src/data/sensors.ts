import { SensorInfo, SensorType } from '../types';

export const SENSORS: Record<SensorType, SensorInfo> = {
  OHRC: {
    id: 'OHRC',
    name: 'OHRC',
    fullName: 'Orbiter High Resolution Camera',
    resolution: '0.25 m – 0.32 m / pixel',
    spectralBand: 'Panchromatic (450 – 900 nm)',
    orbitAltitude: '100 km polar orbit',
    swath: '3 km @ 100 km altitude',
    description: 'Ultra-high-resolution imaging for hazard detection and precise landing site characterization on the lunar surface.',
    color: '#35C6F4', // Cyan accent
  },
  TMC: {
    id: 'TMC',
    name: 'TMC-2',
    fullName: 'Terrain Mapping Camera-2',
    resolution: '5.0 m / pixel',
    spectralBand: 'Panchromatic (500 – 850 nm, Stereo Triplet)',
    orbitAltitude: '100 km polar orbit',
    swath: '20 km with 3-view stereo (Fore, Nadir, Aft)',
    description: 'High-resolution stereo imagery for generating detailed 3D Digital Elevation Models (DEM) of lunar topography.',
    color: '#7C8CFF', // Indigo accent
  },
  IIRS: {
    id: 'IIRS',
    name: 'IIRS',
    fullName: 'Imaging Infrared Spectrometer',
    resolution: '80 m / pixel spatial, ~250 contiguous bands',
    spectralBand: 'Short-wave & Thermal IR (0.8 – 5.0 µm)',
    orbitAltitude: '100 km polar orbit',
    swath: '20 km hyperspectral swath',
    description: 'Mineralogical mapping and hydroxyl/water-ice signature identification across illuminated and shadow-boundary regions.',
    color: '#35D07F', // Emerald accent
  },
  NAC: {
    id: 'NAC',
    name: 'LROC NAC',
    fullName: 'Narrow Angle Camera (NASA LRO)',
    resolution: '0.5 m / pixel spatial',
    spectralBand: 'Panchromatic (400 – 750 nm)',
    orbitAltitude: '50 km lunar mapping orbit',
    swath: '5 km swath width',
    description: 'High-contrast narrow-angle framing for precision geological feature verification and cross-mission registration.',
    color: '#F4B035', // Amber accent
  },
};

