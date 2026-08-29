import React, { useState, useRef, useEffect } from 'react';
import { MatchPoint, UploadedImage, SensorType } from '../types';
import { Eye, EyeOff, Filter, Sliders, CheckCircle2, XCircle, Sparkles, Check } from 'lucide-react';

interface CorrespondenceVisualizerProps {
  referenceImage: UploadedImage;
  sourceImage: UploadedImage;
  matchPoints: MatchPoint[];
  showInliers?: boolean;
  showOutliers?: boolean;
  showConnections?: boolean;
  pointLimit?: number;
  opacity?: number;
  onToggleInliers?: (val: boolean) => void;
  onToggleOutliers?: (val: boolean) => void;
  onToggleConnections?: (val: boolean) => void;
  onPointLimitChange?: (val: number) => void;
  onOpacityChange?: (val: number) => void;
  showControls?: boolean;
}

export const CorrespondenceVisualizer: React.FC<CorrespondenceVisualizerProps> = ({
  referenceImage,
  sourceImage,
  matchPoints,
  showInliers = true,
  showOutliers = true,
  showConnections = true,
  pointLimit = 80,
  opacity = 0.85,
  onToggleInliers,
  onToggleOutliers,
  onToggleConnections,
  onPointLimitChange,
  onOpacityChange,
  showControls = true,
}) => {
  const [internalShowInliers, setInternalShowInliers] = useState<boolean>(showInliers);
  const [internalShowOutliers, setInternalShowOutliers] = useState<boolean>(showOutliers);
  const [internalShowConnections, setInternalShowConnections] = useState<boolean>(showConnections);
  const [internalPointLimit, setInternalPointLimit] = useState<number>(pointLimit);
  const [internalOpacity, setInternalOpacity] = useState<number>(opacity);
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync internal state when controlled props change
  useEffect(() => {
    setInternalShowInliers(showInliers);
  }, [showInliers]);

  useEffect(() => {
    setInternalShowOutliers(showOutliers);
  }, [showOutliers]);

  useEffect(() => {
    setInternalShowConnections(showConnections);
  }, [showConnections]);

  useEffect(() => {
    setInternalPointLimit(pointLimit);
  }, [pointLimit]);

  useEffect(() => {
    setInternalOpacity(opacity);
  }, [opacity]);

  // Window/container resize observer
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleToggleInliers = (val: boolean) => {
    setInternalShowInliers(val);
    onToggleInliers?.(val);
  };

  const handleToggleOutliers = (val: boolean) => {
    setInternalShowOutliers(val);
    onToggleOutliers?.(val);
  };

  const handleToggleConnections = (val: boolean) => {
    setInternalShowConnections(val);
    onToggleConnections?.(val);
  };

  const handlePointLimitChange = (val: number) => {
    setInternalPointLimit(val);
    onPointLimitChange?.(val);
  };

  // Filtered points based on active toggles
  const visiblePoints = matchPoints
    .filter((pt) => (pt.inlier && internalShowInliers) || (!pt.inlier && internalShowOutliers))
    .slice(0, internalPointLimit);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = container.clientWidth);
    const height = (canvas.height = container.clientHeight);

    ctx.clearRect(0, 0, width, height);

    // If desktop (horizontal side-by-side): left half is Ref, right half is Src
    // If mobile (vertical): top half is Ref, bottom half is Src
    const isHorizontal = width >= 640;
    const halfW = isHorizontal ? width / 2 : width;
    const halfH = isHorizontal ? height : height / 2;

    visiblePoints.forEach((pt) => {
      const isSelected = selectedPointId === pt.id;

      // Coordinates in canvas space
      let rx = 0;
      let ry = 0;
      let sx = 0;
      let sy = 0;

      if (isHorizontal) {
        rx = pt.x1 * halfW;
        ry = pt.y1 * height;
        sx = halfW + pt.x2 * halfW;
        sy = pt.y2 * height;
      } else {
        rx = pt.x1 * width;
        ry = pt.y1 * halfH;
        sx = pt.x2 * width;
        sy = halfH + pt.y2 * halfH;
      }

      // Colors: Cyan for selected, Green for inlier, Red for outlier
      let strokeColor = pt.inlier ? `rgba(53, 208, 127, ${internalOpacity})` : `rgba(255, 92, 92, ${internalOpacity * 0.7})`;
      let fillColor = pt.inlier ? '#35D07F' : '#FF5C5C';

      if (isSelected) {
        strokeColor = '#35C6F4';
        fillColor = '#35C6F4';
      }

      // Draw connection line
      if (internalShowConnections) {
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        // Subtle curve for futuristic HUD aesthetic
        const cpX = (rx + sx) / 2;
        const cpY = (ry + sy) / 2 - (isHorizontal ? 15 : 0);
        ctx.quadraticCurveTo(cpX, cpY, sx, sy);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isSelected ? 2.5 : pt.inlier ? 1.2 : 0.8;
        if (!pt.inlier) {
          ctx.setLineDash([4, 4]); // Dashed line for outliers
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw point on Reference Image
      ctx.beginPath();
      ctx.arc(rx, ry, isSelected ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = '#050812';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw point on Source Image
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = '#050812';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Selected point aura & reticle
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(rx, ry, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(53, 198, 244, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(53, 198, 244, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#35C6F4';
        ctx.fillText(`PT #${pt.id} (Conf: ${(pt.confidence * 100).toFixed(0)}%)`, rx + 14, ry - 6);
      }
    });
  }, [visiblePoints, selectedPointId, internalShowConnections, internalOpacity, dimensions]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const width = canvas.width;
    const height = canvas.height;
    const isHorizontal = width >= 640;
    const halfW = isHorizontal ? width / 2 : width;
    const halfH = isHorizontal ? height : height / 2;

    // Find nearest point
    let closestPt: MatchPoint | null = null;
    let minDist = 25; // click tolerance in px

    visiblePoints.forEach((pt) => {
      let rx = isHorizontal ? pt.x1 * halfW : pt.x1 * width;
      let ry = isHorizontal ? pt.y1 * height : pt.y1 * halfH;
      let sx = isHorizontal ? halfW + pt.x2 * halfW : pt.x2 * width;
      let sy = isHorizontal ? pt.y2 * height : halfH + pt.y2 * halfH;

      const distR = Math.hypot(clickX - rx, clickY - ry);
      const distS = Math.hypot(clickX - sx, clickY - sy);

      if (distR < minDist) {
        minDist = distR;
        closestPt = pt;
      } else if (distS < minDist) {
        minDist = distS;
        closestPt = pt;
      }
    });

    if (closestPt) {
      setSelectedPointId((closestPt as MatchPoint).id);
    } else {
      setSelectedPointId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Visualization Canvas Container */}
      <div 
        ref={containerRef}
        className="relative w-full bg-[#0B1220] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
      >
        {/* Underlying Lunar Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
          
          {/* Reference Image Pane */}
          <div className="relative aspect-square sm:aspect-[4/3] bg-black flex flex-col justify-between p-3">
            <img
              src={referenceImage.url}
              alt="Reference Lunar Frame"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="z-10 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/80 border border-[#35C6F4]/40 text-[10px] font-mono text-[#35C6F4]">
                REF: {referenceImage.sensor}
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
                2048 × 2048
              </span>
            </div>
            <div className="z-10 text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded self-start pointer-events-none">
              Base Coordinate Frame
            </div>
          </div>

          {/* Source Image Pane */}
          <div className="relative aspect-square sm:aspect-[4/3] bg-black flex flex-col justify-between p-3">
            <img
              src={sourceImage.url}
              alt="Source Lunar Frame"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="z-10 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-black/80 border border-[#7C8CFF]/40 text-[10px] font-mono text-[#7C8CFF]">
                SRC: {sourceImage.sensor}
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
                1024 × 1024
              </span>
            </div>
            <div className="z-10 text-[10px] font-mono text-slate-400 bg-black/60 px-1.5 py-0.5 rounded self-start pointer-events-none">
              Unaligned Observation
            </div>
          </div>

        </div>

        {/* Dynamic Canvas for match lines & points */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full cursor-crosshair z-20"
        />

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#050812]/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#35D07F]" />
              <span className="text-slate-200">Inlier ({matchPoints.filter(p => p.inlier).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C5C]" />
              <span className="text-slate-300">Outlier ({matchPoints.filter(p => !p.inlier).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#35C6F4]" />
              <span className="text-slate-300">Selected</span>
            </div>
          </div>

          <div className="text-slate-400">
            {selectedPointId ? (
              <span className="text-[#35C6F4]">Point #{selectedPointId} active (click canvas to deselect)</span>
            ) : (
              <span>Click any point to inspect correspondence telemetry</span>
            )}
          </div>
        </div>
      </div>

      {/* Analysis & Visualization Controls */}
      {showControls && (
        <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between font-mono text-xs text-slate-300 font-semibold border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#35C6F4]" />
              <span>MATCH VISUALIZATION CONTROLS</span>
            </div>
            <span className="text-slate-400 font-normal">
              Showing {visiblePoints.length} of {matchPoints.length} points
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            
            {/* Toggle Inliers */}
            <button
              type="button"
              id="toggle-inliers-btn"
              onClick={() => handleToggleInliers(!internalShowInliers)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer select-none ${
                internalShowInliers
                  ? 'bg-[#35D07F]/10 border-[#35D07F]/60 text-white shadow-sm ring-1 ring-[#35D07F]/30'
                  : 'bg-[#050812] border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#050812]/80'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  internalShowInliers
                    ? 'bg-[#35D07F] border-[#35D07F] text-black'
                    : 'border-slate-600 bg-slate-900'
                }`}
              >
                {internalShowInliers && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs font-mono font-medium">Show Inliers</span>
            </button>

            {/* Toggle Outliers */}
            <button
              type="button"
              id="toggle-outliers-btn"
              onClick={() => handleToggleOutliers(!internalShowOutliers)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer select-none ${
                internalShowOutliers
                  ? 'bg-[#FF5C5C]/10 border-[#FF5C5C]/60 text-white shadow-sm ring-1 ring-[#FF5C5C]/30'
                  : 'bg-[#050812] border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#050812]/80'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  internalShowOutliers
                    ? 'bg-[#FF5C5C] border-[#FF5C5C] text-white'
                    : 'border-slate-600 bg-slate-900'
                }`}
              >
                {internalShowOutliers && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs font-mono font-medium">Show Outliers</span>
            </button>

            {/* Toggle Connections */}
            <button
              type="button"
              id="toggle-connections-btn"
              onClick={() => handleToggleConnections(!internalShowConnections)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer select-none ${
                internalShowConnections
                  ? 'bg-[#35C6F4]/10 border-[#35C6F4]/60 text-white shadow-sm ring-1 ring-[#35C6F4]/30'
                  : 'bg-[#050812] border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-[#050812]/80'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  internalShowConnections
                    ? 'bg-[#35C6F4] border-[#35C6F4] text-black'
                    : 'border-slate-600 bg-slate-900'
                }`}
              >
                {internalShowConnections && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs font-mono font-medium">Show Connections</span>
            </button>

            {/* Point Density Slider */}
            <div className="bg-[#050812] p-2.5 px-3 rounded-xl border border-slate-800 flex flex-col justify-center space-y-1.5">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Match Density:</span>
                <span className="text-[#35C6F4] font-bold">{internalPointLimit}</span>
              </div>
              <input
                id="point-limit-slider"
                type="range"
                min={10}
                max={Math.max(matchPoints.length, 10)}
                value={internalPointLimit}
                onChange={(e) => handlePointLimitChange(Number(e.target.value))}
                className="w-full accent-[#35C6F4] cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
