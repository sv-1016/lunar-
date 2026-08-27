import React from 'react';
import { RegistrationMetrics } from '../types';
import { Target, CheckCircle2, Zap, Layers, AlertCircle, Clock } from 'lucide-react';

interface MetricsCardsProps {
  metrics: RegistrationMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  return (
    <div className="w-full space-y-3">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: RMSE */}
        <div 
          id="metric-card-rmse"
          className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md hover:border-[#35C6F4]/50 transition-all group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#35C6F4]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              RMSE
            </span>
            <Target className="w-4 h-4 text-[#35C6F4]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {metrics.rmse.toFixed(2)} <span className="text-xs font-normal text-slate-400">px</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#35D07F] flex items-center gap-1">
            <span>Sub-pixel target: &lt; 1.0 px</span>
          </div>
        </div>

        {/* Card 2: Match Points */}
        <div 
          id="metric-card-matches"
          className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md hover:border-[#7C8CFF]/50 transition-all group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C8CFF]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              MATCH POINTS
            </span>
            <Layers className="w-4 h-4 text-[#7C8CFF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            {metrics.totalMatches.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>Inliers: <strong className="text-slate-200">{metrics.inliers.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 3: Inlier Ratio */}
        <div 
          id="metric-card-inlier-ratio"
          className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md hover:border-[#35D07F]/50 transition-all group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#35D07F]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              INLIER RATIO
            </span>
            <Zap className="w-4 h-4 text-[#35D07F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-[#35D07F] tracking-tight">
            {metrics.inlierRatio.toFixed(2)}<span className="text-sm font-normal text-slate-400">%</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400">
            <span>RANSAC Spatial Inliers</span>
          </div>
        </div>

        {/* Card 4: Status */}
        <div 
          id="metric-card-status"
          className="bg-[#0B1220] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-md hover:border-[#35D07F]/50 transition-all group shadow-lg"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#35D07F]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              STATUS
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#35D07F]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#35D07F] tracking-tight flex items-center gap-1.5">
            <span>✓ SUCCESS</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Time: {(metrics.processingTimeMs / 1000).toFixed(2)}s</span>
          </div>
        </div>

      </div>

      {/* Mandatory Prototype Disclaimer as required in PRD Section 21 & 36 */}
      <div className="bg-[#050812] border border-slate-800 rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#F5B942] shrink-0" />
          <span>
            <strong>Prototype Demonstration Metrics:</strong> Simulated values generated for workflow presentation (not raw scientific flight telemetry).
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 hidden sm:inline">
          ISRO CH-2 DEMO
        </span>
      </div>
    </div>
  );
};
