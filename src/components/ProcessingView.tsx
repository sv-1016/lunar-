import React, { useEffect, useState } from 'react';
import { SensorType } from '../types';
import { ThreeMoonCanvas } from './ThreeMoonCanvas';
import { GoogleMoonGlobe } from './GoogleMoonGlobe';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Cpu, 
  Zap, 
  Orbit, 
  Terminal, 
  Check, 
  FastForward, 
  Sparkles,
  Layers,
  Sun,
  Globe,
  Satellite,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Crosshair,
  Radio,
  HelpCircle,
  Activity
} from 'lucide-react';

interface ProcessingViewProps {
  progress: number;
  isProcessing?: boolean;
  onFastForward: () => void;
  onComplete?: () => void;
  onGoToResults?: () => void;
  onRerunRegistration?: () => void;
  referenceSensor: SensorType;
  sourceSensor: SensorType;
  referenceName?: string;
  sourceName?: string;
}

interface StepItem {
  id: number;
  label: string;
  minProgress: number;
  maxProgress: number;
  description: string;
}

const STEPS: StepItem[] = [
  { id: 1, label: 'Loading images', minProgress: 0, maxProgress: 15, description: 'Parsing radiometric metadata & image matrices' },
  { id: 2, label: 'Image preprocessing', minProgress: 15, maxProgress: 30, description: 'Band-pass noise filtering & contrast enhancement' },
  { id: 3, label: 'Illumination normalization', minProgress: 30, maxProgress: 45, description: 'Compensating solar azimuth & low-phase shadow angles' },
  { id: 4, label: 'Scale analysis', minProgress: 45, maxProgress: 65, description: 'Computing multi-scale Gaussian pyramid representations' },
  { id: 5, label: 'Finding correspondence points', minProgress: 65, maxProgress: 80, description: 'SuperPoint deep descriptor extraction & cross-matching' },
  { id: 6, label: 'Geometric alignment', minProgress: 80, maxProgress: 95, description: 'Robust RANSAC homography estimation & outlier rejection' },
  { id: 7, label: 'Sub-pixel refinement', minProgress: 95, maxProgress: 100, description: 'Lucas-Kanade gradient optimization (0.08 px precision)' },
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  progress,
  isProcessing = false,
  onFastForward,
  onComplete,
  onGoToResults,
  onRerunRegistration,
  referenceSensor,
  sourceSensor,
  referenceName = 'Reference Frame',
  sourceName = 'Source Frame',
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [active3DView, setActive3DView] = useState<'google_globe' | 'triple_sensors'>('google_globe');
  const [isInspectionMode, setIsInspectionMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'phases' | 'telemetry'>('phases');

  // Auto-switch to Results page ONLY when an active registration run reaches 100%
  useEffect(() => {
    // If not currently in an active processing run or progress is incomplete, do NOT auto-switch
    if (!isProcessing || progress < 100) return;

    // Small delay so user sees completion before transition
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isProcessing, progress, onComplete]);

  // Keyboard shortcut listener for Inspection Mode (I to toggle, ESC to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        setIsInspectionMode((prev) => !prev);
      } else if (e.key === 'Escape' && isInspectionMode) {
        setIsInspectionMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectionMode]);

  useEffect(() => {
    // Generate realistic telemetry terminal log messages based on progress
    const newLogs: string[] = [
      `[00:00.02] Initializing LUNARIS Core Registration Engine v1.0`,
      `[00:00.08] Loaded Reference Sensor: ISRO Chandrayaan-2 ${referenceSensor}`,
      `[00:00.12] Loaded Source Sensor: ISRO Chandrayaan-2 ${sourceSensor}`,
    ];

    if (progress >= 15) {
      newLogs.push(`[00:00.35] Preprocessing 2048x2048 observation matrices... OK`);
      newLogs.push(`[00:00.48] Spatial resolution ratio calculated: 1.82x`);
    }
    if (progress >= 35) {
      newLogs.push(`[00:00.72] Normalizing solar incidence angle (Phase angle delta: 22.4°)`);
      newLogs.push(`[00:00.85] Equalizing lunar regolith reflectance profile`);
    }
    if (progress >= 55) {
      newLogs.push(`[00:01.12] Multi-scale crater edge pyramid constructed (L0 to L4)`);
      newLogs.push(`[00:01.30] Extracting invariant keypoint descriptors...`);
    }
    if (progress >= 75) {
      newLogs.push(`[00:01.65] 1,284 tentative correspondence pairs detected`);
      newLogs.push(`[00:01.82] Running RANSAC spatial verification (Inliers: 1,047 / 81.46%)`);
    }
    if (progress >= 90) {
      newLogs.push(`[00:02.10] Homography Matrix converged: Rotation +14.62°, Scale 1.82x`);
      newLogs.push(`[00:02.30] Performing sub-pixel Lucas-Kanade refinement`);
    }
    if (progress >= 100) {
      newLogs.push(`[00:02.45] ✓ REGISTRATION COMPLETE // RMSE: 0.73 px // Alignment verified`);
    }

    setLogs(newLogs);
  }, [progress, referenceSensor, sourceSensor]);

  const currentStep = STEPS.find((s) => progress >= s.minProgress && progress <= s.maxProgress) || STEPS[STEPS.length - 1];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12 animate-in fade-in duration-500 relative">
      
      {/* Top Header & View Controls Bar */}
      <div 
        className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-500 ${
          isInspectionMode 
            ? 'opacity-30 blur-[1px] hover:opacity-100 hover:blur-none' 
            : 'opacity-100'
        }`}
      >
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35C6F4]/10 border border-[#35C6F4]/30 text-xs font-mono text-[#35C6F4]">
            <Orbit className="w-3.5 h-3.5 animate-spin-slow" />
            <span>MULTI-MODAL LUNAR CORRESPONDENCE ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Analyzing Lunar Surface &amp; Alignment
          </h2>
          <p className="text-sm text-slate-400 font-mono">
            Matching {referenceSensor} (Reference) with {sourceSensor} (Source) • Sub-pixel Registration
          </p>
        </div>

        {/* 3D Mode Selector & Inspection Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0B1220] p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          
          {/* Inspection Mode Button */}
          <button
            type="button"
            id="toggle-inspection-mode-header-btn"
            onClick={() => setIsInspectionMode(!isInspectionMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all duration-300 ${
              isInspectionMode
                ? 'bg-gradient-to-r from-[#35C6F4]/30 to-[#35D07F]/30 text-[#35D07F] border border-[#35D07F]/60 shadow-[0_0_20px_rgba(53,208,127,0.3)] font-bold'
                : 'bg-slate-800/80 text-[#35C6F4] hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {isInspectionMode ? <EyeOff className="w-4 h-4 text-[#35D07F]" /> : <Eye className="w-4 h-4 text-[#35C6F4]" />}
            <span>{isInspectionMode ? 'Exit Inspection' : '🔬 Inspect Mode'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 font-mono">
              I
            </kbd>
          </button>

          <button
            type="button"
            id="view-google-globe-btn"
            onClick={() => setActive3DView('google_globe')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              active3DView === 'google_globe'
                ? 'bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/50 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Google Earth</span> 3D Moon
          </button>

          <button
            type="button"
            id="view-triple-sensors-btn"
            onClick={() => setActive3DView('triple_sensors')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
              active3DView === 'triple_sensors'
                ? 'bg-[#7C8CFF]/20 text-[#7C8CFF] border border-[#7C8CFF]/50 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Satellite className="w-4 h-4" />
            <span>3-Sensor Fleet</span>
          </button>

          {isProcessing ? (
            <button
              id="fast-forward-btn"
              onClick={onFastForward}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-mono text-[#35C6F4] border border-slate-700 transition-all ml-1"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>
          ) : progress >= 100 && onGoToResults ? (
            <button
              id="go-to-results-header-btn"
              onClick={onGoToResults}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#35D07F] hover:bg-[#35D07F]/90 text-xs font-mono text-black font-bold transition-all ml-1 shadow-md cursor-pointer"
            >
              <span>View Results →</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Floating Inspection Mode Notification Banner */}
      {isInspectionMode && (
        <div className="bg-gradient-to-r from-[#0B1220]/95 via-[#0A1A2E]/95 to-[#0B1220]/95 backdrop-blur-xl border border-[#35C6F4]/50 rounded-2xl p-3.5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-[#35C6F4] animate-spin-slow" />
              <span className="absolute w-2 h-2 rounded-full bg-[#35D07F] animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide">INSPECTION MODE ACTIVE</span>
                <span className="px-2 py-0.5 rounded-full bg-[#35D07F]/20 text-[#35D07F] text-[10px] font-bold border border-[#35D07F]/40">
                  UI DIMMED FOR FOCUS
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Rotate, pan, and zoom into crater formations while background registration computes continuously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Progress Ticker */}
            <div className="flex items-center gap-2 bg-[#050812] px-3 py-1.5 rounded-xl border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-[#35C6F4] animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400">Background Progress:</span>
                <span className="text-white font-bold">
                  Step {currentStep.id}/7: <span className="text-[#35C6F4]">{currentStep.label}</span> ({Math.floor(progress)}%)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsInspectionMode(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 hover:border-[#35C6F4]/50 transition-all flex items-center gap-1.5 shadow-md"
            >
              <Minimize2 className="w-3.5 h-3.5 text-[#35C6F4]" />
              <span>Exit (ESC)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN SPLIT LAYOUT: ROTATING MOON (LEFT) | REGISTRATION ENGINE STATUS (RIGHT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT SIDE: 3D ROTATING MOON GLOBE (7 COLS ON DESKTOP) */}
        <div 
          className={`lg:col-span-7 flex flex-col transition-all duration-700 ${
            isInspectionMode 
              ? 'lg:col-span-8 ring-2 ring-[#35C6F4]/50 rounded-2xl shadow-[0_0_60px_rgba(53,198,244,0.2)]' 
              : ''
          }`}
        >
          {active3DView === 'google_globe' ? (
            <div className="h-full flex flex-col">
              <GoogleMoonGlobe
                progress={progress}
                isProcessing={progress < 100}
                referenceSensor={referenceSensor}
                sourceSensor={sourceSensor}
                className="w-full h-[580px] lg:h-[650px] xl:h-[690px] flex-1"
                isInspectionMode={isInspectionMode}
                onToggleInspectionMode={() => setIsInspectionMode(!isInspectionMode)}
                onFastForward={onFastForward}
                currentStepLabel={currentStep.label}
              />
            </div>
          ) : (
            <div className="bg-[#0B1220]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between backdrop-blur-md overflow-hidden h-full min-h-[580px] lg:min-h-[650px]">
              
              {/* Sensor Moons Header & Labels */}
              <div className="grid grid-cols-3 text-center mb-2 z-10 relative">
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-bold font-mono text-[#35C6F4] flex items-center justify-center gap-1">
                    <span>OHRC</span>
                    <span className="text-[10px] opacity-70">↻ Slow</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                    0.25m High-Res Panchromatic
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-bold font-mono text-[#7C8CFF] flex items-center justify-center gap-1">
                    <span>TMC-2</span>
                    <span className="text-[10px] opacity-70">⟳ Med</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                    5.0m 3-View Stereo DEM
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-bold font-mono text-[#35D07F] flex items-center justify-center gap-1">
                    <span>IIRS</span>
                    <span className="text-[10px] opacity-70">↺ Slow</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                    0.8–5.0µm Hyperspectral
                  </p>
                </div>
              </div>

              {/* 3D WebGL Multi-Moon Scene */}
              <div className="w-full flex-1 min-h-[380px] my-2">
                <ThreeMoonCanvas 
                  progress={progress} 
                  isProcessing={progress < 100} 
                  showCorrespondenceLaser={true}
                  className="w-full h-full min-h-[380px]"
                  isInspectionMode={isInspectionMode}
                  onToggleInspectionMode={() => setIsInspectionMode(!isInspectionMode)}
                />
              </div>

              {/* Animated Laser Indicator Banner */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-3 mt-auto">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#35C6F4] animate-ping" />
                  <span className="text-slate-300">Correspondence Inter-Sensor Beams Active</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInspectionMode(!isInspectionMode)}
                    className="text-[10px] text-[#35C6F4] hover:underline"
                  >
                    {isInspectionMode ? 'Exit Inspection' : 'Inspect Sensors'}
                  </button>
                  <span className="text-[10px] text-slate-500">
                    Interactive WebGL Viewport
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: REGISTRATION ENGINE STATUS & LIVE MISSION TELEMETRY (5 COLS ON DESKTOP) */}
        <div 
          className={`lg:col-span-5 flex flex-col gap-4 transition-all duration-700 ${
            isInspectionMode 
              ? 'lg:col-span-4 opacity-25 blur-[1.5px] scale-[0.98] pointer-events-none select-none hover:opacity-90 hover:blur-none hover:scale-100 hover:pointer-events-auto' 
              : 'opacity-100'
          }`}
        >
          
          {/* Card 1: REGISTRATION ENGINE STATUS & PIPELINE PHASES */}
          <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex-1 flex flex-col">
            
            {/* Header with Progress % or Success Banner */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-[#35C6F4] tracking-wider uppercase flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  REGISTRATION ENGINE STATUS
                </span>
                <span className={`text-lg font-bold ${progress >= 100 ? 'text-[#35D07F]' : 'text-white'}`}>
                  {Math.floor(progress)}%
                </span>
              </div>

              {/* Glowing Progress Bar */}
              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className="h-full bg-gradient-to-r from-[#35C6F4] via-[#7C8CFF] to-[#35D07F] transition-all duration-300 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[2px] animate-pulse" />
                </div>
              </div>

              {/* Registration Finished Banner */}
              {progress >= 100 && (
                <div className="p-3 rounded-xl bg-[#35D07F]/15 border border-[#35D07F]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#35D07F] shrink-0" />
                    <div>
                      <span className="text-[#35D07F] font-bold block">
                        {isProcessing ? 'Registration Complete! Switching to Results...' : 'Registration Complete — 3D Inspection Stage'}
                      </span>
                      {!isProcessing && (
                        <span className="text-slate-400 text-[10px]">
                          Free orbit inspection enabled. All correspondence phases verified.
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {onRerunRegistration && !isProcessing && (
                      <button
                        type="button"
                        onClick={onRerunRegistration}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-all cursor-pointer"
                      >
                        ↻ Re-run
                      </button>
                    )}
                    {(onGoToResults || onComplete || onFastForward) && (
                      <button
                        type="button"
                        onClick={onGoToResults || onComplete || onFastForward}
                        className="px-3 py-1 rounded-lg bg-[#35D07F] text-black font-bold text-[11px] hover:bg-[#35D07F]/90 transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-md"
                      >
                        <span>View Results →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pipeline Execution Phases */}
            <div className="space-y-2 pt-1 flex-1 flex flex-col justify-between">
              <div className="text-xs font-mono text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>PIPELINE EXECUTION PHASES</span>
                {progress >= 100 ? (
                  <span className="text-[10px] text-[#35D07F] font-semibold">● All 7 Phases Verified</span>
                ) : isInspectionMode ? (
                  <span className="text-[10px] text-[#35D07F]">● Computing in Background</span>
                ) : null}
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-[310px] pr-1">
                {STEPS.map((step) => {
                  const isComplete = step.id === 7 ? progress >= 100 : progress > step.maxProgress;
                  const isActive = !isComplete && progress >= step.minProgress && (step.id === 7 ? progress < 100 : progress <= step.maxProgress);
                  const isPending = progress < step.minProgress;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                        isComplete
                          ? 'bg-[#050812]/60 border-slate-800/80 text-slate-300'
                          : isActive
                          ? 'bg-[#35C6F4]/10 border-[#35C6F4]/50 shadow-md ring-1 ring-[#35C6F4]/30'
                          : 'bg-[#050812]/30 border-transparent text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-[#35D07F] shrink-0" />
                        ) : isActive ? (
                          <div className="relative flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-[#35C6F4] animate-spin" />
                            <span className="absolute w-2 h-2 rounded-full bg-[#35C6F4] animate-ping" />
                          </div>
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}

                        <div className="truncate">
                          <div className={`text-xs font-medium font-mono truncate ${isComplete ? 'text-slate-200' : isActive ? 'text-white font-bold' : 'text-slate-500'}`}>
                            {step.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {step.description}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono shrink-0 pl-2">
                        {isComplete ? (
                          <span className="text-[#35D07F] font-semibold">DONE ✓</span>
                        ) : isActive ? (
                          <span className="text-[#35C6F4] font-semibold animate-pulse">RUNNING...</span>
                        ) : (
                          <span className="text-slate-600">QUEUED</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Card 2: LIVE MISSION TELEMETRY TERMINAL */}
          <div className="bg-[#050812] border border-slate-800 rounded-2xl p-4 flex flex-col font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#35C6F4]" />
                <span className="text-[11px] font-semibold text-slate-300">LIVE MISSION TELEMETRY</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                ISRO PROTOCOL
              </span>
            </div>

            {/* Terminal stream */}
            <div className="overflow-y-auto space-y-1 text-[11px] text-slate-300 max-h-[140px] pr-1">
              {logs.map((log, index) => (
                <div 
                  key={index}
                  className={`leading-relaxed ${
                    log.includes('✓') 
                      ? 'text-[#35D07F] font-bold' 
                      : log.includes('SuperPoint') || log.includes('RANSAC')
                      ? 'text-[#35C6F4]'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
              {progress < 100 && (
                <div className="flex items-center gap-1 text-[#35C6F4] animate-pulse">
                  <span>&gt; Processing sub-pixel gradient tensor...</span>
                </div>
              )}
            </div>

            {/* Live Telemetry Target Stats Footer */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block">Target Region:</span>
                <span className="text-white font-medium truncate block">Shackleton Crater / South Pole</span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Error:</span>
                <span className="text-[#35D07F] font-semibold">~0.08 px (Sub-pixel)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
