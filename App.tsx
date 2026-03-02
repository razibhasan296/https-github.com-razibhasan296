import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateLocationData, generate360View } from './services/geminiService';
import { LocationInfo, BotLockStatus, HistoryEntry, VisualStyle, MarkerData, ExplorationMode, SensorData } from './types';
import BotInterface from './components/BotInterface';
import SensorOverlay from './components/SensorOverlay';
import VisualControls from './components/VisualControls';
import CameraFeed from './components/CameraFeed';
import AudioManager from './components/AudioManager';
import InteractiveMarker from './components/InteractiveMarker';
import MarkerModal from './components/MarkerModal';
import MarkerCluster from './components/MarkerCluster';
import MissionBriefing from './components/MissionBriefing';
import VisualElementGenerator from './components/VisualElementGenerator';
import OrbitalNetwork from './components/OrbitalNetwork';

const INITIAL_LOCATION = "Nexus Prime World Map Hub";
const VISUAL_STYLES: VisualStyle[] = ['Cinematic', 'Thermal', 'Night Vision', 'Cyberpunk', 'Deep Space', 'Post-Apocalyptic', 'Solar-Punk', 'Diplomatic'];
const EXPLORATION_MODES: ExplorationMode[] = ['Street View', 'Satellite View', '3D City Model', 'Strategic Hub'];
const CLUSTER_THRESHOLD = 12;

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const THEME_CONFIGS: Record<VisualStyle, { primary: string, secondary: string, accent: string, bg: string, glow: string }> = {
  'Cinematic': { primary: '#22d3ee', secondary: '#a855f7', accent: '#ec4899', bg: '#000000', glow: 'rgba(34, 211, 238, 0.4)' },
  'Thermal': { primary: '#ef4444', secondary: '#f97316', accent: '#fbbf24', bg: '#1a0505', glow: 'rgba(239, 68, 68, 0.4)' },
  'Night Vision': { primary: '#22c55e', secondary: '#15803d', accent: '#86efac', bg: '#050a05', glow: 'rgba(34, 197, 94, 0.4)' },
  'Cyberpunk': { primary: '#f472b6', secondary: '#22d3ee', accent: '#a855f7', bg: '#020617', glow: 'rgba(244, 114, 182, 0.4)' },
  'Deep Space': { primary: '#6366f1', secondary: '#3730a3', accent: '#22d3ee', bg: '#020617', glow: 'rgba(99, 102, 241, 0.4)' },
  'Post-Apocalyptic': { primary: '#b45309', secondary: '#4d7c0f', accent: '#78350f', bg: '#1c1917', glow: 'rgba(180, 83, 9, 0.4)' },
  'Solar-Punk': { primary: '#10b981', secondary: '#fbbf24', accent: '#6ee7b7', bg: '#064e3b', glow: 'rgba(16, 185, 129, 0.4)' },
  'Diplomatic': { primary: '#fbbf24', secondary: '#1e40af', accent: '#f8fafc', bg: '#0f172a', glow: 'rgba(251, 191, 36, 0.4)' },
};

const App: React.FC = () => {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [liveSensorData, setLiveSensorData] = useState<SensorData | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<BotLockStatus>(BotLockStatus.UNLOCKED);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollPos, setScrollPos] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [verticalPan, setVerticalPan] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('Cinematic');
  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('Street View');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAutoPanning, setIsAutoPanning] = useState(true);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [showAROverlay, setShowAROverlay] = useState(true);
  const [customMarkers, setCustomMarkers] = useState<MarkerData[]>([]);
  const [isApiKeySelected, setIsApiKeySelected] = useState<boolean | null>(null);

  // Touch gesture refs
  const touchStartRef = React.useRef<{
    distance: number;
    midpoint: { x: number; y: number };
    zoom: number;
    scrollPos: number;
    verticalPan: number;
  } | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey);
      } else {
        // Fallback for environments without the aistudio object
        setIsApiKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsApiKeySelected(true);
      // Re-fetch data if it was stuck on quota error
      if (quotaExceeded) {
        setQuotaExceeded(false);
        fetchRaiData(locationInfo?.name || INITIAL_LOCATION, selectedStyle, explorationMode);
      }
    }
  };

  useEffect(() => {
    const config = THEME_CONFIGS[selectedStyle];
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', config.primary);
    root.style.setProperty('--theme-secondary', config.secondary);
    root.style.setProperty('--theme-accent', config.accent);
    root.style.setProperty('--theme-bg', config.bg);
    root.style.setProperty('--theme-accent-glow', config.glow);
  }, [selectedStyle]);

  const fetchRaiData = useCallback(async (target: string, style: VisualStyle = 'Cinematic', mode: ExplorationMode = 'Street View', customStr: string = '') => {
    setLoading(true);
    setThinking(true);
    setQuotaExceeded(false);
    setLockStatus(BotLockStatus.SCANNING);
    setSelectedMarker(null); 
    setCustomMarkers([]); // Clear custom markers on location change
    try {
      const info = await generateLocationData(target);
      setLocationInfo(info);
      setThinking(false);
      setLiveSensorData(info.sensorSummary);
      const fullPrompt = `${target} in a ${style} style. ${customStr}`;
      const view = await generate360View(fullPrompt, mode);
      setViewUrl(view);
      setHistory(prev => [{ id: Date.now().toString(), location: info.name, timestamp: new Date().toLocaleTimeString(), imageUrl: view, style: style }, ...prev.slice(0, 19)]);
      setLockStatus(BotLockStatus.LOCKED);
    } catch (error: any) {
      console.error("RAI Access Denied:", error);
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('EXHAUSTED')) {
        setQuotaExceeded(true);
      }
      setLockStatus(BotLockStatus.OVERRIDE);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  }, []);

  const regenerateImage = async () => {
    if (!locationInfo) return;
    setImageLoading(true);
    setQuotaExceeded(false);
    try {
      const fullPrompt = `${locationInfo.name} in a ${selectedStyle} style. ${customPrompt}`;
      const view = await generate360View(fullPrompt, explorationMode);
      setViewUrl(view);
      setHistory(prev => [{ id: Date.now().toString(), location: locationInfo.name, timestamp: new Date().toLocaleTimeString(), imageUrl: view, style: selectedStyle }, ...prev.slice(0, 19)]);
      setLockStatus(BotLockStatus.LOCKED);
    } catch (error: any) {
      console.error("RAI Visual Recalibration Failed:", error);
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('EXHAUSTED')) {
        setQuotaExceeded(true);
      }
      setLockStatus(BotLockStatus.OVERRIDE);
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (locationInfo && liveSensorData && !loading && !imageLoading) {
      const interval = setInterval(() => {
        setLiveSensorData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            temperature: prev.temperature + (Math.random() - 0.5) * 0.2,
            humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 0.5)),
            pressure: prev.pressure + (Math.random() - 0.5) * 1,
            radiation: Math.max(0, prev.radiation + (Math.random() - 0.5) * 0.05),
            aiSync: Math.max(0, Math.min(100, prev.aiSync + (Math.random() - 0.5) * 0.1)),
            raiStability: Math.max(0, Math.min(1, prev.raiStability + (Math.random() - 0.5) * 0.01)),
          };
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [locationInfo, loading, imageLoading]);

  useEffect(() => {
    fetchRaiData(INITIAL_LOCATION, selectedStyle, explorationMode);
  }, [fetchRaiData]);

  useEffect(() => {
    if (!loading && viewUrl && isAutoPanning && !isHoverPaused) {
      const interval = setInterval(() => {
        setScrollPos(prev => (prev + 0.04) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [loading, viewUrl, isAutoPanning, isHoverPaused]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchRaiData(searchQuery, selectedStyle, explorationMode);
      setSearchQuery('');
    }
  };

  const getRandomLocation = () => {
    const locations = ["Deep Sea RAI Node", "Arctic Satellite Array", "Cyber-Sahara Solar Colony", "Bioluminescent Forest X-12", "Low Earth Orbit RAI Station", "Martian Terraforming Site", "Dhaka Strategic Hub, Bangladesh"];
    const random = locations[Math.floor(Math.random() * locations.length)];
    fetchRaiData(random, selectedStyle, explorationMode);
  };

  const resetToHub = () => {
    fetchRaiData(INITIAL_LOCATION, 'Cinematic', 'Street View');
  };

  const nudgeScroll = (amount: number) => {
    setIsAutoPanning(false);
    setScrollPos(prev => {
      let next = (prev + amount) % 100;
      if (next < 0) next += 100;
      return next;
    });
  };

  const nudgeVertical = (amount: number) => {
    setVerticalPan(prev => {
      const next = prev + amount;
      return Math.max(-50, Math.min(50, next));
    });
  };

  const adjustZoom = (amount: number) => {
    setZoom(prev => {
      const next = prev + amount;
      return Math.max(1, Math.min(5, next));
    });
  };

  const resetView = () => {
    setZoom(1);
    setVerticalPan(0);
    setScrollPos(0);
    setIsAutoPanning(true);
  };

  const handleMarkerActivate = (marker: MarkerData) => {
    setSelectedMarker(marker);
    setIsAutoPanning(false); 
  };

  const handleRestoreTimeline = (locationName: string) => {
    fetchRaiData(locationName, selectedStyle, explorationMode);
  };

  const handleViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    adjustZoom(delta);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      
      touchStartRef.current = {
        distance,
        midpoint,
        zoom,
        scrollPos,
        verticalPan
      };
      setIsAutoPanning(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const currentMidpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };

      const { distance: startDist, midpoint: startMid, zoom: startZoom, scrollPos: startScroll, verticalPan: startVert } = touchStartRef.current;

      // Pinch to zoom
      const zoomFactor = currentDistance / startDist;
      const newZoom = Math.max(1, Math.min(5, startZoom * zoomFactor));
      setZoom(newZoom);

      // Two-finger pan
      const dx = currentMidpoint.x - startMid.x;
      const dy = currentMidpoint.y - startMid.y;

      // Horizontal pan (scrollPos)
      // Sensitivity adjustment based on zoom
      const horizontalSensitivity = 0.1 / newZoom; 
      let nextScroll = (startScroll - (dx * horizontalSensitivity)) % 100;
      if (nextScroll < 0) nextScroll += 100;
      setScrollPos(nextScroll);

      // Vertical pan
      const verticalSensitivity = 0.1 / newZoom;
      const nextVert = Math.max(-50, Math.min(50, startVert + (dy * verticalSensitivity)));
      setVerticalPan(nextVert);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleDeployElement = (imageUrl: string, label: string) => {
    const newMarker: MarkerData = {
      id: `custom-${Date.now()}`,
      label,
      description: `User-synthesized visual element deployed via RAI Lab.`,
      type: 'Custom',
      thumbnailUrl: imageUrl,
      x: 50 + (Math.random() - 0.5) * 20, // Deploy near center
      y: 50 + (Math.random() - 0.5) * 10
    };
    setCustomMarkers(prev => [...prev, newMarker]);
    setShowAROverlay(true);
  };

  const clusters = useMemo(() => {
    if (loading || imageLoading || history.length <= 1) return [];
    const historyMarkers: MarkerData[] = history.slice(1, 11).map((entry, idx) => ({
      id: entry.id,
      label: `Echo: ${entry.location}`,
      description: `Temporal fracture detected from RAI capture at ${entry.timestamp}. Restore this timeline to revisit coordinates.`,
      type: 'History',
      thumbnailUrl: entry.imageUrl,
      x: 10 + (idx * 25) % 80 + (Math.sin(idx) * 8), 
      y: 40 + (Math.cos(idx) * 20)
    }));
    const result: MarkerData[][] = [];
    const used = new Set<string>();
    historyMarkers.forEach((m1) => {
      if (used.has(m1.id)) return;
      const currentGroup = [m1];
      used.add(m1.id);
      historyMarkers.forEach((m2) => {
        if (used.has(m2.id)) return;
        const dist = Math.sqrt(Math.pow(m1.x - m2.x, 2) + Math.pow(m1.y - m2.y, 2));
        if (dist < CLUSTER_THRESHOLD) {
          currentGroup.push(m2);
          used.add(m2.id);
        }
      });
      result.push(currentGroup);
    });
    return result;
  }, [history, loading, imageLoading]);

  const isAtHub = locationInfo?.name.includes("World Map Hub");

  if (isApiKeySelected === false) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="scanline"></div>
        <div className="absolute inset-0 hologram-grid opacity-10"></div>
        
        <div className="max-w-md w-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.1)] z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <span className="text-4xl">🔑</span>
          </div>
          
          <h1 className="font-orbitron font-bold text-2xl text-cyan-400 mb-2 uppercase tracking-tighter">Uplink Authorization Required</h1>
          <p className="text-slate-400 text-sm mb-8 font-mono leading-relaxed">
            To access the SMARTAIMAP RAI Core and avoid shared quota limits, you must select a paid Google Cloud project API key.
          </p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all active:scale-95 uppercase tracking-widest"
            >
              Select API Key
            </button>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-[10px] text-slate-500 hover:text-cyan-400 transition-colors uppercase font-mono tracking-widest"
            >
              Learn about Gemini API Billing ↗
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800 w-full text-[9px] text-slate-600 font-mono uppercase tracking-widest">
            #RAI_SMARTAIBOT #BODYLOCK_PROTOCOLS
          </div>
        </div>
      </div>
    );
  }

  if (isApiKeySelected === null) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#020617] text-slate-200 blueprint-grid relative">
      <div className="absolute inset-0 blueprint-subgrid pointer-events-none opacity-20"></div>
      <div className="scanline"></div>
      {locationInfo && (
        <AudioManager profile={locationInfo.soundProfile} status={lockStatus} scrollPos={scrollPos} isMuted={isMuted} />
      )}

      <header className="h-16 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 z-20 blueprint-border">
        <div className="blueprint-corner-tl"></div>
        <div className="blueprint-corner-tr"></div>
        
        <div className="flex items-center gap-3">
          <button onClick={resetToHub} className="w-10 h-10 bg-cyan-500 rounded flex items-center justify-center font-orbitron font-bold text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:scale-105 transition-transform" >
            <span className="text-xl">🌍</span>
          </button>
          <div>
            <h1 className="font-orbitron font-bold text-xl tracking-tighter text-cyan-400 uppercase">Smart AI Map</h1>
            <div className="text-[9px] text-cyan-500/50 uppercase tracking-[0.4em] leading-none">#ORBITAL_INTEL_NETWORK</div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <button onClick={resetToHub} className={`px-6 py-2 border rounded font-orbitron font-bold text-[10px] tracking-widest transition-all uppercase mr-4 ${isAtHub ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400'}`} >
            WORLD_MAP_UPLINK
          </button>
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter Target Location for #RAI Scan..." className="w-full bg-slate-800/30 border border-cyan-500/20 rounded-lg px-5 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all text-cyan-100 placeholder:text-slate-600" />
            <button type="submit" className="absolute right-3 top-2 text-slate-500 hover:text-cyan-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border transition-all ${isMuted ? 'border-slate-700 text-slate-500 bg-slate-800/50' : 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]'}`} title={isMuted ? "Unmute Ambient" : "Mute Ambient"} >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          
          <button onClick={getRandomLocation} className="group relative bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded text-[10px] font-bold font-orbitron transition-all overflow-hidden" >
            <span className="relative z-10">RANDOM_ACCESS</span>
            <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          </button>

          <button onClick={() => fetchRaiData("Prime Minister's Office, Dhaka, Bangladesh", 'Diplomatic', 'Strategic Hub')} className="group relative bg-blue-900/40 hover:bg-blue-800/60 text-amber-400 border border-amber-500/30 px-4 py-2 rounded text-[10px] font-bold font-orbitron transition-all overflow-hidden shadow-[0_0_10px_rgba(251,191,36,0.2)]" >
            <span className="relative z-10">PROJECT_VALT_UPLINK</span>
            <div className="absolute inset-0 bg-amber-500/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className="w-80 border-r border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl p-4 flex flex-col gap-6 z-10 overflow-y-auto custom-scrollbar blueprint-border">
          <div className="blueprint-corner-tl"></div>
          <div className="blueprint-corner-bl"></div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest flex items-center justify-between px-1">
              <span>Orbital Network</span>
              <span className="text-[8px] opacity-50">STARLINK_v4.2</span>
            </h4>
            <div className="aspect-square rounded-xl border border-cyan-500/20 overflow-hidden blueprint-border">
              <OrbitalNetwork />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest flex items-center justify-between px-1">
              <span>Visor Feedback</span>
              <span className="text-[8px] opacity-50">SYNC_ACTIVE</span>
            </h4>
            <CameraFeed />
          </div>

          <MissionBriefing location={locationInfo} loading={loading} />

          <VisualElementGenerator onDeploy={handleDeployElement} disabled={loading || imageLoading} />
          
          {liveSensorData && !quotaExceeded && <SensorOverlay data={liveSensorData} />}
          
          <BotInterface status={lockStatus} onStatusChange={(s) => {
            if (quotaExceeded && s !== BotLockStatus.OVERRIDE) setQuotaExceeded(false);
            setLockStatus(s);
          }} />

          <div className={`border rounded-lg p-3 relative overflow-hidden transition-all duration-500 ${quotaExceeded ? 'bg-red-950/40 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-slate-900/40 border-slate-800'}`}>
            <h4 className={`text-[10px] font-orbitron mb-2 uppercase ${quotaExceeded ? 'text-red-500' : 'text-cyan-500/70'}`}>
              {quotaExceeded ? '#CORE_QUOTA_EXCEEDED' : '#ENVIRONMENT_INTEL'}
            </h4>
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-800/50 rounded w-3/4"></div>
                <div className="h-3 bg-slate-800/50 rounded"></div>
              </div>
            ) : quotaExceeded ? (
              <div className="space-y-3">
                <div className="text-[11px] text-red-400 font-mono leading-relaxed">
                  CRITICAL: Gemini RAI CORE uplink limit reached (429). Please use a paid API key to bypass shared environment limits.
                </div>
                <button onClick={handleOpenKeySelector} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-[9px] rounded shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all uppercase mb-2" >
                  Connect Paid API Key
                </button>
                <button onClick={() => fetchRaiData(locationInfo?.name || INITIAL_LOCATION)} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-[9px] rounded shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all uppercase" >
                  Retry Handshake
                </button>
              </div>
            ) : locationInfo ? (
              <>
                <div className="text-white font-bold mb-1 font-orbitron text-sm tracking-wide">{locationInfo.name}</div>
                <div className="text-[10px] text-slate-500 mb-2 font-mono flex items-center gap-2">
                  <span className="theme-text-primary">POS:</span> {locationInfo.coordinates.lat.toFixed(4)}, {locationInfo.coordinates.lng.toFixed(4)}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400 mb-3 border-l theme-border-primary pl-2">
                  {locationInfo.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase">Threat:</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    locationInfo.threatLevel === 'Low' ? 'border-green-500/50 text-green-400 bg-green-500/5' : 
                    locationInfo.threatLevel === 'Moderate' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/5' : 
                    'border-red-500/50 text-red-400 bg-red-500/5'
                  }`}>
                    {locationInfo.threatLevel.toUpperCase()}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </aside>

        <section className="flex-1 relative overflow-hidden bg-black flex items-center justify-center blueprint-border">
          <div className="blueprint-corner-tl"></div>
          <div className="blueprint-corner-tr"></div>
          <div className="blueprint-corner-bl"></div>
          <div className="blueprint-corner-br"></div>
          
          <MarkerModal marker={selectedMarker} locationName={locationInfo?.name} onClose={() => setSelectedMarker(null)} onRestore={handleRestoreTimeline} />
          
          {isAtHub && !loading && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2">
              <div className="px-4 py-1 bg-cyan-500/10 border border-cyan-400/50 backdrop-blur-xl rounded-full">
                <span className="text-[10px] font-orbitron font-bold text-cyan-400 tracking-[0.3em] uppercase block text-center">
                  #SMARTAIMAP #RAI #SMARTAIBOTBODYLOCK #ENVIRONMENT
                </span>
              </div>
              <div className="text-[8px] font-mono text-cyan-500/60 uppercase tracking-widest animate-pulse">
                System Global Hub Uplink Established
              </div>
            </div>
          )}

          {(loading || imageLoading) && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 text-cyan-400 gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-2 border-cyan-400/20 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
                <div className="absolute inset-0 w-20 h-20 border-t-2 border-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-4 w-12 h-12 border-b-2 border-purple-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
              </div>
              <div className="flex flex-col items-center px-6">
                <div className="font-orbitron animate-pulse uppercase tracking-[0.4em] text-sm text-center">
                  {thinking ? 'RAI Core Reasoning Engaged' : (loading ? 'Synchronizing RAI Interface' : 'Recalibrating Visual Lens')}
                </div>
                {thinking && (
                  <div className="text-[10px] text-cyan-500/60 mt-2 font-mono animate-pulse">
                    [SEARCHING_GROUNDING_DATA] [EXECUTING_STRATEGIC_ANALYSIS]
                  </div>
                )}
                <div className="text-[9px] font-mono text-slate-500 mt-2 uppercase">ENCRYPTING BODYLOCK PROTOCOLS...</div>
              </div>
            </div>
          )}

          {viewUrl ? (
            <div 
              className="w-full h-full relative group cursor-crosshair overflow-hidden touch-none"
              onClick={handleViewClick}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {ripples.map(ripple => (
                <React.Fragment key={ripple.id}>
                  <div 
                    className="absolute rounded-full border-2 border-[var(--theme-primary)] pointer-events-none z-[45] animate-holographicRipple"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 20px var(--theme-primary), inset 0 0 10px var(--theme-primary)'
                    }}
                  />
                  <div 
                    className="absolute rounded-full border border-[var(--theme-secondary)] pointer-events-none z-[44] animate-holographicRippleSecondary"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </React.Fragment>
              ))}

              <div className="absolute inset-0 flex transition-all duration-500 ease-out" style={{ transform: `translateX(-${scrollPos}%) translateY(${verticalPan}%) scale(${zoom})` }} >
                <div className="relative h-full min-w-[300vw]">
                  <img src={viewUrl} alt="360 Perspective" className="h-full object-cover w-full brightness-110 contrast-110 pointer-events-none select-none image-pulse-vitals" />
                  
                  {/* AR Overlay Layer */}
                  {showAROverlay && !loading && !imageLoading && !quotaExceeded && (
                    <div className="absolute inset-0 pointer-events-none z-30">
                      {locationInfo?.markers.map((marker) => (
                        <InteractiveMarker key={marker.id} marker={marker} onActivate={handleMarkerActivate} />
                      ))}
                      {customMarkers.map((marker) => (
                        <InteractiveMarker key={marker.id} marker={marker} onActivate={handleMarkerActivate} />
                      ))}
                      {clusters.map((markerList, idx) => (
                        <MarkerCluster key={`cluster-${idx}`} clusterId={`cluster-${idx}`} markers={markerList} onMarkerActivate={handleMarkerActivate} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-4 px-10 pointer-events-none group-hover:opacity-100 opacity-40 transition-opacity">
                <div className="flex items-center gap-4 pointer-events-auto bg-slate-950/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
                  
                  {/* AR Toggle Button integrated into HUD */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowAROverlay(!showAROverlay); }} 
                    className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center gap-2 group/btn ${showAROverlay ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' : 'border-slate-700 text-slate-500 bg-slate-800/50'}`}
                    title={showAROverlay ? "Hide AR Elements" : "Show AR Elements"}
                  >
                    <span className="text-[9px] font-orbitron font-bold uppercase tracking-tighter">AR_Overlay</span>
                    <span className="text-xl block leading-none group-hover/btn:scale-110 transition-transform">{showAROverlay ? '👁️' : '🕶️'}</span>
                  </button>

                  <div className="w-[1px] h-8 bg-slate-800 mx-1"></div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button onClick={(e) => { e.stopPropagation(); adjustZoom(-0.2); }} className="p-1.5 hover:bg-cyan-500/20 rounded-lg theme-text-primary transition-all active:scale-90" title="Zoom Out">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="px-2 min-w-[40px] text-center">
                      <span className="text-[10px] font-orbitron font-bold theme-text-primary">{zoom.toFixed(1)}x</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); adjustZoom(0.2); }} className="p-1.5 hover:bg-cyan-500/20 rounded-lg theme-text-primary transition-all active:scale-90" title="Zoom In">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  <div className="w-[1px] h-8 bg-slate-800 mx-1"></div>

                  <button onClick={(e) => { e.stopPropagation(); nudgeScroll(-5); }} className="p-2 hover:bg-cyan-500/20 rounded-full theme-text-primary transition-all hover:scale-110" title="Pan Left" >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex flex-col items-center gap-1 w-64">
                    <input type="range" min="0" max="100" step="0.1" value={scrollPos} onClick={(e) => e.stopPropagation()} onChange={(e) => { setIsAutoPanning(false); setScrollPos(parseFloat(e.target.value)); }} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all" />
                    <div className="text-[8px] font-mono text-cyan-500/60 flex justify-between w-full uppercase tracking-tighter">
                      <span>0°</span> <span>180° [CENTER]</span> <span>360°</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); nudgeScroll(5); }} className="p-2 hover:bg-cyan-500/20 rounded-full theme-text-primary transition-all hover:scale-110" title="Pan Right" >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="h-8 w-px bg-slate-800 mx-2"></div>
                  <button onClick={(e) => { e.stopPropagation(); setIsAutoPanning(!isAutoPanning); }} className={`px-3 py-1 rounded border text-[8px] font-orbitron font-bold transition-all ${ isAutoPanning ? 'bg-cyan-500/20 border-cyan-400 theme-text-primary' : 'bg-slate-800 border-slate-700 text-slate-500 hover:theme-text-primary hover:border-cyan-400/50' }`} >
                    {isAutoPanning ? 'AUTOPAN_ON' : 'AUTOPAN_OFF'}
                  </button>
                </div>
              </div>

              <VisualControls 
                styles={VISUAL_STYLES} 
                selectedStyle={selectedStyle} 
                onStyleSelect={setSelectedStyle} 
                modes={EXPLORATION_MODES}
                selectedMode={explorationMode}
                onModeSelect={setExplorationMode}
                customPrompt={customPrompt} 
                onPromptChange={setCustomPrompt} 
                onRegenerate={regenerateImage} 
                disabled={loading || imageLoading} 
                zoom={zoom}
                onZoomChange={adjustZoom}
                onPanVertical={nudgeVertical}
                onPanHorizontal={nudgeScroll}
                onResetView={resetView}
              />

              {/* Prominent Explore Button */}
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                <button 
                  onClick={getRandomLocation}
                  disabled={loading || imageLoading}
                  className={`group relative px-10 py-4 rounded-full font-orbitron font-bold text-sm tracking-[0.3em] transition-all overflow-hidden border-2 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] active:scale-95 ${
                    loading || imageLoading 
                      ? 'bg-slate-900/80 border-slate-800 text-slate-600 cursor-not-allowed' 
                      : 'bg-cyan-500/10 border-cyan-400 text-cyan-400 hover:bg-cyan-500/20'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <span className="text-xl animate-pulse">🔭</span>
                    {loading || imageLoading ? 'RAI_SCAN_IN_PROGRESS' : 'EXPLORE_WORLD'}
                  </span>
                  {!loading && !imageLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  )}
                  <div className="absolute -inset-1 bg-cyan-400 opacity-10 blur-xl group-hover:opacity-30 transition-opacity"></div>
                </button>
              </div>
              
              <div className="holographic-view-glow"></div>
              <div className="absolute inset-0 hologram-shimmer pointer-events-none z-10"></div>
              <div className="absolute inset-0 hologram-grid pointer-events-none z-5"></div>
              
              <div className="absolute top-8 left-8 p-4 border-l-2 border-cyan-400 bg-slate-950/60 text-[9px] font-mono uppercase space-y-1 z-20 backdrop-blur-sm">
                <div className="text-cyan-400 font-bold">LINK_FEED_ACTIVE</div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase tracking-tighter">Bodylock:</span>
                  <span className={`font-bold animate-pulse ${lockStatus === BotLockStatus.OVERRIDE ? 'text-red-500' : 'text-green-400'}`}>
                    {lockStatus === BotLockStatus.OVERRIDE ? (quotaExceeded ? 'QUOTA_LIMIT' : 'SYSTEM_FAIL') : 'ENGAGED'}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 p-4 border-r-2 border-purple-500 bg-slate-950/60 text-[9px] font-mono text-right uppercase space-y-1 z-20 backdrop-blur-sm">
                <div className="text-purple-400 font-bold tracking-widest">#RAI_SMARTAIBOT</div>
                <div>AZIMUTH: {(180 + (scrollPos * 3.6)).toFixed(1)}°</div>
                <div className={`transition-colors ${lockStatus === BotLockStatus.OVERRIDE ? 'text-red-400' : 'text-slate-400'}`}>
                  ENVIRONMENT_LOCK: {lockStatus === BotLockStatus.OVERRIDE ? 'BREACHED' : 'OPTIMAL'}
                </div>
                <div className="theme-text-primary uppercase tracking-tighter">Lens: {selectedStyle}</div>
              </div>
              
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30"></div>
            </div>
          ) : (
            <div className="text-slate-800 font-orbitron text-2xl tracking-[1em] opacity-20 uppercase">Link_Offline</div>
          )}
        </section>

        <aside className="w-64 border-l border-slate-800 bg-slate-950/60 backdrop-blur-md p-4 z-10 overflow-y-auto">
          <h3 className="text-[10px] font-orbitron text-slate-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1 h-3 bg-cyan-500"></span> Access Logs
          </h3>
          <div className="space-y-4">
            {history.map(entry => (
              <div key={entry.id} className="group cursor-pointer" onClick={() => fetchRaiData(entry.location, entry.style as VisualStyle || 'Cinematic')} onMouseEnter={() => setIsHoverPaused(true)} onMouseLeave={() => setIsHoverPaused(false)} >
                <div className="relative aspect-video rounded overflow-hidden border border-slate-800 group-hover:border-cyan-500/50 transition-all duration-300">
                  <img src={entry.imageUrl} className="w-full h-full object-cover saturate-50 brightness-75 group-hover:saturate-100 group-hover:brightness-100 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white truncate w-[80%] font-orbitron">
                    {entry.location}
                  </div>
                  <div className="absolute top-1 right-2 text-[7px] theme-text-primary font-bold uppercase tracking-tighter">{entry.style}</div>
                </div>
                <div className="flex justify-between mt-1.5 px-1">
                  <span className="text-[8px] text-slate-500 font-mono">{entry.timestamp}</span>
                  <span className="text-[8px] theme-text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Restore</span>
                </div>
              </div>
            ))}
            {history.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-slate-800 text-xs font-orbitron mb-2 uppercase tracking-widest">Protocol Standby</div>
                <div className="text-[9px] text-slate-700 uppercase">Awaiting Handshake...</div>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="h-10 border-t border-slate-800 bg-slate-950 flex items-center px-6 text-[9px] font-mono text-slate-500 gap-8">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${lockStatus === BotLockStatus.OVERRIDE ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-500 shadow-[0_0_8px_#22d3ee]'}`}></span>
          <span className={`font-bold ${lockStatus === BotLockStatus.OVERRIDE ? 'text-red-500' : 'text-cyan-400'}`}>
            RAI_CORE: {quotaExceeded ? 'QUOTA_EXHAUSTED' : lockStatus === BotLockStatus.OVERRIDE ? 'CRITICAL_FAILURE' : 'STABLE'}
          </span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap uppercase tracking-widest opacity-60">
          <span className="inline-block animate-[marquee_25s_linear_infinite] hover:[animation-play-state:paused] cursor-default">
            // [LINK_STABLE] // INITIALIZING #RAI #SMARTAIBOTBODYLOCK #ENVIRONMENT PROTOCOLS // {quotaExceeded ? 'WARNING: RESOURCE QUOTA EXHAUSTED // PLEASE STANDBY FOR THERMAL RESET' : 'UPLINK ACTIVE'} // LATITUDE: {locationInfo?.coordinates.lat.toFixed(2) || '0.00'} // LONGITUDE: {locationInfo?.coordinates.lng.toFixed(2) || '0.00'} //
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 uppercase tracking-tighter">Lat:</span>
            <span className={`font-bold ${lockStatus === BotLockStatus.OVERRIDE ? 'text-red-400' : 'text-cyan-500/80'}`}>
              {lockStatus === BotLockStatus.OVERRIDE ? 'VAR' : '14ms'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 uppercase font-bold tracking-tighter">Sig:</span>
            <span className={`font-bold ${lockStatus === BotLockStatus.OVERRIDE ? 'text-red-600' : 'text-purple-400/80'}`}>
              {lockStatus === BotLockStatus.OVERRIDE ? 'ERR' : '99.8%'}
            </span>
          </div>
        </div>
      </footer>
      
      <style>{`
        :root {
          --theme-primary: #22d3ee;
          --theme-secondary: #a855f7;
          --theme-accent: #ec4899;
          --theme-bg: #000000;
          --theme-accent-glow: rgba(34, 211, 238, 0.4);
        }
        .theme-text-primary { color: var(--theme-primary); }
        .theme-bg-primary { background-color: var(--theme-primary); }
        .theme-border-primary { border-color: var(--theme-primary); }
        
        @keyframes marquee {
          0% { transform: translateX(50%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes holographicRipple {
          0% { width: 0; height: 0; opacity: 1; border-width: 4px; }
          100% { width: 600px; height: 600px; opacity: 0; border-width: 1px; }
        }
        @keyframes holographicRippleSecondary {
          0% { width: 0; height: 0; opacity: 0.8; border-width: 8px; }
          60% { width: 400px; height: 400px; opacity: 0; border-width: 1px; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.8);
          border: 1px solid white;
        }
        input[type=range]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #22d3ee;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(34, 211, 238, 0.8);
          border: 1px solid white;
        }
      `}</style>
    </div>
  );
};

export default App;