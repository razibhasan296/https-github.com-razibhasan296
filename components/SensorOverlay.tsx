import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { SensorData } from '../types';

interface SensorOverlayProps {
  data: SensorData;
}

const SensorOverlay: React.FC<SensorOverlayProps> = ({ data }) => {
  const [prevData, setPrevData] = useState<SensorData>(data);
  const [fluctuations, setFluctuations] = useState<Record<string, 'up' | 'down' | 'stable'>>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const newFluctuations: Record<string, 'up' | 'down' | 'stable'> = {};
    
    Object.keys(data).forEach((key) => {
      const k = key as keyof SensorData;
      if (data[k] > prevData[k]) {
        newFluctuations[k] = 'up';
      } else if (data[k] < prevData[k]) {
        newFluctuations[k] = 'down';
      } else {
        newFluctuations[k] = fluctuations[k] || 'stable';
      }

      if (newFluctuations[k] !== 'stable') {
        if (timeoutRefs.current[k]) clearTimeout(timeoutRefs.current[k]);
        timeoutRefs.current[k] = setTimeout(() => {
          setFluctuations(prev => ({ ...prev, [k]: 'stable' }));
        }, 1000);
      }
    });

    setFluctuations(prev => ({ ...prev, ...newFluctuations }));
    setPrevData(data);
  }, [data]);

  const chartData = [
    { subject: 'Temp', A: data.temperature, fullMark: 50 },
    { subject: 'Humid', A: data.humidity, fullMark: 100 },
    { subject: 'Press', A: data.pressure, fullMark: 1200 },
    { subject: 'Rad', A: data.radiation, fullMark: 10 },
    { subject: 'AI Sync', A: data.aiSync, fullMark: 100 },
    { subject: 'RAI', A: data.raiStability, fullMark: 1.0 },
  ];

  const getStatusColor = (val: number) => {
    if (val >= 0.7) return 'text-emerald-400';
    if (val >= 0.4) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getBarColor = (val: number) => {
    if (val >= 0.7) return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]';
    if (val >= 0.4) return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]';
    return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
  };

  const getStatusText = (val: number) => {
    if (val >= 0.7) return 'NOMINAL';
    if (val >= 0.4) return 'DEGRADED';
    return 'CRITICAL';
  };

  const TrendIndicator = ({ type }: { type?: 'up' | 'down' | 'stable' }) => {
    if (!type || type === 'stable') return <span className="w-3"></span>;
    return (
      <span className={`text-[8px] font-bold transition-all duration-300 animate-bounce ${type === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
        {type === 'up' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-lg border border-cyan-500/20 shadow-xl h-full flex flex-col relative overflow-hidden blueprint-border">
      <div className="blueprint-corner-tl"></div>
      <div className="blueprint-corner-tr"></div>
      <div className="blueprint-corner-bl"></div>
      <div className="blueprint-corner-br"></div>
      
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-[shimmer_2s_infinite]"></div>
      
      <h3 className="text-xs font-orbitron mb-4 text-cyan-400 uppercase tracking-widest flex justify-between items-center">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping shadow-[0_0_8px_#22d3ee]"></span>
          Environmental Sensors
        </span>
        <span className="text-[8px] font-mono text-slate-500 animate-pulse">STREAM_ACTIVE</span>
      </h3>
      
      <div className="flex-1 w-full min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
            <Radar
              name="Environment"
              dataKey="A"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.3}
              className="transition-all duration-500"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className={`p-2 rounded border transition-colors duration-300 ${fluctuations.radiation !== 'stable' ? 'bg-white/5 border-slate-500' : 'bg-transparent border-transparent'}`}>
          <div className="text-[9px] text-slate-500 uppercase flex items-center justify-between">
            Radiation
            <TrendIndicator type={fluctuations.radiation} />
          </div>
          <div className={`text-xs font-bold font-mono ${data.radiation > 5 ? 'text-red-400' : 'text-slate-200'}`}>
            {data.radiation.toFixed(3)} <span className="text-[8px] opacity-50">mSv/h</span>
          </div>
        </div>

        <div className={`p-2 rounded border transition-colors duration-300 ${fluctuations.raiStability !== 'stable' ? 'bg-white/5 border-slate-500' : 'bg-transparent border-transparent'}`}>
          <div className="text-[9px] text-slate-500 uppercase flex justify-between items-center">
            <span>RAI Stability</span>
            <TrendIndicator type={fluctuations.raiStability} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-xs font-bold font-mono ${getStatusColor(data.raiStability)}`}>
              {(data.raiStability * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] text-slate-600 uppercase font-mono">Sync Status</span>
          <span className={`text-[8px] font-bold ${getStatusColor(data.raiStability)}`}>{getStatusText(data.raiStability)}</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getBarColor(data.raiStability)}`}
            style={{ width: `${data.raiStability * 100}%` }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SensorOverlay;