import React from 'react';
import { GeometricTransformation } from '../types';
import { Compass, Maximize2, Move, Grid, AlertCircle, Sparkles } from 'lucide-react';

interface TransformationCardProps {
  transformation: GeometricTransformation;
}

export const TransformationCard: React.FC<TransformationCardProps> = ({ transformation }) => {
  return (
    <div className="bg-[#0B1220] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#35C6F4]" />
          <span className="text-xs font-bold font-mono text-slate-200 tracking-wider">
            GEOMETRIC TRANSFORMATION
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          RANSAC ESTIMATE
        </span>
      </div>

      {/* 4 Transformation Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        
        {/* Rotation */}
        <div className="bg-[#050812] border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Rotation</span>
          <div className="text-lg font-bold text-[#35C6F4]">
            {transformation.rotationDeg > 0 ? `+${transformation.rotationDeg.toFixed(2)}` : transformation.rotationDeg.toFixed(2)}°
          </div>
          <p className="text-[10px] text-slate-500">Planar azimuth delta</p>
        </div>

        {/* Scale */}
        <div className="bg-[#050812] border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Scale Ratio</span>
          <div className="text-lg font-bold text-[#7C8CFF]">
            {transformation.scaleFactor.toFixed(2)}×
          </div>
          <p className="text-[10px] text-slate-500">Resolution scaling</p>
        </div>

        {/* Translation X */}
        <div className="bg-[#050812] border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Translation X</span>
          <div className="text-lg font-bold text-[#35D07F]">
            {transformation.translationX > 0 ? `+${transformation.translationX.toFixed(2)}` : transformation.translationX.toFixed(2)} <span className="text-xs font-normal text-slate-400">px</span>
          </div>
          <p className="text-[10px] text-slate-500">Horizontal shift</p>
        </div>

        {/* Translation Y */}
        <div className="bg-[#050812] border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Translation Y</span>
          <div className="text-lg font-bold text-[#35D07F]">
            {transformation.translationY > 0 ? `+${transformation.translationY.toFixed(2)}` : transformation.translationY.toFixed(2)} <span className="text-xs font-normal text-slate-400">px</span>
          </div>
          <p className="text-[10px] text-slate-500">Vertical shift</p>
        </div>

      </div>

      {/* Homography 3x3 Matrix Table */}
      <div className="bg-[#050812] border border-slate-800/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="font-semibold text-slate-300">3×3 Homography Matrix (H)</span>
          <span>det(H) ≈ 1.000</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-black/40 p-2.5 rounded-lg border border-slate-900">
          {transformation.homography.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`}
                className="py-1 px-1.5 rounded bg-slate-900/80 border border-slate-800/60 text-slate-200"
              >
                {val > 0 && cIdx === 2 ? `+${val.toFixed(2)}` : typeof val === 'number' ? (Math.abs(val) < 0.01 ? val.toExponential(2) : val.toFixed(4)) : val}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Demonstration disclaimer */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <AlertCircle className="w-3.5 h-3.5 text-[#F5B942] shrink-0" />
        <span>Demonstration Values // Synthesized for Chandrayaan-2 Optical Prototype</span>
      </div>
    </div>
  );
};
