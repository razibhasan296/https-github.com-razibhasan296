import React from 'react';
import { BotLockStatus } from '../types';

interface BotAvatarProps {
  status: BotLockStatus;
}

const BotAvatar: React.FC<BotAvatarProps> = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case BotLockStatus.LOCKED:
        return { primary: '#22d3ee', secondary: '#0891b2', glow: 'rgba(34, 211, 238, 0.5)' };
      case BotLockStatus.SCANNING:
        return { primary: '#fbbf24', secondary: '#d97706', glow: 'rgba(251, 191, 36, 0.5)' };
      case BotLockStatus.OVERRIDE:
        return { primary: '#ef4444', secondary: '#b91c1c', glow: 'rgba(239, 68, 68, 0.5)' };
      case BotLockStatus.UNLOCKED:
        return { primary: '#10b981', secondary: '#059669', glow: 'rgba(16, 185, 129, 0.5)' };
      default:
        return { primary: '#94a3b8', secondary: '#475569', glow: 'transparent' };
    }
  };

  const colors = getColors();

  return (
    <div className="relative w-16 h-16 flex items-center justify-center group">
      {/* Outer Ring */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.primary}
          strokeWidth="1"
          strokeDasharray="10 5"
          className={`opacity-30 ${status === BotLockStatus.SCANNING ? 'animate-[spin_4s_linear_infinite]' : ''}`}
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={colors.primary}
          strokeWidth="2"
          strokeDasharray="80 200"
          className={`opacity-50 ${status === BotLockStatus.SCANNING ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_8s_linear_infinite]'}`}
        />
      </svg>

      {/* Bot Head / Eye Container */}
      <div 
        className={`relative w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-500 overflow-hidden bg-slate-900/80 backdrop-blur-sm shadow-lg
          ${status === BotLockStatus.LOCKED ? 'animate-[glow_4s_ease-in-out_infinite]' : ''}
          ${status === BotLockStatus.OVERRIDE ? 'animate-[flicker_0.15s_infinite]' : ''}
        `}
        style={{ 
          borderColor: colors.primary,
          boxShadow: `0 0 15px ${colors.glow}`
        }}
      >
        {/* Glitch Effect for Override */}
        {status === BotLockStatus.OVERRIDE && (
          <div className="absolute inset-0 bg-red-500/20 animate-[glitch_0.2s_infinite] z-0"></div>
        )}

        {/* Eye / Core */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div 
            className={`w-4 h-1 rounded-full transition-all duration-300 
              ${status === BotLockStatus.SCANNING ? 'animate-bounce' : ''}
              ${status === BotLockStatus.OVERRIDE ? 'animate-pulse' : ''}
            `}
            style={{ backgroundColor: colors.primary }}
          ></div>
          <div className="flex gap-1">
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 
                ${status === BotLockStatus.OVERRIDE ? 'animate-[flicker_0.1s_infinite]' : ''}
                ${status === BotLockStatus.LOCKED ? 'animate-pulse' : ''}
              `}
              style={{ backgroundColor: colors.primary }}
            ></div>
            <div 
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 
                ${status === BotLockStatus.OVERRIDE ? 'animate-[flicker_0.1s_infinite]' : ''}
                ${status === BotLockStatus.LOCKED ? 'animate-pulse' : ''}
              `}
              style={{ backgroundColor: colors.primary, animationDelay: '0.2s' }}
            ></div>
          </div>
        </div>

        {/* Scanning Line */}
        {status === BotLockStatus.SCANNING && (
          <div className="absolute inset-x-0 h-[2px] bg-yellow-400 shadow-[0_0_10px_#fbbf24] animate-[scan_2s_linear_infinite] z-20"></div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="absolute -bottom-1 -right-1 flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${status === BotLockStatus.LOCKED ? 'opacity-100 scale-110' : 'opacity-30 scale-100'}`}
            style={{ 
              backgroundColor: colors.primary,
              animation: status === BotLockStatus.SCANNING ? `pulse 1s infinite ${i * 0.2}s` : 'none'
            }}
          ></div>
        ))}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: -10%; opacity: 0; transform: scaleX(0.5); }
          20% { opacity: 1; transform: scaleX(1); }
          80% { opacity: 1; transform: scaleX(1); }
          100% { top: 110%; opacity: 0; transform: scaleX(0.5); }
        }
        @keyframes flicker {
          0% { opacity: 1; filter: brightness(1); }
          25% { opacity: 0.8; filter: brightness(1.5); }
          50% { opacity: 0.9; filter: brightness(0.8); }
          75% { opacity: 0.7; filter: brightness(2); }
          100% { opacity: 1; filter: brightness(1); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 15px rgba(34, 211, 238, 0.4); border-color: rgba(34, 211, 238, 0.6); }
          50% { box-shadow: 0 0 25px rgba(34, 211, 238, 0.8); border-color: rgba(34, 211, 238, 1); }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
};

export default BotAvatar;
