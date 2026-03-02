import React from 'react';
import { VisualStyle, ExplorationMode } from '../types';

interface VisualControlsProps {
  styles: VisualStyle[];
  selectedStyle: VisualStyle;
  onStyleSelect: (style: VisualStyle) => void;
  modes: ExplorationMode[];
  selectedMode: ExplorationMode;
  onModeSelect: (mode: ExplorationMode) => void;
  customPrompt: string;
  onPromptChange: (prompt: string) => void;
  onRegenerate: () => void;
  disabled: boolean;
  zoom: number;
  onZoomChange: (amount: number) => void;
  onPanVertical: (amount: number) => void;
  onPanHorizontal: (amount: number) => void;
  onResetView: () => void;
}

const VisualControls: React.FC<VisualControlsProps> = ({
  styles,
  selectedStyle,
  onStyleSelect,
  modes,
  selectedMode,
  onModeSelect,
  customPrompt,
  onPromptChange,
  onRegenerate,
  disabled,
  zoom,
  onZoomChange,
  onPanVertical,
  onPanHorizontal,
  onResetView
}) => {
  return (
    <div className="absolute top-24 left-8 z-20 flex flex-col gap-3 group/controls">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/20 p-3 rounded-lg shadow-2xl transition-all duration-300 opacity-0 group-hover/controls:opacity-100 hover:opacity-100 -translate-x-4 group-hover/controls:translate-x-0 blueprint-border">
        <div className="blueprint-corner-tl"></div>
        <div className="blueprint-corner-tr"></div>
        <div className="blueprint-corner-bl"></div>
        <div className="blueprint-corner-br"></div>
        
        <div className="text-[10px] font-orbitron theme-text-primary mb-3 uppercase tracking-widest flex items-center justify-between">
          <span>#SYSTEM_THEME_ENGINE</span>
          <div className="w-1.5 h-1.5 theme-bg-primary rounded-full animate-ping shadow-[0_0_8px_#22d3ee]"></div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Zoom & Pan Controls */}
          <div className="space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-mono flex justify-between">
              <span>Optic Controls</span>
              <span className="theme-text-primary">Zoom: {zoom.toFixed(1)}x</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="col-start-2">
                <button onClick={() => onPanVertical(-5)} className="w-full aspect-square flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded hover:border-[var(--theme-primary)] theme-text-primary transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                </button>
              </div>
              <div className="col-start-1 row-start-2">
                <button onClick={() => onPanHorizontal(-5)} className="w-full aspect-square flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded hover:border-[var(--theme-primary)] theme-text-primary transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>
              <div className="col-start-2 row-start-2">
                <button onClick={onResetView} className="w-full aspect-square flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded hover:border-[var(--theme-primary)] theme-text-primary transition-all active:scale-90 text-[8px] font-bold">
                  RST
                </button>
              </div>
              <div className="col-start-3 row-start-2">
                <button onClick={() => onPanHorizontal(5)} className="w-full aspect-square flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded hover:border-[var(--theme-primary)] theme-text-primary transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="col-start-2 row-start-3">
                <button onClick={() => onPanVertical(5)} className="w-full aspect-square flex items-center justify-center bg-slate-800/50 border border-slate-700 rounded hover:border-[var(--theme-primary)] theme-text-primary transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              
              {/* Zoom Buttons */}
              <div className="col-start-1 row-start-1">
                <button onClick={() => onZoomChange(0.2)} className="w-full h-full flex items-center justify-center bg-cyan-500/20 border border-cyan-500/50 rounded hover:bg-cyan-500/40 text-cyan-400 transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
              <div className="col-start-3 row-start-1">
                <button onClick={() => onZoomChange(-0.2)} className="w-full h-full flex items-center justify-center bg-cyan-500/20 border border-cyan-500/50 rounded hover:bg-cyan-500/40 text-cyan-400 transition-all active:scale-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Exploration Mode Selector */}
          <div className="space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-mono">Exploration Mode</div>
            <div className="flex flex-col gap-1">
              {modes.map(mode => (
                <button
                  key={mode}
                  onClick={() => onModeSelect(mode)}
                  disabled={disabled}
                  className={`px-3 py-1.5 rounded text-[8px] font-bold font-orbitron transition-all border text-left flex items-center justify-between ${
                    selectedMode === mode 
                      ? 'bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] theme-text-primary shadow-[0_0_8px_var(--theme-accent-glow)]' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span>{mode.toUpperCase()}</span>
                  {selectedMode === mode && <span className="w-1 h-1 theme-bg-primary rounded-full"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-mono">Visual Theme</div>
            <div className="grid grid-cols-2 gap-1.5">
              {styles.map(style => (
                <button
                  key={style}
                  onClick={() => onStyleSelect(style)}
                  disabled={disabled}
                  className={`px-2 py-1.5 rounded text-[8px] font-bold font-orbitron transition-all border ${
                    selectedStyle === style 
                      ? 'bg-[var(--theme-primary)]/20 border-[var(--theme-primary)] theme-text-primary shadow-[0_0_8px_var(--theme-accent-glow)]' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {style.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Override */}
          <div className="space-y-2">
            <div className="text-[8px] text-slate-500 uppercase font-mono flex justify-between items-center">
              <span>#OVERRIDE_SPECIFICS</span>
              <span className="text-[7px] opacity-40">AI_INFLUENCE_ACTIVE</span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => onPromptChange(e.target.value)}
                disabled={disabled}
                placeholder="Add custom details (e.g. 'neon rain')..."
                className="w-full bg-slate-950/50 border border-slate-700 rounded px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-[var(--theme-primary)] text-slate-200 placeholder:text-slate-700 transition-all"
                onKeyDown={(e) => e.key === 'Enter' && !disabled && onRegenerate()}
              />
              <button
                onClick={onRegenerate}
                disabled={disabled || !customPrompt.trim()}
                className={`w-full py-1.5 rounded font-orbitron font-bold text-[8px] tracking-[0.2em] transition-all border ${
                  disabled || !customPrompt.trim()
                    ? 'bg-slate-800/50 text-slate-600 border-slate-700 cursor-not-allowed'
                    : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)] active:scale-95'
                }`}
              >
                APPLY_MODIFIER
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onRegenerate}
            disabled={disabled}
            className={`w-full py-2 rounded font-orbitron font-bold text-[10px] tracking-widest transition-all ${
              disabled 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                : 'bg-[var(--theme-primary)] hover:brightness-110 text-black shadow-[0_0_15px_var(--theme-accent-glow)] border-t border-white/20 active:scale-95'
            }`}
          >
            {disabled ? 'SYNCING...' : 'INITIATE RENDER'}
          </button>
        </div>
      </div>
      
      {/* Tab handle when collapsed */}
      <div className="bg-[var(--theme-primary)]/10 backdrop-blur-sm border border-[var(--theme-primary)]/30 p-2 rounded-lg theme-text-primary cursor-pointer flex items-center justify-center opacity-100 group-hover/controls:opacity-0 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 v2m0-6V4" />
        </svg>
      </div>
    </div>
  );
};

export default VisualControls;