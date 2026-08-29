import React, { useState, useEffect } from 'react';
import { ActiveScreen } from '../types';
import { 
  Activity, 
  Layers, 
  Cpu, 
  SlidersHorizontal, 
  FileText, 
  History, 
  HelpCircle, 
  Orbit, 
  Sparkles,
  RefreshCw,
  Radio,
  Globe2,
  GitMerge
} from 'lucide-react';

interface NavbarProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  canNavigateResults: boolean;
  onOpenHelp: () => void;
  onLoadSample: (pairId: string) => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  onNavigate,
  canNavigateResults,
  onOpenHelp,
  onLoadSample,
  onReset,
}) => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ActiveScreen; label: string; icon: React.ElementType }[] = [
    { id: 'registration', label: 'Registration', icon: Layers },
    { id: 'processing', label: '3D Processing', icon: Orbit },
    { id: 'results', label: 'Results & Metrics', icon: Activity },
    { id: 'comparison', label: 'Comparison Slider', icon: SlidersHorizontal },
    { id: 'analysis', label: 'Deep Analysis', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050812]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button 
            id="brand-home-btn"
            onClick={() => onNavigate('registration')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#35C6F4]/20 to-[#7C8CFF]/20 border border-[#35C6F4]/40 flex items-center justify-center group-hover:border-[#35C6F4] transition-all">
              <Orbit className="w-5 h-5 text-[#35C6F4] animate-spin-slow" />
              <div className="absolute inset-0 rounded-xl bg-[#35C6F4]/10 blur-sm -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-wider text-base text-white">LUNARIS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#35C6F4]/10 text-[#35C6F4] border border-[#35C6F4]/30 font-mono">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                CHANDRAYAAN-2 LUNAR IMAGE REGISTRATION
              </p>
            </div>
          </button>
        </div>

        {/* Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0B1220]/90 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#35C6F4]/20 text-[#35C6F4] border border-[#35C6F4]/40 glow-cyan-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sample Preset Dropdown */}
          <div className="relative">
            <button
              id="sample-datasets-btn"
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-slate-700 hover:border-[#35C6F4]/60 text-xs text-slate-300 transition-all font-mono cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#35C6F4]" />
              <span className="hidden sm:inline">Load Sample</span>
            </button>

            {showSampleMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-[#0B1220] border border-slate-700 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                onMouseLeave={() => setShowSampleMenu(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-800">
                  CHANDRAYAAN-2 OBSERVATION PAIRS
                </div>
                <button
                  id="sample-pair-shackleton"
                  onClick={() => {
                    onLoadSample('shackleton_south_pole');
                    setShowSampleMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800/80 rounded-lg mt-1 transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-[#35C6F4]">
                    Shackleton Crater — South Pole
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    OHRC (0.25m) ↔ TMC-2 (5m) • 89.9°S
                  </div>
                </button>
                <button
                  id="sample-pair-cabeus"
                  onClick={() => {
                    onLoadSample('cabeus_crater');
                    setShowSampleMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800/80 rounded-lg transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-[#7C8CFF]">
                    Cabeus Crater — Deep Cold Trap
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    CH-2 OHRC ↔ LRO NAC (0.5m)
                  </div>
                </button>
                <button
                  id="sample-pair-tycho"
                  onClick={() => {
                    onLoadSample('tycho_central_peak');
                    setShowSampleMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800/80 rounded-lg transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-[#35D07F]">
                    Tycho Central Peak Complex
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    OHRC (Optical) ↔ IIRS (Hyperspectral)
                  </div>
                </button>
                <button
                  id="sample-pair-orientale"
                  onClick={() => {
                    onLoadSample('mare_orientale_basin');
                    setShowSampleMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-800/80 rounded-lg transition-colors group cursor-pointer"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400">
                    Mare Orientale Impact Basin
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    TMC-2 (Stereo) ↔ IIRS
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Telemetry Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0B1220] border border-slate-800 text-[11px] font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35D07F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35D07F]"></span>
            </span>
            <span className="text-slate-300">SYSTEM ONLINE</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{timeUtc}</span>
          </div>

          {/* Quick Help */}
          <button
            id="help-modal-trigger-btn"
            onClick={onOpenHelp}
            aria-label="Mission Documentation & Help"
            className="p-2 rounded-lg bg-[#0B1220] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Mission Specs & Help Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            id="app-reset-btn"
            onClick={onReset}
            aria-label="Reset Mission Data"
            className="p-2 rounded-lg bg-[#0B1220] border border-slate-700 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all cursor-pointer"
            title="Reset Workflow"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-[#0B1220] px-2 py-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-[#35C6F4] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

