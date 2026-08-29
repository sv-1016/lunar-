import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadedImage, SensorType } from '../types';
import { Upload, X, RefreshCw, FileCheck, Image as ImageIcon, Sparkles, MapPin } from 'lucide-react';

interface UploadCardProps {
  type: 'reference' | 'source';
  title: string;
  image: UploadedImage | null;
  sensor: SensorType;
  onImageChange?: (image: UploadedImage | null) => void;
  onLoadPreset?: () => void;
}

export const UploadCard: React.FC<UploadCardProps> = ({
  type,
  title,
  image,
  sensor,
  onImageChange,
  onLoadPreset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRef = type === 'reference';
  const accentBorder = isRef ? 'border-[#35C6F4]/40 hover:border-[#35C6F4]' : 'border-[#7C8CFF]/40 hover:border-[#7C8CFF]';
  const badgeColor = isRef ? 'bg-[#35C6F4]/15 text-[#35C6F4] border-[#35C6F4]/30' : 'bg-[#7C8CFF]/15 text-[#7C8CFF] border-[#7C8CFF]/30';

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        const newUploadedImage: UploadedImage = {
          id: `${type}_${Date.now()}`,
          name: file.name,
          url,
          width: img.width,
          height: img.height,
          sizeFormatted,
          sensor,
          timestamp: new Date().toISOString(),
          targetRegion: 'User Custom Observation',
        };
        if (typeof onImageChange === 'function') {
          onImageChange(newUploadedImage);
        }
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div 
      id={`${type}-upload-container`}
      className="bg-[#0B1220] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden transition-all shadow-xl"
    >
      {/* Corner space accents */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#35C6F4]/50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#35C6F4]/50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#35C6F4]/50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#35C6F4]/50 pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider border ${badgeColor}`}>
            {type.toUpperCase()} IMAGE
          </span>
          <span className="text-xs font-semibold text-slate-300 font-mono">
            [{sensor}]
          </span>
        </div>

        {image && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#35D07F]">
            <FileCheck className="w-3.5 h-3.5" />
            <span>LOADED</span>
          </div>
        )}
      </div>

      {/* Image Preview / Upload Area */}
      <div className="flex-1 min-h-[260px] flex flex-col justify-center">
        {image ? (
          <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-[#050812] flex flex-col items-center">
            {/* Image Preview */}
            <div className="relative w-full aspect-square max-h-[260px] flex items-center justify-center bg-black/40 overflow-hidden">
              <img
                src={image.url}
                alt={`${title} lunar observation preview`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay Crosshair Reticle */}
              <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 m-2 rounded-lg flex items-center justify-center">
                <div className="w-6 h-[1px] bg-cyan-400/40" />
                <div className="h-6 w-[1px] bg-cyan-400/40 absolute" />
              </div>

              {/* Resolution Tag */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-slate-300">
                {image.width} × {image.height} px
              </div>

              {/* Sensor Badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#050812]/80 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-[#35C6F4]">
                {sensor}
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="w-full p-3 bg-[#0B1220]/90 border-t border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-200 truncate max-w-[200px]" title={image.name}>
                  {image.name}
                </span>
                <span className="font-mono text-slate-400 text-[11px]">{image.sizeFormatted}</span>
              </div>

              {image.targetRegion && (
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <MapPin className="w-3 h-3 text-[#35C6F4]" />
                  <span className="truncate">{image.targetRegion}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            id={`${type}-dropzone`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-[#050812]/50 ${
              isDragging ? 'border-[#35C6F4] bg-[#35C6F4]/5' : accentBorder
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-[#35C6F4]">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-200 mb-1">
              Drag & Drop / Browse Image
            </p>
            <p className="text-xs text-slate-400 mb-3 max-w-[240px]">
              Supports PNG, JPG, JPEG, WEBP lunar observation frames
            </p>

            <button
              type="button"
              id={`${type}-browse-btn`}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileInput}
        className="hidden"
        id={`${type}-file-input`}
      />

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2">
        {image ? (
          <>
            <button
              type="button"
              id={`${type}-replace-btn`}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-all font-mono"
            >
              <RefreshCw className="w-3 h-3 text-[#35C6F4]" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              id={`${type}-remove-btn`}
              onClick={() => {
                if (typeof onImageChange === 'function') {
                  onImageChange(null);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-xs font-medium text-red-300 border border-red-800/50 transition-all font-mono"
            >
              <X className="w-3 h-3 text-red-400" />
              <span>Remove</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            id={`${type}-load-preset-btn`}
            onClick={() => {
              if (typeof onLoadPreset === 'function') {
                onLoadPreset();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#050812] hover:bg-slate-800/90 text-xs font-medium text-[#35C6F4] border border-[#35C6F4]/30 hover:border-[#35C6F4] transition-all font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Lunar Sample Frame</span>
          </button>
        )}
      </div>
    </div>
  );
};
