import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface Satellite {
  id: number;
  orbit: number;
  speed: number;
  initialAngle: number;
  size: number;
}

const OrbitalNetwork: React.FC = () => {
  const satellites = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      orbit: 80 + (i % 3) * 30, // Different orbital shells
      speed: 10 + Math.random() * 20,
      initialAngle: Math.random() * 360,
      size: 2 + Math.random() * 2,
    }));
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950/20 blueprint-subgrid overflow-hidden">
      {/* Central Globe Representation */}
      <div className="relative w-48 h-48 rounded-full border border-cyan-500/30 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-cyan-500/5 animate-pulse"></div>
        <div className="absolute inset-4 rounded-full border border-cyan-500/20 blueprint-grid opacity-20"></div>
        
        {/* Globe Labels */}
        <div className="absolute -top-6 text-[8px] font-mono text-cyan-500/50 uppercase tracking-widest">Orbital_Shell_01</div>
        <div className="absolute -bottom-6 text-[8px] font-mono text-cyan-500/50 uppercase tracking-widest">RAI_Core_Sync</div>
        
        {/* Crosshair */}
        <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
        <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>
      </div>

      {/* Orbital Shells */}
      {[80, 110, 140].map((radius, idx) => (
        <div 
          key={idx}
          className="absolute rounded-full border border-cyan-500/10"
          style={{ width: radius * 2, height: radius * 2 }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[6px] font-mono text-cyan-500/30">
            {radius * 10}km
          </div>
        </div>
      ))}

      {/* Satellites */}
      {satellites.map((sat) => (
        <motion.div
          key={sat.id}
          className="absolute"
          initial={{ rotate: sat.initialAngle }}
          animate={{ rotate: sat.initialAngle + 360 }}
          transition={{
            duration: sat.speed,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ width: sat.orbit * 2, height: sat.orbit * 2 }}
        >
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ transform: 'translateY(-50%)' }}
          >
            <div 
              className="rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
              style={{ width: sat.size, height: sat.size }}
            />
            {sat.id % 4 === 0 && (
              <div className="mt-1 text-[5px] font-mono text-cyan-500/50 whitespace-nowrap">
                SAT_{sat.id.toString().padStart(3, '0')}
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Blueprint Labels */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="text-[10px] font-orbitron text-cyan-400 font-bold uppercase tracking-widest">Starlink_Mesh_Uplink</div>
        <div className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter">Active_Nodes: 4,281</div>
        <div className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter">Latency: 18ms</div>
      </div>

      <div className="absolute bottom-4 right-4 text-[7px] font-mono text-slate-500 uppercase text-right">
        Project_Valt // Orbital_Security_Protocol_v4.2
      </div>
    </div>
  );
};

export default OrbitalNetwork;
