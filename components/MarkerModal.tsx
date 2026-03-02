import React, { useState, useEffect } from 'react';
import { MarkerData } from '../types';
import { fetchMarkerDetails } from '../services/geminiService';

interface MarkerModalProps {
  marker: MarkerData | null;
  locationName?: string;
  onClose: () => void;
  onRestore?: (location: string) => void;
}

const MarkerModal: React.FC<MarkerModalProps> = ({ marker, locationName, onClose, onRestore }) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [localMarker, setLocalMarker] = useState<MarkerData | null>(marker);

  useEffect(() => {
    setLocalMarker(marker);
  }, [marker]);

  if (!localMarker) return null;

  const isHistory = localMarker.type === 'History';
  const isAnomaly = localMarker.type === 'Anomaly';

  const getTypeStyle = () => {
    switch (localMarker.type) {
      case 'Anomaly': return 'text-purple-400 border-purple-500/50 bg-purple-900/40 shadow-[0_0_20px_rgba(168,85,247,0.4)]';
      case 'History': return 'text-amber-400 border-amber-500/50 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case 'Sensor': return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10';
      case 'Custom': return 'text-purple-300 border-purple-500/50 bg-purple-900/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
      default: return 'text-slate-300 border-slate-500/50 bg-slate-500/10';
    }
  };

  const handleRestoreAction = () => {
    if (isHistory && onRestore) {
      setIsRestoring(true);
      setTimeout(() => {
        const locationName = localMarker.label.replace(/^Echo:\s*/, '');
        onRestore(locationName);
        onClose();
        setIsRestoring(false);
      }, 800);
    }
  };

  const handleDetailedScan = async () => {
    if (isScanning || isRestoring) return;
    setIsScanning(true);
    try {
      const details = await fetchMarkerDetails(localMarker.label, locationName || "Unknown Location");
      setLocalMarker(prev => prev ? { ...prev, ...details } : null);
    } catch (error) {
      console.error("Marker scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl pointer-events-auto cursor-default transition-all duration-700" 
        onClick={onClose}
      ></div>
      
      <div className={`relative w-full max-w-xl bg-slate-900/95 border-2 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden animate-[scaleIn_0.4s_cubic-bezier(0.16,1,0.3,1)] 
        ${isRestoring ? 'animate-pulse blur-sm scale-95' : ''}
        ${isAnomaly ? 'border-purple-600 animate-[anomalyFrameGlow_4s_infinite]' : 'border-slate-700'}`}>
        
        {/* Holographic Header Bar */}
        <div className={`h-1.5 bg-gradient-to-r from-transparent ${isHistory ? 'via-amber-500' : isAnomaly ? 'via-purple-500' : 'via-cyan-500'} to-transparent relative`}>
          {(isRestoring || isAnomaly) && <div className={`absolute inset-0 bg-white animate-ping opacity-30`}></div>}
        </div>
        
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-orbitron font-bold uppercase mb-4 tracking-widest ${getTypeStyle()}`}>
                {isHistory && <span className="animate-spin-slow">⏳</span>}
                {isAnomaly && <span className="animate-pulse">⚠️</span>}
                {marker.type === 'Custom' && <span>🎨</span>}
                {isHistory ? 'TEMPORAL DATA FRAGMENT' : isAnomaly ? 'ENVIRONMENTAL ANOMALY' : marker.type === 'Custom' ? 'USER_SYNTHESIZED_ELEMENT' : `${marker.type} UNIT DETECTED`}
              </div>
              <h2 className={`text-4xl font-orbitron font-bold text-white tracking-tighter 
                ${isHistory ? 'text-amber-100' : isAnomaly ? 'text-purple-100 animate-[textJitter_3s_infinite]' : localMarker.type === 'Custom' ? 'text-purple-200' : 'chromatic-aberration'}`}>
                {localMarker.label}
              </h2>
              <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
                Uplink_ID: RAI-{localMarker.id.slice(-6)} // Status: {isAnomaly ? 'ALERT_ACTIVE' : isRestoring ? 'RECONSTRUCTING...' : isScanning ? 'SCANNING_GROUNDING...' : 'RESOLVED'}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-all hover:rotate-90 duration-300 p-2 bg-slate-800/30 rounded-full border border-slate-700/50"
              title="Terminate Connection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <div className={`border-l-4 ${isHistory ? 'border-amber-500' : isAnomaly ? 'border-purple-500' : 'border-cyan-500'} pl-6 py-2 bg-white/5 rounded-r-lg`}>
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1 tracking-tighter">Spatial L-Sync Coordinates</div>
                <div className={`text-lg font-mono font-bold ${isHistory ? 'text-amber-400' : isAnomaly ? 'text-purple-400' : 'text-cyan-400'}`}>
                  {localMarker.x.toFixed(3)}° X | {localMarker.y.toFixed(3)}° Y
                </div>
              </div>
              
              <div className="bg-black/40 rounded-xl p-5 border border-slate-800 max-h-[200px] overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] font-orbitron text-slate-400 uppercase tracking-widest border-b border-slate-800/50 pb-3 mb-3">Analysis Profile</h4>
                <p className={`text-sm leading-relaxed font-mono ${isHistory ? 'text-amber-100/90 italic' : isAnomaly ? 'text-purple-100/80' : 'text-slate-300'}`}>
                  {localMarker.description}
                </p>
                {localMarker.detailedInfo && (
                  <div className="mt-4 pt-4 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-2">
                    <div className="text-[8px] text-cyan-500 uppercase font-mono mb-2 tracking-widest">#DEEP_SCAN_INTEL</div>
                    <p className="text-[11px] text-cyan-100/80 leading-relaxed font-mono whitespace-pre-wrap">
                      {localMarker.detailedInfo}
                    </p>
                  </div>
                )}
              </div>

              {localMarker.groundingSources && localMarker.groundingSources.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[8px] text-slate-500 uppercase font-mono tracking-widest">Grounding Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {localMarker.groundingSources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[8px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 px-2 py-1 rounded text-cyan-400 transition-all truncate max-w-[150px]"
                        title={source.title}
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className={`aspect-video rounded-2xl border-2 overflow-hidden bg-black flex items-center justify-center relative group transition-all duration-500 
                ${isHistory ? 'border-amber-500/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]' : 
                  isAnomaly ? 'border-purple-500/40 shadow-[inset_0_0_30px_rgba(168,85,247,0.3)]' : 
                  localMarker.type === 'Custom' ? 'border-purple-500/50 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]' : 'border-slate-800'}`}>
                {localMarker.thumbnailUrl ? (
                  <img src={localMarker.thumbnailUrl} className="w-full h-full object-cover opacity-80 scale-110 group-hover:scale-100 transition-transform duration-[10s]" />
                ) : (
                  <div className="relative">
                    <div className={`w-24 h-24 border-2 rounded-full flex items-center justify-center animate-spin-slow 
                      ${isHistory ? 'border-amber-500/20' : isAnomaly ? 'border-purple-500/30' : 'border-cyan-500/20'}`}>
                      <div className={`w-16 h-16 border-t-2 rounded-full ${isHistory ? 'border-amber-400' : isAnomaly ? 'border-purple-400' : 'border-cyan-400'}`}></div>
                    </div>
                    <div className={`absolute inset-0 flex items-center justify-center text-[12px] font-orbitron ${isHistory ? 'text-amber-400' : isAnomaly ? 'text-purple-400' : 'text-cyan-400'}`}>
                      {isAnomaly ? '!' : 'RAI'}
                    </div>
                  </div>
                )}
                {isAnomaly && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(168,85,247,0.2)_100%)]"></div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[7px] font-mono text-white/50">
                  {isAnomaly ? 'LOG_OVERFLOW' : `REF_ID: ${marker.id.slice(0, 4)}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-slate-800/40 rounded-lg p-2 border border-slate-700/50 ${isAnomaly || isScanning ? 'animate-pulse' : ''}`}>
                  <div className="text-[7px] text-slate-500 uppercase font-mono mb-1">Environmental Flux</div>
                  <div className={`text-xs font-bold ${isAnomaly ? 'text-red-400' : 'text-green-400'}`}>
                    {isScanning ? 'CALIBRATING...' : (isAnomaly ? '+44.2% [HIGH]' : '0.12% [STABLE]')}
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 border border-slate-700/50">
                  <div className="text-[7px] text-slate-500 uppercase font-mono mb-1">Data Jitter</div>
                  <div className={`text-xs font-bold ${isAnomaly || isScanning ? 'text-yellow-400' : 'text-cyan-400'}`}>
                    {isScanning ? 'SYNCING...' : (isAnomaly ? '82ms [LAG]' : '2ms [SYNC]')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-slate-800">
            <div className={`text-[8px] font-mono uppercase max-w-[200px] leading-tight ${isAnomaly || isScanning ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
              {isScanning ? '// INITIATING DEEP SCAN GROUNDING... // ACCESSING GLOBAL ARCHIVES' : (isAnomaly ? '// CRITICAL: SENSOR READINGS OUTSIDE NORMAL PARAMETERS // ANALYZE IMMEDIATELY' : '// DATA EXTRACTED FROM ARCHIVE SECTOR 7G // TIMELINE INTEGRITY CHECKED')}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={onClose}
                disabled={isScanning}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-[11px] font-bold rounded-xl border border-slate-700 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
              >
                Dismiss Alert
              </button>
              <button 
                onClick={isHistory ? handleRestoreAction : handleDetailedScan}
                disabled={isScanning || isRestoring}
                className={`px-8 py-3 font-orbitron text-[11px] font-bold rounded-xl border-t transition-all uppercase tracking-[0.2em] flex items-center gap-3 active:scale-95 disabled:opacity-50
                  ${isHistory ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.4)]' : 
                    isAnomaly ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-[0_10px_30px_rgba(168,85,247,0.4)]' : 
                    'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_10px_30px_rgba(34,211,238,0.4)]'}`}
              >
                {isScanning ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : null}
                <span>{isScanning ? 'Scanning...' : (isHistory ? 'Restore Timeline' : isAnomaly ? 'Isolate Anomaly' : 'Detailed Scan')}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Subtle noise effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      <style>{`
        @keyframes anomalyFrameGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.2); }
          50% { box-shadow: 0 0 70px rgba(168, 85, 247, 0.4); }
        }
        @keyframes textJitter {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(1.5px, -1px); text-shadow: 2px 0 red, -2px 0 cyan; }
          95% { transform: translate(-1.5px, 1px); text-shadow: -2px 0 red, 2px 0 cyan; }
          97% { transform: translate(1px, 0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1); translateY(0); }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MarkerModal;