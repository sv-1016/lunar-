import React from 'react';
import { X, Orbit, Satellite, Camera, Eye, Zap, Compass, CheckCircle2, BookOpen } from 'lucide-react';
import { SENSORS } from '../data/sensors';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-[#0B1220] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#35C6F4]/10 border border-[#35C6F4]/30 text-[#35C6F4]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                LUNARIS SCIENTIFIC &amp; MISSION GUIDE
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Chandrayaan-2 Optical Registration Methodology
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-help-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300 font-mono">
          
          {/* Section 1: Chandrayaan-2 Payloads */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#35C6F4] flex items-center gap-2">
              <Orbit className="w-4 h-4" />
              1. CHANDRAYAAN-2 OPTICAL SENSORS
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(SENSORS).map((s) => (
                <div key={s.id} className="bg-[#050812] border border-slate-800 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{s.name}</span>
                    <span className="text-[10px] text-[#35C6F4]">{s.resolution}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Multi-Modal Registration Challenges */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#7C8CFF] flex items-center gap-2">
              <Compass className="w-4 h-4" />
              2. KEY REGISTRATION CHALLENGES
            </h4>
            <div className="space-y-2 bg-[#050812] border border-slate-800 p-3.5 rounded-xl text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-[#35C6F4] font-bold">● Scale Variation:</span>
                <span>Resolutions vary from 0.25m (OHRC) to 5.0m (TMC-2) and 80m (IIRS). Requires multi-scale scale-space pyramid alignment.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#7C8CFF] font-bold">● Sun Angle &amp; Shadows:</span>
                <span>Different solar illumination azimuths create drastic crater rim shadow inversion, requiring illumination-invariant descriptors.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#35D07F] font-bold">● Sub-pixel Precision:</span>
                <span>Lunar topography DEM mapping requires sub-pixel target precision (&lt; 1.0 px RMSE, typical 0.08–0.73 px).</span>
              </div>
            </div>
          </div>

          {/* Section 3: Prototype Workflow */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#35D07F] flex items-center gap-2">
              <Zap className="w-4 h-4" />
              3. HOW TO OPERATE THIS PROTOTYPE
            </h4>
            <ol className="space-y-2 bg-[#050812] border border-slate-800 p-3.5 rounded-xl list-decimal list-inside text-[11px] leading-relaxed text-slate-300">
              <li><strong>Upload or Pick a Sample:</strong> Use the drag-and-drop boxes or click "Load Sample" at the top navbar to load Chandrayaan-2 observation pairs.</li>
              <li><strong>Select Sensors:</strong> Choose OHRC, TMC-2, or IIRS for both reference and source observations.</li>
              <li><strong>Begin Registration:</strong> Experience the 3D Three-Moon rotating visualization and simulated pipeline progress.</li>
              <li><strong>Inspect Alignment:</strong> Use the interactive Overlay Slider, Difference Heatmap, Sobel Edge detector, and correspondence point filters.</li>
              <li><strong>Export Results:</strong> Download the composited registered image, export JSON/CSV match points, or generate a mission report.</li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40 text-right px-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#35C6F4] hover:bg-[#35C6F4]/90 text-black font-semibold text-xs font-mono transition-colors"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
