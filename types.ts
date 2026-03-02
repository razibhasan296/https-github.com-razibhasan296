export interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  radiation: number;
  aiSync: number;
  raiStability: number;
}

export interface MarkerData {
  id: string;
  label: string;
  description: string;
  detailedInfo?: string;
  groundingSources?: { title: string; uri: string }[];
  type: 'History' | 'Anomaly' | 'Sensor' | 'POI' | 'Custom';
  x: number; // 0-100 percentage across the panoramic width
  y: number; // 0-100 percentage height
  thumbnailUrl?: string;
}

export interface LocationInfo {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  strategicContext?: string;
  groundingSources?: { title: string; uri: string }[];
  threatLevel: 'Low' | 'Moderate' | 'Critical' | 'Unknown';
  sensorSummary: SensorData;
  soundProfile: 'Industrial' | 'Natural' | 'Void' | 'Electronic' | 'Hostile';
  markers: MarkerData[];
}

export enum BotLockStatus {
  UNLOCKED = 'UNLOCKED',
  SCANNING = 'SCANNING',
  LOCKED = 'LOCKED',
  OVERRIDE = 'OVERRIDE'
}

export interface HistoryEntry {
  id: string;
  location: string;
  timestamp: string;
  imageUrl?: string;
  style?: string;
}

export type VisualStyle = 'Cinematic' | 'Thermal' | 'Night Vision' | 'Cyberpunk' | 'Deep Space' | 'Post-Apocalyptic' | 'Solar-Punk' | 'Diplomatic';

export type ExplorationMode = 'Street View' | 'Satellite View' | '3D City Model' | 'Strategic Hub';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
