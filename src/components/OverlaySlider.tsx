import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadedImage } from '../types';
import { Split, Eye, ZoomIn, Layers, Sliders } from 'lucide-react';

interface OverlaySliderProps {
  referenceImage: UploadedImage;
  registeredImageUrl: string;
  sourceImage: UploadedImage;
}

export const OverlaySlider: React.FC<OverlaySliderProps> = ({
  referenceImage,
  registeredImageUrl,
  sourceImage,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [blendOpacity, setBlendOpacity] = useState<number>(50); // 0 to 100%
  const [viewMode, setViewMode] = useState<'split' | 'fade' | 'magnifier'>('split');
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showMagnifier, setShowMagnifier] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(pct);
    },
    []
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewMode === 'split') {
      handleMove(e.clientX);
    }
    // Update magnifier position
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMagnifierPos({ x, y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && viewMode === 'split' && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      
      {/* Sub-modes for overlay */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1220] p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            id="overlay-mode-split-btn"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'split'
                ? 'bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Curtain Slider</span>
          </button>

          <button
            id="overlay-mode-fade-btn"
            onClick={() => setViewMode('fade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'fade'
                ? 'bg-[#7C8CFF]/20 text-[#7C8CFF] border border-[#7C8CFF]/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Alpha Transparency Blend</span>
          </button>

          <button
            id="overlay-mode-magnifier-btn"
            onClick={() => setViewMode('magnifier')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'magnifier'
                ? 'bg-[#35D07F]/20 text-[#35D07F] border border-[#35D07F]/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Sub-pixel Magnifier Lens</span>
          </button>
        </div>

        {/* Dynamic Parameter Slider */}
        {viewMode === 'fade' && (
          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <span>Reference</span>
            <input
              id="blend-opacity-slider"
              type="range"
              min="0"
              max="100"
              value={blendOpacity}
              onChange={(e) => setBlendOpacity(Number(e.target.value))}
              className="w-28 sm:w-36 accent-[#7C8CFF] cursor-pointer"
            />
            <span>Registered ({blendOpacity}%)</span>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        className="relative w-full aspect-square sm:aspect-[16/10] max-h-[560px] bg-[#050812] border border-slate-800 rounded-2xl overflow-hidden select-none shadow-2xl backdrop-blur-md"
      >
        {/* Layer 1: Registered Image (Base / Right side) */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={registeredImageUrl}
            alt="Registered Lunar Alignment"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#35D07F]/40 text-[11px] font-mono text-[#35D07F]">
            REGISTERED [{sourceImage.sensor}]
          </div>
        </div>

        {/* Layer 2: Split Mode - Reference Image (Clipped / Left side) */}
        {viewMode === 'split' && (
          <>
            <div
              className="absolute inset-0 h-full overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <div 
                className="absolute inset-0 h-full"
                style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
              >
                <img
                  src={referenceImage.url}
                  alt="Reference Base Frame"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#35C6F4]/40 text-[11px] font-mono text-[#35C6F4]">
                REFERENCE [{referenceImage.sensor}]
              </div>
            </div>

            {/* Split Divider Bar */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#35C6F4] shadow-[0_0_12px_#35C6F4] z-20 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div className="w-8 h-8 rounded-full bg-[#0B1220] border-2 border-[#35C6F4] shadow-lg flex items-center justify-center text-[#35C6F4] group">
                <Split className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </>
        )}

        {/* Layer 3: Fade Mode - Reference Image with Alpha Opacity */}
        {viewMode === 'fade' && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity"
            style={{ opacity: 1 - blendOpacity / 100 }}
          >
            <img
              src={referenceImage.url}
              alt="Reference Lunar Layer"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-[#35C6F4]/40 text-[11px] font-mono text-[#35C6F4]">
              REFERENCE [{referenceImage.sensor}] ({100 - blendOpacity}%)
            </div>
          </div>
        )}

        {/* Layer 4: Magnifier Mode - 2.5x High-Precision Inspection Lens */}
        {viewMode === 'magnifier' && showMagnifier && (
          <div
            className="absolute w-44 h-44 rounded-full border-2 border-[#35C6F4] shadow-[0_0_25px_rgba(53,198,244,0.5)] overflow-hidden pointer-events-none z-30 bg-black"
            style={{
              left: `${magnifierPos.x}%`,
              top: `${magnifierPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Magnified zoom of registered image */}
            <div
              className="absolute w-[250%] h-[250%]"
              style={{
                left: `-${magnifierPos.x * 2.5 - 50}%`,
                top: `-${magnifierPos.y * 2.5 - 50}%`,
              }}
            >
              <img
                src={registeredImageUrl}
                alt="Magnified Registered Lunar Surface"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Crosshair inside lens */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-[1px] bg-[#35C6F4]/70" />
              <div className="h-8 w-[1px] bg-[#35C6F4]/70 absolute" />
            </div>

            <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] font-mono bg-black/70 text-[#35C6F4]">
              2.5× SUB-PIXEL LENS
            </div>
          </div>
        )}

        {/* Stage Bottom Telemetry */}
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1 rounded-lg bg-[#050812]/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400">
          DRAG TO COMPARE ALIGNMENT • MULTI-SENSOR REGISTRATION
        </div>
      </div>
    </div>
  );
};
