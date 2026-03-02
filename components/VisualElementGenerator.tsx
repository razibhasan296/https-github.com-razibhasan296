import React, { useState } from 'react';
import { generateVisualElement } from '../services/geminiService';

interface VisualElementGeneratorProps {
  onDeploy: (imageUrl: string, label: string) => void;
  disabled: boolean;
}

const VisualElementGenerator: React.FC<VisualElementGeneratorProps> = ({ onDeploy, disabled }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const imageUrl = await generateVisualElement(prompt);
      setGeneratedImage(imageUrl);
      setLabel(prompt.split(' ').slice(0, 2).join(' '));
    } catch (error) {
      console.error("Element generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeploy = () => {
    if (generatedImage) {
      onDeploy(generatedImage, label || 'Custom Element');
      setGeneratedImage(null);
      setPrompt('');
      setLabel('');
    }
  };

  return (
    <div className="border border-purple-500/30 bg-purple-950/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-orbitron text-purple-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 animate-pulse rounded-full"></span>
          Visual Element Lab
        </h4>
        <span className="text-[7px] font-mono text-purple-500/60">#RAI_SYNTHESIS</span>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled || generating}
          placeholder="Describe a scifi object (e.g. 'hover drone')..."
          className="w-full bg-black/40 border border-purple-900/50 rounded px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-purple-400 text-purple-100 placeholder:text-purple-900 transition-all"
        />
        
        <button
          onClick={handleGenerate}
          disabled={disabled || generating || !prompt.trim()}
          className={`w-full py-2 rounded font-orbitron font-bold text-[9px] tracking-widest transition-all border ${
            disabled || generating || !prompt.trim()
              ? 'bg-slate-800/50 text-slate-600 border-slate-700'
              : 'bg-purple-500/10 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
          }`}
        >
          {generating ? 'SYNTHESIZING...' : 'GENERATE_ELEMENT'}
        </button>
      </div>

      {generatedImage && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="relative aspect-square rounded border border-purple-500/50 overflow-hidden bg-black">
            <img src={generatedImage} alt="Generated Element" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Element Label..."
              className="w-full bg-black/40 border border-purple-900/50 rounded px-2 py-1 text-[9px] font-mono focus:outline-none focus:border-purple-400 text-purple-200"
            />
            <button
              onClick={handleDeploy}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-[9px] rounded shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all uppercase tracking-widest"
            >
              Deploy to Visor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualElementGenerator;
