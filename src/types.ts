export type SensorType = 'OHRC' | 'TMC' | 'IIRS';

export interface SensorInfo {
  id: SensorType;
  name: string;
  fullName: string;
  resolution: string;
  spectralBand: string;
  orbitAltitude: string;
  swath: string;
  description: string;
  color: string;
}

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  sizeFormatted: string;
  sensor: SensorType;
  timestamp: string;
  latitude?: string;
  longitude?: string;
  targetRegion?: string;
}

export interface MatchPoint {
  id: number;
  x1: number; // 0 to 1 normalized
  y1: number;
  x2: number; // 0 to 1 normalized
  y2: number;
  inlier: boolean;
  confidence: number;
  descriptorDistance: number;
  subpixelOffset: [number, number];
}

export interface GeometricTransformation {
  rotationDeg: number;
  scaleFactor: number;
  translationX: number; // in pixels
  translationY: number; // in pixels
  homography: number[][]; // 3x3 matrix
  shear: number;
}

export interface RegistrationMetrics {
  rmse: number; // px
  totalMatches: number;
  inliers: number;
  inlierRatio: number; // %
  transformation: GeometricTransformation;
  processingTimeMs: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  subpixelPrecision: number; // e.g. 0.08 px
  algorithm: string;
  timestamp: string;
}

export interface HistoryRecord {
  id: string;
  date: string;
  referenceSensor: SensorType;
  sourceSensor: SensorType;
  referenceName: string;
  sourceName: string;
  rmse: string;
  matches: number;
  inlierRatio: string;
  status: 'SUCCESS' | 'WARNING';
  targetRegion: string;
}

export type ActiveScreen = 'registration' | 'processing' | 'results' | 'comparison' | 'analysis' | 'history';

export type ComparisonMode = 'slider' | 'side-by-side' | 'difference' | 'checkerboard' | 'blend' | 'edges';
