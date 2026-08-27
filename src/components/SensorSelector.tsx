import React from 'react';
import { SensorType } from '../types';
import { SENSORS } from '../data/sensors';
import { Camera, Satellite, Eye } from 'lucide-react';

interface SensorSelectorProps {
  label: string;
  selectedSensor: SensorType;
  onChange: (sensor: SensorType) => void;
  idPrefix: string;
}

export const SensorSelector: React.FC<SensorSelectorProps> = ({
  label,
  selectedSensor,
  onChange,
  idPrefix,
}) => {
  const currentSensorInfo = SENSORS[selectedSensor];

  const getSensorIcon = (sensor: SensorType) => {
    switch (sensor) {
      case 'OHRC':
        return Camera;
      case 'TMC':
        return Satellite;
      case 'IIRS':
        return Eye;
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <label htmlFor={`${idPrefix}-sensor-select`} className="text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#35C6F4]" />
          {label}
        </label>
        <span className="text-[11px] text-slate-400 font-mono">
          Chandrayaan-2 Payload
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(SENSORS) as SensorType[]).map((sensorKey) => {
          const info = SENSORS[sensorKey];
          const isSelected = selectedSensor === sensorKey;
          const Icon = getSensorIcon(sensorKey);

          return (
            <button
              key={sensorKey}
              type="button"
              id={`${idPrefix}-sensor-${sensorKey.toLowerCase()}`}
              onClick={() => onChange(sensorKey)}
              className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left group ${
                isSelected
                  ? 'bg-[#0B1220] border-[#35C6F4] ring-1 ring-[#35C6F4]/50 shadow-lg glow-cyan-sm'
                  : 'bg-[#0B1220]/60 border-slate-800 hover:border-slate-700 hover:bg-[#0B1220]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-bold font-mono ${isSelected ? 'text-[#35C6F4]' : 'text-slate-300'}`}>
                  {info.name}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#35C6F4]' : 'text-slate-500'}`} />
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-1 font-mono">
                {info.resolution}
              </p>

              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#35C6F4] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sensor Specs Mini Pill */}
      <div className="bg-[#0B1220]/70 border border-slate-800/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] font-mono text-slate-400">
        <span className="text-[#35C6F4] font-semibold shrink-0">Specs:</span>
        <span className="text-slate-300 line-clamp-1">
          {currentSensorInfo.spectralBand} • {currentSensorInfo.swath}
        </span>
      </div>
    </div>
  );
};
