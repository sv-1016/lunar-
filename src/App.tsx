/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { 
  SensorType, 
  UploadedImage, 
  ActiveScreen, 
  RegistrationMetrics, 
  MatchPoint, 
  HistoryRecord 
} from './types';
import { SENSORS } from './data/sensors';
import { SAMPLE_PAIRS, getSampleImages } from './data/samples';
import { 
  generateProceduralLunarImage, 
  generateRegisteredCompositedImage, 
  generateSyntheticMatchPoints 
} from './utils/lunarImageGenerator';

import { StarBackground } from './components/StarBackground';
import { Navbar } from './components/Navbar';
import { UploadCard } from './components/UploadCard';
import { SensorSelector } from './components/SensorSelector';
import { ProcessingView } from './components/ProcessingView';
import { MetricsCards } from './components/MetricsCards';
import { CorrespondenceVisualizer } from './components/CorrespondenceVisualizer';
import { OverlaySlider } from './components/OverlaySlider';
import { DifferenceViewer } from './components/DifferenceViewer';
import { TransformationCard } from './components/TransformationCard';
import { DownloadButtons } from './components/DownloadButtons';
import { HistoryModal } from './components/HistoryModal';
import { HelpModal } from './components/HelpModal';

import { 
  Layers, 
  Cpu, 
  Activity, 
  SlidersHorizontal, 
  FileText, 
  History as HistoryIcon,
  Play, 
  ArrowRight, 
  Sparkles, 
  Orbit, 
  CheckCircle2, 
  RefreshCw, 
  HelpCircle,
  Eye,
  Sliders,
  ChevronRight,
  Zap
} from 'lucide-react';

const LOCAL_STORAGE_HISTORY_KEY = 'lunaris_registration_history_v1';

export default function App() {
  const [, startTransition] = useTransition();

  // Primary State
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('registration');
  const [referenceSensor, setReferenceSensor] = useState<SensorType>('OHRC');
  const [sourceSensor, setSourceSensor] = useState<SensorType>('TMC');
  
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [sourceImage, setSourceImage] = useState<UploadedImage | null>(null);
  const [registeredImageUrl, setRegisteredImageUrl] = useState<string>('');

  // Processing & Simulation State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);

  // Analysis & Correspondence State
  const [matchPoints, setMatchPoints] = useState<MatchPoint[]>([]);
  const [metrics, setMetrics] = useState<RegistrationMetrics>({
    rmse: 0.73,
    totalMatches: 1284,
    inliers: 1047,
    inlierRatio: 81.46,
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
    processingTimeMs: 2450,
    status: 'SUCCESS',
    subpixelPrecision: 0.08,
    algorithm: 'Multi-scale SuperPoint + RANSAC Homography',
    timestamp: new Date().toISOString(),
  });

  // Comparison Tabs: 'OVERLAY' | 'DIFFERENCE' | 'REFERENCE' | 'SOURCE' | 'REGISTERED'
  const [activeCompareTab, setActiveCompareTab] = useState<'OVERLAY' | 'DIFFERENCE' | 'REFERENCE' | 'SOURCE' | 'REGISTERED'>('OVERLAY');

  // Visualization filters
  const [showInliers, setShowInliers] = useState<boolean>(true);
  const [showOutliers, setShowOutliers] = useState<boolean>(true);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [pointLimit, setPointLimit] = useState<number>(80);
  const [pointOpacity, setPointOpacity] = useState<number>(0.85);

  // History & Modal State
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Initial setup: Load default sample pair and saved history
  useEffect(() => {
    // Load default Shackleton Crater Pair
    const defaultData = getSampleImages('shackleton_south_pole');
    setReferenceImage(defaultData.reference);
    setSourceImage(defaultData.source);
    setReferenceSensor(defaultData.pair.referenceSensor);
    setSourceSensor(defaultData.pair.sourceSensor);

    // Load LocalStorage history
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) {
        const parsed: HistoryRecord[] = JSON.parse(saved);
        // Ensure unique IDs when reading saved records
        const seenIds = new Set<string>();
        const uniqueHistory = parsed.filter((item) => {
          if (!item.id || seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
        setHistory(uniqueHistory);
      } else {
        // Pre-populate with realistic benchmark items
        const initialHistory: HistoryRecord[] = [
          {
            id: '#LUN-1048',
            date: '2026-08-27 09:42',
            referenceSensor: 'OHRC',
            sourceSensor: 'TMC',
            referenceName: 'CH2_OHRC_SHACKLETON_REF.PNG',
            sourceName: 'CH2_TMC_SHACKLETON_SRC.PNG',
            rmse: '0.73 px',
            matches: 1284,
            inlierRatio: '81.46%',
            status: 'SUCCESS',
            targetRegion: 'Shackleton Crater — South Pole',
          },
          {
            id: '#LUN-1047',
            date: '2026-08-26 16:15',
            referenceSensor: 'OHRC',
            sourceSensor: 'IIRS',
            referenceName: 'CH2_OHRC_TYCHO_REF.PNG',
            sourceName: 'CH2_IIRS_TYCHO_SRC.PNG',
            rmse: '0.91 px',
            matches: 892,
            inlierRatio: '76.32%',
            status: 'SUCCESS',
            targetRegion: 'Tycho Central Peak Complex',
          },
        ];
        setHistory(initialHistory);
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(initialHistory));
      }
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, []);

  // Save history helper
  const saveToHistory = useCallback((record: HistoryRecord) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== record.id);
      const updated = [record, ...filtered.slice(0, 19)]; // Keep latest 20
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage write error', e);
      }
      return updated;
    });
  }, []);

  // Load a preset observation pair
  const handleLoadSample = (pairId: string) => {
    const data = getSampleImages(pairId);
    setReferenceImage(data.reference);
    setSourceImage(data.source);
    setReferenceSensor(data.pair.referenceSensor);
    setSourceSensor(data.pair.sourceSensor);

    setMetrics((prev) => ({
      ...prev,
      rmse: data.pair.expectedRmse,
      totalMatches: data.pair.expectedMatches,
      inliers: Math.floor(data.pair.expectedMatches * (data.pair.expectedInlierRatio / 100)),
      inlierRatio: data.pair.expectedInlierRatio,
      transformation: data.pair.transformation,
    }));
  };

  // Start Registration Process
  const handleStartRegistration = () => {
    if (!referenceImage || !sourceImage) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setRegistrationComplete(false);
    setActiveScreen('processing');

    // Synthesize match points
    const points = generateSyntheticMatchPoints(120, metrics.inlierRatio / 100, metrics.transformation);
    setMatchPoints(points);

    // Synthesize registered aligned image
    generateRegisteredCompositedImage(
      sourceImage.url,
      metrics.transformation,
      600,
      600,
      (registeredUrl) => {
        setRegisteredImageUrl(registeredUrl);
      }
    );
  };

  // Processing Progress Animation Timer
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) return 100;
        // Smooth progressive increments
        const increment = prev < 30 ? 3.5 : prev < 70 ? 2.5 : prev < 90 ? 4.0 : 5.0;
        const next = prev + increment;
        return next >= 100 ? 100 : next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Handle completion when progress reaches 100% -> Automatically switch to the next page (Results)
  useEffect(() => {
    if (processingProgress < 100 || !isProcessing) return;

    setRegistrationComplete(true);

    // Generate guaranteed unique ID with millisecond timestamp + random salt
    const uniqueRunId = `#LUN-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

    // Log in history
    const newRecord: HistoryRecord = {
      id: uniqueRunId,
      date: new Date().toISOString().substring(0, 16).replace('T', ' '),
      referenceSensor,
      sourceSensor,
      referenceName: referenceImage?.name || 'Reference Frame',
      sourceName: sourceImage?.name || 'Source Frame',
      rmse: `${metrics.rmse.toFixed(2)} px`,
      matches: metrics.totalMatches,
      inlierRatio: `${metrics.inlierRatio.toFixed(2)}%`,
      status: 'SUCCESS',
      targetRegion: referenceImage?.targetRegion || 'Lunar Observation',
    };
    saveToHistory(newRecord);

    // Auto-transition to Results screen after brief confirmation delay so user sees 100% completion
    const timer = setTimeout(() => {
      setIsProcessing(false);
      startTransition(() => {
        setActiveScreen('results');
      });
    }, 850);

    return () => clearTimeout(timer);
  }, [processingProgress, isProcessing, referenceSensor, sourceSensor, referenceImage, sourceImage, metrics, saveToHistory]);

  // Fast forward / Skip button - immediately completes and opens results
  const handleFastForward = () => {
    setProcessingProgress(100);
    setIsProcessing(false);
    setRegistrationComplete(true);

    if (referenceImage && sourceImage && !registeredImageUrl) {
      generateRegisteredCompositedImage(
        sourceImage.url,
        metrics.transformation,
        600,
        600,
        (registeredUrl) => {
          setRegisteredImageUrl(registeredUrl);
        }
      );
    }

    startTransition(() => {
      setActiveScreen('results');
    });
  };

  // Reset all
  const handleReset = () => {
    setIsProcessing(false);
    setProcessingProgress(0);
    setRegistrationComplete(false);
    setActiveScreen('registration');
    handleLoadSample('shackleton_south_pole');
  };

  // Select a historical run
  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setReferenceSensor(record.referenceSensor);
    setSourceSensor(record.sourceSensor);

    const data = getSampleImages(
      record.targetRegion.includes('Tycho') 
        ? 'tycho_central_peak' 
        : record.targetRegion.includes('Orientale') 
        ? 'mare_orientale_basin' 
        : 'shackleton_south_pole'
    );
    setReferenceImage(data.reference);
    setSourceImage(data.source);
    setRegistrationComplete(true);

    const points = generateSyntheticMatchPoints(120, parseFloat(record.inlierRatio) / 100, data.pair.transformation);
    setMatchPoints(points);

    generateRegisteredCompositedImage(data.source.url, data.pair.transformation, 600, 600, (url) => {
      setRegisteredImageUrl(url);
    });

    setIsHistoryModalOpen(false);
    setActiveScreen('results');
  };

  const isReadyToRegister = !!referenceImage && !!sourceImage;

  return (
    <div className="min-h-screen bg-[#050812] text-slate-100 flex flex-col relative selection:bg-[#35C6F4]/30 selection:text-[#35C6F4] font-sans antialiased">
      
      {/* Background with stars & cosmic grid */}
      <StarBackground />

      {/* Main Navbar */}
      <Navbar
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          if (screen === 'history') {
            setIsHistoryModalOpen(true);
            return;
          }

          // If navigating to results-dependent screens, ensure registered image and match points are available
          if (screen === 'results' || screen === 'comparison' || screen === 'analysis') {
            if (!referenceImage || !sourceImage) {
              const defaultData = getSampleImages('shackleton_south_pole');
              setReferenceImage(defaultData.reference);
              setSourceImage(defaultData.source);
              setReferenceSensor(defaultData.pair.referenceSensor);
              setSourceSensor(defaultData.pair.sourceSensor);
            }
            if (!registeredImageUrl && sourceImage) {
              const points = generateSyntheticMatchPoints(120, metrics.inlierRatio / 100, metrics.transformation);
              setMatchPoints(points);
              generateRegisteredCompositedImage(
                sourceImage.url,
                metrics.transformation,
                600,
                600,
                (registeredUrl) => {
                  setRegisteredImageUrl(registeredUrl);
                }
              );
            }
            setRegistrationComplete(true);
          }

          startTransition(() => {
            setActiveScreen(screen);
          });
        }}
        canNavigateResults={registrationComplete}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
      />

      {/* Main App Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10 space-y-6">
        
        {/* Unified Pipeline Workflow Stepper (All Pages) */}
        <div className="w-full bg-[#0B1220]/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xl">
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4 font-mono text-xs">
            
            {/* Step 1: Registration / Upload */}
            <button
              type="button"
              id="workflow-step-registration"
              onClick={() => {
                startTransition(() => setActiveScreen('registration'));
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeScreen === 'registration'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">1</span>
              <span>Input &amp; Sensors</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">→</span>

            {/* Step 2: Processing & 3D Moon */}
            <button
              type="button"
              id="workflow-step-processing"
              onClick={() => {
                startTransition(() => setActiveScreen('processing'));
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeScreen === 'processing'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">2</span>
              <span>3D Processing</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">→</span>

            {/* Step 3: Results */}
            <button
              type="button"
              id="workflow-step-results"
              onClick={() => {
                if (!registrationComplete) {
                  setRegistrationComplete(true);
                  if (!registeredImageUrl && sourceImage) {
                    const points = generateSyntheticMatchPoints(120, metrics.inlierRatio / 100, metrics.transformation);
                    setMatchPoints(points);
                    generateRegisteredCompositedImage(sourceImage.url, metrics.transformation, 600, 600, (url) => setRegisteredImageUrl(url));
                  }
                }
                startTransition(() => setActiveScreen('results'));
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeScreen === 'results'
                  ? 'bg-[#35D07F] text-black font-bold shadow-md ring-1 ring-[#35D07F]'
                  : registrationComplete
                  ? 'text-[#35D07F] hover:bg-slate-800/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">3</span>
              <span>Alignment Results</span>
              {registrationComplete && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>

            <span className="text-slate-700 hidden sm:inline">→</span>

            {/* Step 4: Comparison Slider */}
            <button
              type="button"
              id="workflow-step-comparison"
              onClick={() => {
                if (!registrationComplete) {
                  setRegistrationComplete(true);
                  if (!registeredImageUrl && sourceImage) {
                    const points = generateSyntheticMatchPoints(120, metrics.inlierRatio / 100, metrics.transformation);
                    setMatchPoints(points);
                    generateRegisteredCompositedImage(sourceImage.url, metrics.transformation, 600, 600, (url) => setRegisteredImageUrl(url));
                  }
                }
                startTransition(() => setActiveScreen('comparison'));
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeScreen === 'comparison'
                  ? 'bg-[#35C6F4] text-black font-bold shadow-md ring-1 ring-[#35C6F4]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">4</span>
              <span>Comparison Slider</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">→</span>

            {/* Step 5: Deep Analysis */}
            <button
              type="button"
              id="workflow-step-analysis"
              onClick={() => {
                if (!registrationComplete) {
                  setRegistrationComplete(true);
                  if (!registeredImageUrl && sourceImage) {
                    const points = generateSyntheticMatchPoints(120, metrics.inlierRatio / 100, metrics.transformation);
                    setMatchPoints(points);
                    generateRegisteredCompositedImage(sourceImage.url, metrics.transformation, 600, 600, (url) => setRegisteredImageUrl(url));
                  }
                }
                startTransition(() => setActiveScreen('analysis'));
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeScreen === 'analysis'
                  ? 'bg-[#7C8CFF] text-black font-bold shadow-md ring-1 ring-[#7C8CFF]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">5</span>
              <span>Deep Analysis</span>
            </button>

          </div>
        </div>
        
        {/* ========================================================================= */}
        {/* SCREEN 1: REGISTRATION (Upload & Configure)                                */}
        {/* ========================================================================= */}
        {activeScreen === 'registration' && (
          <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
            
            {/* Header / Hero */}
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35C6F4]/10 border border-[#35C6F4]/30 text-xs font-mono text-[#35C6F4]">
                <Orbit className="w-3.5 h-3.5" />
                <span>CHANDRAYAAN-2 MULTI-MODAL OPTICAL REGISTRATION</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                LUNAR IMAGE REGISTRATION
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-mono text-[#35C6F4] font-medium">
                <span>Multi-modal</span>
                <span className="text-slate-600">•</span>
                <span>Scale Invariant</span>
                <span className="text-slate-600">•</span>
                <span>Sun Angle Robust</span>
              </div>

              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-sans">
                Upload two observations of the same lunar region to begin correspondence analysis, multi-sensor feature matching, and sub-pixel alignment.
              </p>
            </div>

            {/* Upload Cards Grid: Reference vs Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Reference Card */}
              <div className="space-y-3">
                <UploadCard
                  type="reference"
                  title="Reference"
                  image={referenceImage}
                  sensor={referenceSensor}
                  onImageChange={setReferenceImage}
                  onLoadPreset={() => {
                    const data = getSampleImages('shackleton_south_pole');
                    setReferenceImage(data.reference);
                    setReferenceSensor(data.pair.referenceSensor);
                  }}
                />

                <SensorSelector
                  label="REFERENCE SENSOR"
                  selectedSensor={referenceSensor}
                  onChange={setReferenceSensor}
                  idPrefix="ref"
                />
              </div>

              {/* Source Card */}
              <div className="space-y-3">
                <UploadCard
                  type="source"
                  title="Source"
                  image={sourceImage}
                  sensor={sourceSensor}
                  onImageChange={setSourceImage}
                  onLoadPreset={() => {
                    const data = getSampleImages('shackleton_south_pole');
                    setSourceImage(data.source);
                    setSourceSensor(data.pair.sourceSensor);
                  }}
                />

                <SensorSelector
                  label="SOURCE SENSOR"
                  selectedSensor={sourceSensor}
                  onChange={setSourceSensor}
                  idPrefix="src"
                />
              </div>

            </div>

            {/* Quick Observation Preset Bar */}
            <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-4 h-4 text-[#35C6F4]" />
                <span className="font-semibold">Quick Test Datasets:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {SAMPLE_PAIRS.map((pair) => (
                  <button
                    key={pair.id}
                    type="button"
                    onClick={() => handleLoadSample(pair.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#050812] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-[#35C6F4]/50 transition-all text-left"
                  >
                    <span className="text-white font-medium">{pair.name.split('—')[0]}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({pair.referenceSensor} → {pair.sourceSensor})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Action Button (PRD Section 11) */}
            <div className="flex flex-col items-center justify-center pt-2 space-y-3">
              <button
                type="button"
                id="begin-registration-btn"
                disabled={!isReadyToRegister}
                onClick={handleStartRegistration}
                className={`w-full max-w-md py-4 px-8 rounded-2xl font-mono text-sm sm:text-base font-bold flex items-center justify-center gap-3 transition-all shadow-2xl ${
                  isReadyToRegister
                    ? 'bg-gradient-to-r from-[#35C6F4] via-[#7C8CFF] to-[#35C6F4] bg-[length:200%_auto] hover:bg-right text-black shadow-[#35C6F4]/20 hover:scale-[1.02] cursor-pointer glow-cyan'
                    : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isReadyToRegister ? '◉ BEGIN REGISTRATION →' : 'UPLOAD BOTH IMAGES TO BEGIN'}</span>
              </button>

              <p className="text-xs text-slate-500 font-mono text-center">
                Simulates multi-scale pyramid alignment, 3D multi-modal rotation, and sub-pixel correspondence
              </p>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: PROCESSING (Three 3D Moons, Feature Matching & Pipeline)         */}
        {/* ========================================================================= */}
        {activeScreen === 'processing' && (
          <ProcessingView
            progress={processingProgress}
            isProcessing={isProcessing}
            onFastForward={handleFastForward}
            onComplete={handleFastForward}
            onGoToResults={() => {
              if (!registrationComplete) {
                setRegistrationComplete(true);
                if (!registeredImageUrl && sourceImage) {
                  const points = generateSyntheticMatchPoints(120, metrics.inlierRatio / 100, metrics.transformation);
                  setMatchPoints(points);
                  generateRegisteredCompositedImage(sourceImage.url, metrics.transformation, 600, 600, (url) => setRegisteredImageUrl(url));
                }
              }
              startTransition(() => {
                setActiveScreen('results');
              });
            }}
            onRerunRegistration={() => {
              setIsProcessing(true);
              setProcessingProgress(0);
              setRegistrationComplete(false);
            }}
            referenceSensor={referenceSensor}
            sourceSensor={sourceSensor}
            referenceName={referenceImage?.name}
            sourceName={sourceImage?.name}
            referenceImageUrl={referenceImage?.url}
            sourceImageUrl={sourceImage?.url}
          />
        )}

        {/* ========================================================================= */}
        {/* SCREEN 3: RESULTS (Registered Image, Match Points & Telemetry Metrics)     */}
        {/* ========================================================================= */}
        {activeScreen === 'results' && referenceImage && sourceImage && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                    <span>REGISTRATION COMPLETE</span>
                    <span className="text-[#35D07F] text-base">✓ SUCCESS</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Multi-modal correspondence aligned for {referenceImage.targetRegion || 'Lunar South Pole'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="nav-to-comparison-btn"
                  onClick={() => setActiveScreen('comparison')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#35C6F4]/20 hover:bg-[#35C6F4]/30 text-[#35C6F4] border border-[#35C6F4]/40 font-mono text-xs font-semibold transition-all glow-cyan-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Inspect Comparison Slider →</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Cards (PRD Section 21) */}
            <MetricsCards metrics={metrics} />

            {/* Three Image Layout: Reference | Source | Registered (PRD Section 19) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold uppercase tracking-wider">
                  OBSERVATION ALIGNMENT TRIPLE
                </span>
                <span className="text-slate-500">
                  Reference [{referenceSensor}] • Source [{sourceSensor}] • Registered Result
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Reference Image */}
                <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#35C6F4]/15 text-[#35C6F4] font-bold border border-[#35C6F4]/30">
                      REFERENCE [{referenceImage.sensor}]
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {referenceImage.width}×{referenceImage.height}
                    </span>
                  </div>

                  <div className="aspect-square bg-black rounded-xl overflow-hidden border border-slate-800 relative group">
                    <img
                      src={referenceImage.url}
                      alt="Reference Frame"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
                      Base Frame
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 truncate" title={referenceImage.name}>
                    {referenceImage.name}
                  </div>
                </div>

                {/* 2. Source Image (Raw Unaligned) */}
                <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#7C8CFF]/15 text-[#7C8CFF] font-bold border border-[#7C8CFF]/30">
                      SOURCE [{sourceImage.sensor}]
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {sourceImage.width}×{sourceImage.height}
                    </span>
                  </div>

                  <div className="aspect-square bg-black rounded-xl overflow-hidden border border-slate-800 relative group">
                    <img
                      src={sourceImage.url}
                      alt="Source Frame"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-slate-300">
                      Unaligned Frame
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 truncate" title={sourceImage.name}>
                    {sourceImage.name}
                  </div>
                </div>

                {/* 3. Registered Image (Aligned to Reference Space) */}
                <div className="bg-[#0B1220] border border-[#35D07F]/40 rounded-2xl p-3.5 space-y-2 relative shadow-lg">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#35D07F]/15 text-[#35D07F] font-bold border border-[#35D07F]/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>REGISTERED [{sourceImage.sensor}]</span>
                    </span>
                    <span className="text-[#35D07F] font-bold text-[10px]">
                      RMSE: {metrics.rmse.toFixed(2)} px
                    </span>
                  </div>

                  <div className="aspect-square bg-black rounded-xl overflow-hidden border border-[#35D07F]/30 relative group">
                    <img
                      src={registeredImageUrl || sourceImage.url}
                      alt="Registered Frame"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#35D07F] border border-[#35D07F]/30">
                      Sub-pixel Aligned
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Homography warped</span>
                    <span className="text-[#35D07F]">Ready</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Match Point Correspondence Visualizer (PRD Section 20) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold uppercase tracking-wider">
                  CORRESPONDENCE POINTS &amp; INLIER DETECTION
                </span>
                <span className="text-[#35C6F4]">
                  {matchPoints.length} Points Extracted
                </span>
              </div>

              <CorrespondenceVisualizer
                referenceImage={referenceImage}
                sourceImage={sourceImage}
                matchPoints={matchPoints}
                showInliers={showInliers}
                showOutliers={showOutliers}
                showConnections={showConnections}
                pointLimit={pointLimit}
                opacity={pointOpacity}
                onToggleInliers={setShowInliers}
                onToggleOutliers={setShowOutliers}
                onToggleConnections={setShowConnections}
                onPointLimitChange={setPointLimit}
                onOpacityChange={setPointOpacity}
                showControls={false}
              />
            </div>

            {/* Geometric Transformation & Download Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <TransformationCard transformation={metrics.transformation} />
              </div>
              <div className="lg:col-span-6">
                <DownloadButtons
                  referenceImage={referenceImage}
                  sourceImage={sourceImage}
                  registeredImageUrl={registeredImageUrl || sourceImage.url}
                  metrics={metrics}
                  matchPoints={matchPoints}
                />
              </div>
            </div>

            {/* Section Bottom Inter-Navigation */}
            <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveScreen('registration')}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                ← Back to Upload &amp; Sensors
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('processing')}
                  className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  View 3D Orbit Reconstruction
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScreen('comparison')}
                  className="px-4 py-2 rounded-xl bg-[#35C6F4] hover:bg-[#35C6F4]/90 text-black font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <span>Proceed to Comparison Slider</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: COMPARISON / ANALYSIS (Overlay Slider, Heatmaps & Filters)       */}
        {/* ========================================================================= */}
        {activeScreen === 'comparison' && referenceImage && sourceImage && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                  COMPARISON &amp; ALIGNMENT VERIFICATION
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Interactive multi-spectral inspection tools between Reference and Registered frames
                </p>
              </div>

              {/* Sub-tabs (PRD Section 22) */}
              <div className="flex flex-wrap items-center gap-1 bg-[#0B1220] p-1 rounded-xl border border-slate-800 font-mono text-xs">
                {(['OVERLAY', 'DIFFERENCE', 'REFERENCE', 'SOURCE', 'REGISTERED'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    id={`compare-tab-${tab.toLowerCase()}`}
                    onClick={() => setActiveCompareTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeCompareTab === tab
                        ? 'bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/40 font-semibold glow-cyan-sm'
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
                <div className="text-sm font-bold font-mono text-[#35C6F4]">
                  REFERENCE FRAME [{referenceImage.sensor}]: {referenceImage.name}
                </div>
                <div className="max-w-xl mx-auto aspect-square rounded-xl overflow-hidden border border-slate-800">
                  <img src={referenceImage.url} alt="Reference" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <p className="text-xs text-slate-400 font-mono">{referenceImage.width} × {referenceImage.height} px • {referenceImage.sizeFormatted}</p>
              </div>
            )}

            {activeCompareTab === 'SOURCE' && (
              <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="text-sm font-bold font-mono text-[#7C8CFF]">
                  SOURCE FRAME (RAW UNALIGNED) [{sourceImage.sensor}]: {sourceImage.name}
                </div>
                <div className="max-w-xl mx-auto aspect-square rounded-xl overflow-hidden border border-slate-800">
                  <img src={sourceImage.url} alt="Source" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <p className="text-xs text-slate-400 font-mono">{sourceImage.width} × {sourceImage.height} px • {sourceImage.sizeFormatted}</p>
              </div>
            )}

            {activeCompareTab === 'REGISTERED' && (
              <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <div className="text-sm font-bold font-mono text-[#35D07F]">
                  REGISTERED FRAME (TRANSFORMED &amp; ALIGNED) [{sourceImage.sensor}]
                </div>
                <div className="max-w-xl mx-auto aspect-square rounded-xl overflow-hidden border border-[#35D07F]/40 shadow-lg">
                  <img src={registeredImageUrl || sourceImage.url} alt="Registered" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <p className="text-xs text-slate-400 font-mono">RMSE: {metrics.rmse.toFixed(2)} px • Sub-pixel Precision: 0.08 px</p>
              </div>
            )}

            {/* Quick Metrics Bar & Export */}
            <MetricsCards metrics={metrics} />
            <DownloadButtons
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              registeredImageUrl={registeredImageUrl || sourceImage.url}
              metrics={metrics}
              matchPoints={matchPoints}
            />

            {/* Section Bottom Inter-Navigation */}
            <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveScreen('results')}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                ← Back to Results Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('analysis')}
                className="px-4 py-2 rounded-xl bg-[#7C8CFF] hover:bg-[#7C8CFF]/90 text-black font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>Open Deep Correspondence Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: ANALYSIS (Full Interactive Match Points & Filters)               */}
        {/* ========================================================================= */}
        {activeScreen === 'analysis' && referenceImage && sourceImage && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                  CORRESPONDENCE &amp; INLIER ANALYSIS
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Interactive spatial verification, RANSAC outlier filtering, and sub-pixel displacement inspection
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveScreen('comparison')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35C6F4]/10 hover:bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/30 font-mono text-xs"
              >
                <span>Comparison Slider View →</span>
              </button>
            </div>

            <CorrespondenceVisualizer
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              matchPoints={matchPoints}
              showInliers={showInliers}
              showOutliers={showOutliers}
              showConnections={showConnections}
              pointLimit={pointLimit}
              opacity={pointOpacity}
              onToggleInliers={setShowInliers}
              onToggleOutliers={setShowOutliers}
              onToggleConnections={setShowConnections}
              onPointLimitChange={setPointLimit}
              onOpacityChange={setPointOpacity}
              showControls={true}
            />

            <TransformationCard transformation={metrics.transformation} />
            
            <DownloadButtons
              referenceImage={referenceImage}
              sourceImage={sourceImage}
              registeredImageUrl={registeredImageUrl || sourceImage.url}
              metrics={metrics}
              matchPoints={matchPoints}
            />

            {/* Section Bottom Inter-Navigation */}
            <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveScreen('comparison')}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                ← Back to Comparison View
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('registration')}
                className="px-4 py-2 rounded-xl bg-[#35C6F4] hover:bg-[#35C6F4]/90 text-black font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Start New Registration</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#050812]/90 py-4 px-4 sm:px-6 lg:px-8 mt-auto z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-[#35C6F4] font-semibold">LUNARIS</span>
            <span>•</span>
            <span>Chandrayaan-2 Lunar Image Registration Prototype</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">Prototype Demonstration System</span>
            <span>•</span>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="text-[#35C6F4] hover:underline"
            >
              Mission Specs
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-[#35C6F4] hover:underline"
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
        onSelectRecord={handleSelectHistoryRecord}
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
