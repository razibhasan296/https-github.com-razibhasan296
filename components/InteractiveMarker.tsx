import React, { useState } from 'react';
import { MarkerData } from '../types';

interface InteractiveMarkerProps {
  marker: MarkerData;
  onActivate?: (marker: MarkerData) => void;
}

const InteractiveMarker: React.FC<InteractiveMarkerProps> = ({ marker, onActivate }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getMarkerIcon = () => {
    switch (marker.type) {
      case 'Anomaly': return '☢️';
      case 'History': return '⌛';
      case 'Sensor': return '📡';
      case 'Custom': return '🎨';
      default: return '📍';
    }
  };

  const getMarkerColor = () => {
    switch (marker.type) {
      case 'Anomaly': return 'border-purple-600 text-purple-400 bg-purple-900/30 shadow-[0_0_20px_rgba(168,85,247,0.6)]';
      case 'History': return 'border-amber-400 text-amber-300 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
      case 'Sensor': return 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.4)]';
      case 'Custom': return 'border-purple-500 text-purple-300 bg-purple-900/40 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
      default: return 'border-slate-400 text-slate-300 bg-slate-500/10 shadow-[0_0_10px_rgba(148,163,184,0.4)]';
    }
  };

  const isHistory = marker.type === 'History';
  const isAnomaly = marker.type === 'Anomaly';

  return (
    <div 
      className={`absolute pointer-events-auto cursor-pointer transition-transform duration-300 z-30 
        ${isHistory ? 'animate-[temporalHover_4s_easeInOut_infinite]' : ''}
        ${isAnomaly ? 'animate-[anomalySway_3s_easeInOut_infinite]' : ''}`}
      style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: `translate(-50%, -50%) scale(${isHovered ? 1.25 : 1})` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onActivate?.(marker)}
    >
      {/* Visual Marker Container */}
      <div className={`relative w-12 h-12 flex items-center justify-center transition-all ${isHistory ? 'history-marker' : ''}`}>
        
        {/* Animated Rings for History / Anomaly */}
        {isHistory && (
          <>
            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-[spin_8s_linear_infinite]"></div>
            <div className="absolute inset-1 border border-amber-400/20 rounded-full animate-[spin_12s_linear_infinite_reverse]"></div>
          </>
        )}

        {isAnomaly && (
          <div className="absolute inset-[-8px] border border-purple-500/20 rounded-full animate-[ping_1.5s_infinite] opacity-50"></div>
        )}

        {/* Main Marker Core */}
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all relative z-10 overflow-hidden
          ${getMarkerColor()} 
          ${isHistory ? 'glitch-border-heavy' : ''} 
          ${isAnomaly ? 'animate-[anomalyPulse_1s_infinite] border-purple-400' : ''}
          ${isHovered ? 'border-[var(--theme-primary)]' : ''}`}>
          
          {marker.thumbnailUrl ? (
            <img src={marker.thumbnailUrl} alt={marker.label} className="w-full h-full object-cover" />
          ) : (
            <span className={`text-sm inline-block transition-transform 
              ${isHistory ? 'animate-pulse font-bold' : ''} 
              ${isAnomaly ? 'brightness-150 drop-shadow-[0_0_5px_#a855f7]' : ''}
              ${isHovered ? 'animate-[markerIconPulse_1.5s_ease-in-out_infinite]' : ''}`}>
              {getMarkerIcon()}
            </span>
          )}
          
          {/* Exterior Ping */}
          <div className={`absolute inset-0 rounded-full border border-current opacity-40 animate-ping 
            ${isHistory ? 'duration-[3s]' : ''}
            ${isAnomaly ? 'duration-[0.5s] border-purple-300' : ''}`}></div>
        </div>

        {/* Rapid Label Tag */}
        <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-[var(--theme-primary)]/60 px-2 py-0.5 rounded text-[8px] font-orbitron font-bold text-white uppercase tracking-tighter whitespace-nowrap transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'opacity-0 -translate-y-1 scale-90'}`}>
          {marker.label}
        </div>
      </div>

      {/* Stylized HUD Tooltip */}
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-6 w-64 p-4 bg-slate-900/95 backdrop-blur-3xl border-2 transition-all duration-500 origin-bottom overflow-hidden rounded-2xl ${
          isHovered 
            ? 'opacity-100 scale-110 translate-y-[-12px] border-[var(--theme-primary)] shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_30px_rgba(34,211,238,0.3)]' 
            : 'opacity-0 scale-90 border-slate-700 shadow-none pointer-events-none'
        }`}
      >
        {/* Holographic Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[var(--theme-primary)]/15 to-transparent h-6 w-full animate-[scanlineMove_2s_linear_infinite]"></div>

        <div className="relative z-10">
          <div className="text-[13px] font-orbitron font-bold theme-text-primary mb-1 flex justify-between items-center">
            <span className={`truncate pr-2 ${isAnomaly ? 'text-purple-400' : ''}`}>{marker.label}</span>
            <span className={`px-2 py-0.5 rounded text-[8px] ${isHistory ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : isAnomaly ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-200 border border-slate-700'} flex-shrink-0 uppercase font-bold tracking-widest`}>
              {marker.type}
            </span>
          </div>
          
          <div className="h-[1px] w-full bg-gradient-to-r from-[var(--theme-primary)]/50 via-[var(--theme-primary)]/20 to-transparent mb-2"></div>
          
          <p className={`text-[10px] leading-relaxed font-mono line-clamp-3 mt-1 
            ${isAnomaly ? 'text-purple-200 animate-[textJitter_2s_infinite]' : 'text-slate-300'}`}>
            {isAnomaly && <span className="text-red-500 font-bold mr-1">[CRITICAL_EVENT]</span>}
            {marker.description}
          </p>
          
          <div className="mt-4 pt-2 border-t border-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAnomaly ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-green-400 shadow-[0_0_5px_#4ade80]'}`}></div>
              <span className="text-[7px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                {isAnomaly ? 'System Instability' : 'Uplink Synchronized'}
              </span>
            </div>
            <div className="w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 shadow-inner">
               <div className={`h-full w-full ${isHistory ? 'bg-amber-400 shadow-[0_0_5px_#f59e0b]' : isAnomaly ? 'bg-purple-500 animate-pulse' : 'theme-bg-primary shadow-[0_0_5px_#22d3ee]'} animate-[shimmer_1s_infinite]`}></div>
            </div>
          </div>
        </div>

        <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] transition-colors duration-300 ${isHovered ? 'border-t-[var(--theme-primary)]' : 'border-t-slate-700'}`}></div>
      </div>

      <style>{`
        @keyframes temporalHover {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); filter: hue-rotate(0deg); }
          50% { transform: translate(-50%, -50%) translateY(-8px); filter: hue-rotate(15deg); }
        }
        @keyframes anomalySway {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(2deg); }
          75% { transform: translate(-50%, -50%) rotate(-2deg); }
        }
        @keyframes anomalyPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.4); }
          50% { box-shadow: 0 0 25px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.2); }
        }
        @keyframes scanlineMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes markerIconPulse {
          0%, 100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px var(--theme-primary)); }
          50% { transform: scale(1.15); filter: brightness(1.4) drop-shadow(0 0 8px var(--theme-primary)); }
        }
        @keyframes textJitter {
          0%, 90%, 100% { transform: translate(0); opacity: 1; }
          92% { transform: translate(1px, -1px); opacity: 0.8; }
          95% { transform: translate(-1px, 1px); opacity: 1; }
          97% { transform: translate(2px, 0); opacity: 0.9; }
        }
        .glitch-border-heavy {
          animation: glitch-heavy 4s infinite;
        }
        @keyframes glitch-heavy {
          0%, 85%, 100% { border-color: inherit; transform: translate(0); }
          90% { border-color: #f59e0b; transform: translate(1px, -1px); box-shadow: 2px 0 red, -2px 0 cyan; }
          93% { border-color: #ef4444; transform: translate(-1px, 1px); }
          96% { border-color: #22d3ee; transform: translate(0); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveMarker;