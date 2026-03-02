import React from 'react';
import { LocationInfo } from '../types';

interface MissionBriefingProps {
  location: LocationInfo | null;
  loading: boolean;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({ location, loading }) => {
  if (!location && !loading) return null;

  return (
    <div className="border border-cyan-500/20 bg-slate-900/40 rounded-lg p-4 relative overflow-hidden group blueprint-border">
      <div className="blueprint-corner-tl"></div>
      <div className="blueprint-corner-tr"></div>
      
      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
        <div className="text-[8px] font-mono text-cyan-500">PROJECT_VALT_v1.0</div>
      </div>
      
      <h4 className="text-[10px] font-orbitron text-cyan-500/70 uppercase mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-cyan-500 animate-pulse rounded-full shadow-[0_0_8px_#22d3ee]"></span>
        Active Mission Briefing
      </h4>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-20 bg-slate-800 rounded"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-[8px] text-slate-500 uppercase font-mono mb-1">Objective Location</div>
            <div className="text-sm font-bold text-white font-orbitron tracking-wide">{location?.name}</div>
          </div>

          <div>
            <div className="text-[8px] text-slate-500 uppercase font-mono mb-1">Strategic Context</div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "{location?.strategicContext || "The RAI sensors are analyzing the sector. Initial scans suggest a nexus of strategic interest."}"
            </p>
          </div>

          {location?.groundingSources && location.groundingSources.length > 0 && (
            <div className="space-y-2">
              <div className="text-[8px] text-slate-500 uppercase font-mono mb-1">Intelligence Sources</div>
              <div className="flex flex-wrap gap-2">
                {location.groundingSources.slice(0, 3).map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[8px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 px-2 py-1 rounded text-cyan-400 transition-all truncate max-w-[120px]"
                    title={source.title}
                  >
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div>
              <div className="text-[7px] text-slate-600 uppercase font-mono">Priority</div>
              <div className="text-[10px] text-cyan-400 font-bold">ALPHA_ONE</div>
            </div>
            <div>
              <div className="text-[7px] text-slate-600 uppercase font-mono">Intel Source</div>
              <div className="text-[10px] text-purple-400 font-bold">VALT_UPLINK</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800/50">
        <button className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-[9px] font-orbitron font-bold text-cyan-400 transition-all uppercase tracking-widest">
          Download Intel Packet
        </button>
      </div>
    </div>
  );
};

export default MissionBriefing;
