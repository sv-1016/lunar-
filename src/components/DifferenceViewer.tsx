import React, { useState, useEffect, useRef } from 'react';
import { UploadedImage } from '../types';
import { Flame, Grid, Eye, Sliders, Activity, Sparkles } from 'lucide-react';

interface DifferenceViewerProps {
  referenceImage: UploadedImage;
  registeredImageUrl: string;
}

export const DifferenceViewer: React.FC<DifferenceViewerProps> = ({
  referenceImage,
  registeredImageUrl,
}) => {
  const [diffMode, setDiffMode] = useState<'heatmap' | 'checkerboard' | 'edges'>('heatmap');
  const [sensitivity, setSensitivity] = useState<number>(1.5);
  const [checkerboardSize, setCheckerboardSize] = useState<number>(40);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgRef = new Image();
    const imgReg = new Image();
    imgRef.crossOrigin = 'anonymous';
    imgReg.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const onBothLoaded = () => {
      loadedCount++;
      if (loadedCount < 2) return;

      const width = (canvas.width = 600);
      const height = (canvas.height = 600);

      // Temporary canvas to grab pixels
      const tempCanvas1 = document.createElement('canvas');
      tempCanvas1.width = width;
      tempCanvas1.height = height;
      const ctx1 = tempCanvas1.getContext('2d');
      if (!ctx1) return;
      ctx1.drawImage(imgRef, 0, 0, width, height);
      const data1 = ctx1.getImageData(0, 0, width, height).data;

      const tempCanvas2 = document.createElement('canvas');
      tempCanvas2.width = width;
      tempCanvas2.height = height;
      const ctx2 = tempCanvas2.getContext('2d');
      if (!ctx2) return;
      ctx2.drawImage(imgReg, 0, 0, width, height);
      const data2 = ctx2.getImageData(0, 0, width, height).data;

      const outImg = ctx.createImageData(width, height);
      const out = outImg.data;

      if (diffMode === 'heatmap') {
        // Compute pixel absolute difference & map to thermal false-color palette
        for (let i = 0; i < data1.length; i += 4) {
          const lum1 = 0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2];
          const lum2 = 0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2];
          const diff = Math.min(255, Math.abs(lum1 - lum2) * sensitivity);

          // Jet / Turbo False Color spectrum:
          // Low diff (aligned) -> deep blue/cyan
          // Med diff -> green/yellow
          // High diff (misaligned) -> bright red/magenta
          const norm = diff / 255;
          let r = 0, g = 0, b = 0;

          if (norm < 0.25) {
            r = 10;
            g = Math.floor(norm * 4 * 160);
            b = Math.floor(120 + norm * 4 * 135);
          } else if (norm < 0.5) {
            r = Math.floor((norm - 0.25) * 4 * 80);
            g = 200;
            b = Math.floor(255 - (norm - 0.25) * 4 * 200);
          } else if (norm < 0.75) {
            r = Math.floor(120 + (norm - 0.5) * 4 * 135);
            g = Math.floor(200 - (norm - 0.5) * 4 * 100);
            b = 10;
          } else {
            r = 255;
            g = Math.floor(100 - (norm - 0.75) * 4 * 80);
            b = Math.floor((norm - 0.75) * 4 * 90);
          }

          out[i] = r;
          out[i + 1] = g;
          out[i + 2] = b;
          out[i + 3] = 255;
        }
      } else if (diffMode === 'checkerboard') {
        // Alternating square tiles between Reference and Registered
        const sq = checkerboardSize;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const isRefTile = (Math.floor(x / sq) + Math.floor(y / sq)) % 2 === 0;
            const srcData = isRefTile ? data1 : data2;

            out[idx] = srcData[idx];
            out[idx + 1] = srcData[idx + 1];
            out[idx + 2] = srcData[idx + 2];
            out[idx + 3] = 255;
          }
        }
      } else if (diffMode === 'edges') {
        // Edge alignment mode (Sobel gradient on both images with Cyan for Ref and Magenta for Reg)
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const left1 = data1[((y) * width + (x - 1)) * 4];
            const right1 = data1[((y) * width + (x + 1)) * 4];
            const up1 = data1[((y - 1) * width + x) * 4];
            const down1 = data1[((y + 1) * width + x) * 4];
            const edge1 = Math.min(255, (Math.abs(right1 - left1) + Math.abs(down1 - up1)) * 1.5);

            const left2 = data2[((y) * width + (x - 1)) * 4];
            const right2 = data2[((y) * width + (x + 1)) * 4];
            const up2 = data2[((y - 1) * width + x) * 4];
            const down2 = data2[((y + 1) * width + x) * 4];
            const edge2 = Math.min(255, (Math.abs(right2 - left2) + Math.abs(down2 - up2)) * 1.5);

            // Ref Edge = Cyan, Reg Edge = Magenta/Yellow, Coincident = White
            out[idx] = Math.min(255, edge2 + 10);
            out[idx + 1] = Math.min(255, edge1 + 10);
            out[idx + 2] = Math.min(255, edge1 + edge2);
            out[idx + 3] = 255;
          }
        }
      }

      ctx.putImageData(outImg, 0, 0);
    };

    imgRef.onload = onBothLoaded;
    imgReg.onload = onBothLoaded;
    imgRef.src = referenceImage.url;
    imgReg.src = registeredImageUrl;
  }, [referenceImage.url, registeredImageUrl, diffMode, sensitivity, checkerboardSize]);

  return (
    <div className="w-full space-y-4">
      {/* Controls & Mode Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B1220] p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            id="diff-mode-heatmap-btn"
            onClick={() => setDiffMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              diffMode === 'heatmap'
                ? 'bg-[#FF5C5C]/20 text-[#FF5C5C] border border-[#FF5C5C]/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Residual Error Heatmap</span>
          </button>

          <button
            id="diff-mode-checkerboard-btn"
            onClick={() => setDiffMode('checkerboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              diffMode === 'checkerboard'
                ? 'bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Stereo Checkerboard</span>
          </button>

          <button
            id="diff-mode-edges-btn"
            onClick={() => setDiffMode('edges')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              diffMode === 'edges'
                ? 'bg-[#35D07F]/20 text-[#35D07F] border border-[#35D07F]/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Crater Edge Alignment</span>
          </button>
        </div>

        {/* Dynamic Parameter Adjustment */}
        {diffMode === 'heatmap' && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span>Gain:</span>
            <input
              id="diff-gain-slider"
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-24 sm:w-32 accent-[#FF5C5C] cursor-pointer"
            />
            <span className="text-[#FF5C5C] font-bold">{sensitivity}×</span>
          </div>
        )}

        {diffMode === 'checkerboard' && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span>Grid Size:</span>
            <input
              id="checkerboard-grid-slider"
              type="range"
              min="20"
              max="80"
              step="5"
              value={checkerboardSize}
              onChange={(e) => setCheckerboardSize(Number(e.target.value))}
              className="w-24 sm:w-32 accent-[#35C6F4] cursor-pointer"
            />
            <span className="text-[#35C6F4] font-bold">{checkerboardSize}px</span>
          </div>
        )}
      </div>

      {/* Main Canvas View */}
      <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-[#050812] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />

        {/* Heatmap Gradient Bar Indicator */}
        {diffMode === 'heatmap' && (
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-[#050812]/80 backdrop-blur-md border border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#35C6F4]">0.0 px (Aligned)</span>
            <div className="h-2 flex-1 mx-4 rounded-full bg-gradient-to-r from-[#0a60ff] via-[#35d07f] via-[#f5b942] to-[#ff5c5c]" />
            <span className="text-[#FF5C5C]">&gt; 2.5 px Error</span>
          </div>
        )}

        {diffMode === 'checkerboard' && (
          <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-[#050812]/80 backdrop-blur-md border border-slate-800 text-center text-[10px] font-mono text-slate-400">
            ALTERNATING TILES: REFERENCE [OHRC] vs REGISTERED [TMC-2]
          </div>
        )}

        {diffMode === 'edges' && (
          <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-[#050812]/80 backdrop-blur-md border border-slate-800 flex items-center justify-around text-[10px] font-mono">
            <span className="text-[#35D07F]">● REF EDGES (Green)</span>
            <span className="text-[#FF5C5C]">● REG EDGES (Red)</span>
            <span className="text-white">● CONVERGENT (White)</span>
          </div>
        )}
      </div>
    </div>
  );
};
