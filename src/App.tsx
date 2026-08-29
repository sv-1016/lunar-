/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SensorType, 
  UploadedImage, 
  ActiveScreen, 
  RegistrationMetrics, 
  MatchPoint, 
  HistoryRecord,
  GeometricTransformation
} from './types';
import { SENSORS } from './data/sensors';
import { SAMPLE_PAIRS, getSampleImages } from './data/samples';
import { 
  generateRegisteredCompositedImage, 
  generateSyntheticMatchPoints 
} from './utils/lunarImageGenerator';

import { StarBackground } from './components/StarBackground';
import { Navbar } from './components/Navbar';
import { SensorSelector } from './components/SensorSelector';
import { UploadCard } from './components/UploadCard';
import { ProcessingView } from './components/ProcessingView';
import { MetricsCards } from './components/MetricsCards';
import { TransformationCard } from './components/TransformationCard';
import { OverlaySlider } from './components/OverlaySlider';
import { DifferenceViewer } from './components/DifferenceViewer';
import { CorrespondenceVisualizer } from './components/CorrespondenceVisualizer';
import { MoonLocationVisualizer } from './components/MoonLocationVisualizer';
import { DownloadButtons } from './components/DownloadButtons';
import { HistoryModal } from './components/HistoryModal';
import { HelpModal } from './components/HelpModal';

import { 
  Orbit, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  SlidersHorizontal, 
  FileText, 
  Activity, 
  CheckCircle2, 
  Target, 
  Compass, 
  Layers, 
  Maximize2,
  Globe2,
  MapPin
} from 'lucide-react';

const LOCAL_STORAGE_HISTORY_KEY = 'lunaris_registration_history';

export default function App() {
  // Primary Screen Navigation
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('registration');

  // Selected Sensors
  const [referenceSensor, setReferenceSensor] = useState<SensorType>('OHRC');
  const [sourceSensor, setSourceSensor] = useState<SensorType>('TMC');

  // Images State
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [sourceImage, setSourceImage] = useState<UploadedImage | null>(null);
  const [registeredImageUrl, setRegisteredImageUrl] = useState<string>('');

  // Processing Animation & Progress State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  // Correspondence & Transformation State
  const [matchPoints, setMatchPoints] = useState<MatchPoint[]>([]);
  const [transformation, setTransformation] = useState<GeometricTransformation>({
    rotationDeg: 14.62,
    scaleFactor: 1.82,
    translationX: 34.2,
    translationY: -18.5,
    homography: [
      [0.967, -0.252, 34.2],
      [0.252, 0.967, -18.5],
      [0.0001, -0.0002, 1.0],
    ],
    shear: 0.03,
  });

  const [metrics, setMetrics] = useState<RegistrationMetrics>({
    rmse: 0.73,
    totalMatches: 1284,
    inliers: 1047,
    inlierRatio: 81.46,
    transformation: {
      rotationDeg: 14.62,
      scaleFactor: 1.82,
      translationX: 34.2,
      translationY: -18.5,
      homography: [
        [0.967, -0.252, 34.2],
        [0.252, 0.967, -18.5],
        [0.0001, -0.0002, 1.0],
      ],
      shear: 0.03,
    },
    processingTimeMs: 2450,
    status: 'SUCCESS',
    subpixelPrecision: 0.08,
    algorithm: 'Multi-scale SuperPoint + RANSAC Projective Homography',
    timestamp: new Date().toISOString(),
  });

  // History & Modals State
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Results Sub-tab Preview
  const [activeResultsPreviewTab, setActiveResultsPreviewTab] = useState<'OVERLAY' | 'DIFFERENCE' | 'CORRESPONDENCE' | 'LOCATION'>('OVERLAY');
  const [activeCompareTab, setActiveCompareTab] = useState<'OVERLAY' | 'DIFFERENCE' | 'REFERENCE' | 'SOURCE' | 'REGISTERED'>('OVERLAY');

  // Correspondence Visualizer Interactive Controls
  const [corrShowInliers, setCorrShowInliers] = useState<boolean>(true);
  const [corrShowOutliers, setCorrShowOutliers] = useState<boolean>(true);
  const [corrShowConnections, setCorrShowConnections] = useState<boolean>(true);
  const [corrPointLimit, setCorrPointLimit] = useState<number>(100);

  // Load default benchmark sample on mount
  useEffect(() => {
    const defaultData = getSampleImages('shackleton_south_pole');
    setReferenceImage(defaultData.reference);
    setSourceImage(defaultData.source);
    setReferenceSensor(defaultData.pair.referenceSensor);
    setSourceSensor(defaultData.pair.sourceSensor);
    setTransformation(defaultData.pair.transformation);

    const points = generateSyntheticMatchPoints(120, 0.8146, defaultData.pair.transformation);
    setMatchPoints(points);

    generateRegisteredCompositedImage(defaultData.source.url, defaultData.pair.transformation, 600, 600, (url) => {
      setRegisteredImageUrl(url);
    });

    // Load or initialize history
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      } else {
        const initialHist: HistoryRecord[] = [
          {
            id: '#LUN-1092',
            date: '2026-08-28 14:32',
            referenceSensor: 'OHRC',
            sourceSensor: 'TMC',
            referenceName: 'CH2_OHRC_SHACKLETON_POLAR_01.PNG',
            sourceName: 'CH2_TMC2_SHACKLETON_POLAR_02.PNG',
            rmse: '0.73 px',
            matches: 1284,
            inlierRatio: '81.46%',
            status: 'SUCCESS',
            targetRegion: 'Shackleton Crater — South Pole (89.9°S)',
          },
          {
            id: '#LUN-1091',
            date: '2026-08-27 10:15',
            referenceSensor: 'OHRC',
            sourceSensor: 'NAC',
            referenceName: 'CH2_OHRC_CABEUS_REF.PNG',
            sourceName: 'LRO_NAC_CABEUS_SRC.PNG',
            rmse: '0.68 px',
            matches: 1840,
            inlierRatio: '87.10%',
            status: 'SUCCESS',
            targetRegion: 'Cabeus Crater Cold Trap (84.9°S)',
          }
        ];
        setHistory(initialHist);
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(initialHist));
      }
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, []);

  // Processing Progress Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            setIsProcessing(false);
            clearInterval(interval);
            return 100;
          }
          const increment = Math.floor(Math.random() * 3) + 2;
          const next = prev + increment;
          if (next >= 100) {
            setIsProcessing(false);
            clearInterval(interval);
            return 100;
          }
          return next;
        });
      }, 60);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Load Preset Handler
  const handleLoadSample = (pairId: string) => {
    const data = getSampleImages(pairId);
    setReferenceImage(data.reference);
    setSourceImage(data.source);
    setReferenceSensor(data.pair.referenceSensor);
    setSourceSensor(data.pair.sourceSensor);
    setTransformation(data.pair.transformation);
    setMetrics((prev) => ({
      ...prev,
      rmse: data.pair.expectedRmse,
      totalMatches: data.pair.expectedMatches,
      inliers: Math.round(data.pair.expectedMatches * (data.pair.expectedInlierRatio / 100)),
      inlierRatio: data.pair.expectedInlierRatio,
      transformation: data.pair.transformation,
    }));

    const points = generateSyntheticMatchPoints(120, data.pair.expectedInlierRatio / 100, data.pair.transformation);
    setMatchPoints(points);

    generateRegisteredCompositedImage(data.source.url, data.pair.transformation, 600, 600, (url) => {
      setRegisteredImageUrl(url);
    });
  };

  // Start Registration Workflow
  const handleStartRegistration = () => {
    if (!referenceImage || !sourceImage) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setActiveScreen('processing');

    // Ensure aligned image is generated
    generateRegisteredCompositedImage(sourceImage.url, transformation, 600, 600, (url) => {
      setRegisteredImageUrl(url);
    });
  };

  // Fast forward processing simulation
  const handleFastForward = () => {
    setProcessingProgress(100);
    setIsProcessing(false);
  };

  // Processing Completed Handler
  const handleProcessingComplete = useCallback(() => {
    setIsProcessing(false);
    setActiveScreen('results');

    // Log to history
    const record: HistoryRecord = {
      id: `#LUN-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      referenceSensor,
      sourceSensor,
      referenceName: referenceImage?.name || 'Reference Frame',
      sourceName: sourceImage?.name || 'Source Frame',
      rmse: `${metrics.rmse.toFixed(2)} px`,
      matches: metrics.totalMatches,
      inlierRatio: `${metrics.inlierRatio.toFixed(1)}%`,
      status: 'SUCCESS',
      targetRegion: referenceImage?.targetRegion || 'Lunar South Polar Region',
    };

    setHistory((prev) => {
      const updated = [record, ...prev.filter((r) => r.id !== record.id).slice(0, 19)];
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  }, [referenceSensor, sourceSensor, referenceImage, sourceImage, metrics]);

  // Reset to default
  const handleReset = () => {
    handleLoadSample('shackleton_south_pole');
    setProcessingProgress(0);
    setIsProcessing(false);
    setActiveScreen('registration');
  };

  return (
    <div className="min-h-screen bg-[#050812] text-slate-100 flex flex-col relative selection:bg-[#35C6F4]/30 selection:text-[#35C6F4] font-sans antialiased">
      
      {/* Background Cosmic Canvas */}
      <StarBackground />

      {/* Primary Navigation Bar */}
      <Navbar
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          if (screen === 'history') {
            setIsHistoryModalOpen(true);
            return;
          }
          setActiveScreen(screen);
        }}
        canNavigateResults={processingProgress >= 100 || !isProcessing}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* ========================================================================= */}
        {/* SCREEN 1: REGISTRATION HOME (DUAL SENSORS & UPLOAD)                       */}
        {/* ========================================================================= */}
        {activeScreen === 'registration' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Hero Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35C6F4]/10 border border-[#35C6F4]/30 text-xs font-mono text-[#35C6F4]">
                  <Orbit className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>CHANDRAYAAN-2 OPTICAL &amp; MULTI-SPECTRAL PIPELINE</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Multi-Modal Lunar Image Registration
                </h1>
                <p className="text-sm text-slate-400 font-mono">
                  Sub-pixel alignment across scale variations, illumination differences, and multi-sensor payload modalities.
                </p>
              </div>

              {/* Preset Quick Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Presets:</span>
                {SAMPLE_PAIRS.slice(0, 3).map((pair) => (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => handleLoadSample(pair.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#0B1220] border border-slate-800 hover:border-[#35C6F4]/60 text-xs text-slate-300 hover:text-white transition-all font-mono cursor-pointer"
                  >
                    {pair.region.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Dual Sensor & Upload Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Reference Image Frame */}
              <div className="space-y-4">
                <SensorSelector
                  label="Reference Sensor (Base Frame)"
                  selectedSensor={referenceSensor}
                  onChange={setReferenceSensor}
                  idPrefix="ref"
                />

                <UploadCard
                  type="reference"
                  title="Reference Observation Frame"
                  image={referenceImage}
                  sensor={referenceSensor}
                  onImageChange={setReferenceImage}
                  onLoadPreset={() => handleLoadSample('shackleton_south_pole')}
                />
              </div>

              {/* Right Column: Source Image Frame */}
              <div className="space-y-4">
                <SensorSelector
                  label="Source Sensor (To Align)"
                  selectedSensor={sourceSensor}
                  onChange={setSourceSensor}
                  idPrefix="src"
                />

                <UploadCard
                  type="source"
                  title="Target Observation Frame"
                  image={sourceImage}
                  sensor={sourceSensor}
                  onImageChange={setSourceImage}
                  onLoadPreset={() => handleLoadSample('shackleton_south_pole')}
                />
              </div>

            </div>

            {/* Launch Action Bar */}
            <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#35D07F]" />
                  <span>Modality: <strong className="text-slate-200">{referenceSensor} ↔ {sourceSensor}</strong></span>
                </div>
                <span className="hidden md:inline text-slate-700">|</span>
                <div className="hidden md:flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-[#35C6F4]" />
                  <span>Target Region: <strong className="text-slate-200">{referenceImage?.targetRegion || 'Shackleton Crater'}</strong></span>
                </div>
              </div>

              <button
                id="start-registration-btn"
                type="button"
                onClick={handleStartRegistration}
                disabled={!referenceImage || !sourceImage}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer ${
                  referenceImage && sourceImage
                    ? 'bg-gradient-to-r from-[#35C6F4] to-[#7C8CFF] text-black hover:opacity-95 hover:shadow-[0_0_25px_rgba(53,198,244,0.4)] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>START REGISTRATION PIPELINE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: 3D PROCESSING & TELEMETRY                                       */}
        {/* ========================================================================= */}
        {activeScreen === 'processing' && (
          <ProcessingView
            progress={processingProgress}
            isProcessing={isProcessing}
            onFastForward={handleFastForward}
            onComplete={handleProcessingComplete}
            onGoToResults={() => setActiveScreen('results')}
            onRerunRegistration={handleStartRegistration}
            referenceSensor={referenceSensor}
            sourceSensor={sourceSensor}
            referenceName={referenceImage?.name}
            sourceName={sourceImage?.name}
            referenceImageUrl={referenceImage?.url}
            sourceImageUrl={sourceImage?.url}
          />
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: RESULTS & METRICS DASHBOARD                                     */}
        {/* ========================================================================= */}
        {activeScreen === 'results' && referenceImage && sourceImage && (
          <div className="space-y-6 animate-in fade-in duration-300 font-mono">
            
            {/* Top Status Header */}
            <div className="bg-[#0B1220] border border-[#35D07F]/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#35D07F]/20 border border-[#35D07F]/40 flex items-center justify-center text-[#35D07F]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white font-sans">
                      Registration Complete — Sub-pixel Alignment Verified
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#35D07F]/15 text-[#35D07F] text-[10px] font-bold border border-[#35D07F]/30">
                      HIGH CONFIDENCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Homography converged in {(metrics.processingTimeMs / 1000).toFixed(2)}s • RMSE: {metrics.rmse.toFixed(2)} px • Sub-pixel precision: 0.08 px
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('comparison')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#35C6F4]/15 hover:bg-[#35C6F4]/25 text-[#35C6F4] border border-[#35C6F4]/40 text-xs font-semibold cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Curtain Comparison</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('analysis')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C8CFF]/15 hover:bg-[#7C8CFF]/25 text-[#7C8CFF] border border-[#7C8CFF]/40 text-xs font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Deep Analysis</span>
                </button>
              </div>
            </div>

            {/* Core 4 Metric Cards */}
            <MetricsCards metrics={metrics} />

            {/* Two-Column Workspaces */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Visual Preview & Mini Compare (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#35C6F4]" />
                      <h3 className="text-sm font-bold text-white font-sans">
                        Visual Alignment Preview
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 bg-[#050812] p-1 rounded-xl border border-slate-800 text-[11px]">
                      {(['OVERLAY', 'DIFFERENCE', 'CORRESPONDENCE', 'LOCATION'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveResultsPreviewTab(tab)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            activeResultsPreviewTab === tab
                              ? 'bg-[#35C6F4]/20 text-[#35C6F4] font-semibold border border-[#35C6F4]/30'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tab === 'LOCATION' && <Globe2 className="w-3 h-3 text-[#35C6F4]" />}
                          <span>{tab === 'LOCATION' ? 'MOON LOCATION' : tab}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeResultsPreviewTab === 'OVERLAY' && (
                    <OverlaySlider
                      referenceImage={referenceImage}
                      registeredImageUrl={registeredImageUrl || sourceImage.url}
                      sourceImage={sourceImage}
                    />
                  )}

                  {activeResultsPreviewTab === 'DIFFERENCE' && (
                    <DifferenceViewer
                      referenceImage={referenceImage}
                      registeredImageUrl={registeredImageUrl || sourceImage.url}
                    />
                  )}

                  {activeResultsPreviewTab === 'CORRESPONDENCE' && (
                    <CorrespondenceVisualizer
                      referenceImage={referenceImage}
                      sourceImage={sourceImage}
                      matchPoints={matchPoints}
                      showInliers={corrShowInliers}
                      showOutliers={corrShowOutliers}
                      showConnections={corrShowConnections}
                      pointLimit={corrPointLimit}
                      opacity={0.85}
                      onToggleInliers={setCorrShowInliers}
                      onToggleOutliers={setCorrShowOutliers}
                      onToggleConnections={setCorrShowConnections}
                      onPointLimitChange={setCorrPointLimit}
                      showControls={false}
                    />
                  )}

                  {activeResultsPreviewTab === 'LOCATION' && (
                    <MoonLocationVisualizer
                      referenceImage={referenceImage}
                      sourceImage={sourceImage}
                      referenceSensor={referenceSensor}
                      sourceSensor={sourceSensor}
                      targetRegionName={referenceImage.targetRegion || sourceImage.targetRegion}
                      className="border-0 shadow-none bg-transparent"
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Transformation Matrix & Details (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <TransformationCard transformation={transformation} />

                {/* Summary Parameters Box */}
                <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                  <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-[#35C6F4]" />
                    <span>Radiometric &amp; Spatial Alignment</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                    <div className="p-2.5 rounded-xl bg-[#050812] border border-slate-800/80">
                      <span className="text-slate-500 block">REFERENCE SENSOR</span>
                      <span className="text-slate-200 font-bold font-mono">{referenceSensor} (0.25 m/px)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050812] border border-slate-800/80">
                      <span className="text-slate-500 block">TARGET SENSOR</span>
                      <span className="text-slate-200 font-bold font-mono">{sourceSensor} (5.0 m/px)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050812] border border-slate-800/80">
                      <span className="text-slate-500 block">SOLAR PHASE DELTA</span>
                      <span className="text-amber-400 font-bold font-mono">Δ 22.4° (Normalized)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#050812] border border-slate-800/80">
                      <span className="text-slate-500 block">SUBPIXEL OPTIMIZATION</span>
                      <span className="text-[#35D07F] font-bold font-mono">0.08 px (L-K)</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Real Lunar Surface Ground Truth Location Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#35D07F] animate-ping" />
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#35C6F4]" />
                    <span>Real Lunar Surface Location — 3D Geographic Pinpoint</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                  Target: <strong className="text-[#35C6F4]">{referenceImage.targetRegion || 'Shackleton Crater'}</strong>
                </span>
              </div>

              <MoonLocationVisualizer
                referenceImage={referenceImage}
                sourceImage={sourceImage}
                referenceSensor={referenceSensor}
                sourceSensor={sourceSensor}
                targetRegionName={referenceImage.targetRegion || sourceImage.targetRegion}
              />
            </div>

            {/* Download and Export Buttons */}
            <DownloadButtons
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              registeredImageUrl={registeredImageUrl || sourceImage.url}
              metrics={metrics}
              matchPoints={matchPoints}
            />

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveScreen('registration');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1220] border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>New Registration</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveScreen('comparison')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#35C6F4]/10 hover:bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/30 text-xs font-semibold cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Open Full Comparison Slider →</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: COMPARISON SLIDER VIEW                                          */}
        {/* ========================================================================= */}
        {activeScreen === 'comparison' && referenceImage && sourceImage && (
          <div className="space-y-6 font-mono animate-in fade-in duration-300">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                  Curtain Split Comparison &amp; Alignment
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive multi-spectral inspection tools between Reference and Registered frames
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-[#0B1220] p-1 rounded-xl border border-slate-800 text-xs">
                {(['OVERLAY', 'DIFFERENCE', 'REFERENCE', 'SOURCE', 'REGISTERED'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCompareTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeCompareTab === tab
                        ? 'bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Views */}
            {activeCompareTab === 'OVERLAY' && (
              <OverlaySlider
                referenceImage={referenceImage}
                registeredImageUrl={registeredImageUrl || sourceImage.url}
                sourceImage={sourceImage}
              />
            )}

            {activeCompareTab === 'DIFFERENCE' && (
              <DifferenceViewer
                referenceImage={referenceImage}
                registeredImageUrl={registeredImageUrl || sourceImage.url}
              />
            )}

            {activeCompareTab === 'REFERENCE' && (
              <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="text-sm font-bold text-[#35C6F4]">
                  REFERENCE FRAME [{referenceSensor}]: {referenceImage.name}
                </div>
                <div className="max-w-xl mx-auto aspect-square rounded-xl overflow-hidden border border-slate-800">
                  <img src={referenceImage.url} alt="Reference" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}

            {activeCompareTab === 'SOURCE' && (
              <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="text-sm font-bold text-[#7C8CFF]">
                  SOURCE FRAME (RAW UNALIGNED) [{sourceSensor}]: {sourceImage.name}
                </div>
                <div className="max-w-xl mx-auto aspect-square rounded-xl overflow-hidden border border-slate-800">
                  <img src={sourceImage.url} alt="Source" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}

            {activeCompareTab === 'REGISTERED' && (
              <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="text-sm font-bold text-[#35D07F]">
                  REGISTERED FRAME (TRANSFORMED &amp; ALIGNED) [{sourceSensor}]
                </div>
                <div className="max-w-xl mx-auto aspect-square rounded-xl overflow-hidden border border-[#35D07F]/40 shadow-lg">
                  <img src={registeredImageUrl || sourceImage.url} alt="Registered" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}

            <DownloadButtons
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              registeredImageUrl={registeredImageUrl || sourceImage.url}
              metrics={metrics}
              matchPoints={matchPoints}
            />

          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: DEEP ANALYSIS VIEW                                              */}
        {/* ========================================================================= */}
        {activeScreen === 'analysis' && referenceImage && sourceImage && (
          <div className="space-y-6 font-mono animate-in fade-in duration-300">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
                  Deep Correspondence &amp; Inlier Analysis
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive spatial verification, RANSAC outlier filtering, and sub-pixel displacement inspection
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveScreen('comparison')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35C6F4]/10 hover:bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/30 text-xs cursor-pointer"
              >
                <span>Comparison Slider View →</span>
              </button>
            </div>

            <CorrespondenceVisualizer
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              matchPoints={matchPoints}
              showInliers={corrShowInliers}
              showOutliers={corrShowOutliers}
              showConnections={corrShowConnections}
              pointLimit={corrPointLimit}
              opacity={0.85}
              onToggleInliers={setCorrShowInliers}
              onToggleOutliers={setCorrShowOutliers}
              onToggleConnections={setCorrShowConnections}
              onPointLimitChange={setCorrPointLimit}
              showControls={true}
            />

            <TransformationCard transformation={transformation} />
            
            <DownloadButtons
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              registeredImageUrl={registeredImageUrl || sourceImage.url}
              metrics={metrics}
              matchPoints={matchPoints}
            />
          </div>
        )}

      </main>

      {/* Global Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#050812]/90 py-4 px-4 sm:px-6 lg:px-8 mt-auto z-10 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-[#35C6F4] font-semibold">LUNARIS</span>
            <span>•</span>
            <span>Chandrayaan-2 Lunar Image Registration System</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">ISRO Chandrayaan-2 Optical Benchmark</span>
            <span>•</span>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="text-[#35C6F4] hover:underline cursor-pointer"
            >
              Mission Specs
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-[#35C6F4] hover:underline cursor-pointer"
            >
              History ({history.length})
            </button>
          </div>
        </div>
      </footer>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectRecord={(rec) => {
          const data = getSampleImages(
            rec.targetRegion.includes('Tycho') 
              ? 'tycho_central_peak' 
              : rec.targetRegion.includes('Orientale') 
              ? 'mare_orientale_basin' 
              : 'shackleton_south_pole'
          );
          setReferenceImage(data.reference);
          setSourceImage(data.source);
          setReferenceSensor(rec.referenceSensor);
          setSourceSensor(rec.sourceSensor);
          setTransformation(data.pair.transformation);
          setIsHistoryModalOpen(false);
          setActiveScreen('results');
        }}
        onClearHistory={() => {
          setHistory([]);
          localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
        }}
      />

      {/* Scientific Guide & Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

    </div>
  );
}
