"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Zap, ZapOff, Bug, BugOff } from "lucide-react";
import Pane from "./Pane";
import { getLayerContext, getBlockContext } from "@/api/context";
import WordCloud from "./WordCloud";
import WordScores from "./WordScores";
import { preprocess } from "@/api/preprocess";
import { WordScore } from "@/types";

const NUM_LAYERS = 39;
const PLACEHOLDER_WORDCLOUD = "Select a block to view word analysis";

const blockColors = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-violet-500 to-violet-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-lime-500 to-lime-600",
  "from-cyan-500 to-cyan-600",
  "from-fuchsia-500 to-fuchsia-600",
  "from-yellow-500 to-yellow-600"
];

const borderColors = [
  "border-blue-400",
  "border-emerald-400",
  "border-amber-400",
  "border-rose-400",
  "border-violet-400",
  "border-orange-400",
  "border-pink-400",
  "border-teal-400",
  "border-lime-400",
  "border-cyan-400",
  "border-fuchsia-400",
  "border-yellow-400"
];

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  activeText: string;
  inactiveText: string;
  icon?: React.ReactNode;
  className?: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  active,
  onClick,
  activeText,
  inactiveText,
  icon,
  className = ""
}) => (
  <button
    onClick={onClick}
    className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
      transition-all duration-200 border backdrop-blur-sm
      ${active
        ? 'bg-white/10 border-white/20 text-white shadow-sm'
        : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-300 hover:bg-white/8'
      }
      ${className}
    `}
  >
    {icon}
    <span className="hidden sm:inline">{active ? activeText : inactiveText}</span>
    <span className="sm:hidden">{active ? '●' : '○'}</span>
  </button>
);

export default function ContextManagerPanel({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const [selected, setSelected] = useState<{ layer: number | null; block: number | null }>({
    layer: null,
    block: null
  });
  const [layer, setLayer] = useState(0);
  const [blockIndices, setBlockIndices] = useState<number[]>([]);
  const [blockDetails, setBlockDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(true);
  const [shouldPreprocess, setShouldPreprocess] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    setSelected({ layer: null, block: null });
  }, []);

  useEffect(() => {
    setLoading(true);
    getLayerContext(layer)
      .then(data => {
        setBlockIndices(data.block_indices || []);
        setSelected(sel => {
          if (sel.block !== null && (data.block_indices || []).includes(sel.block)) {
            return sel;
          } else {
            setBlockDetails(null);
            return { layer: null, block: null };
          }
        });
      })
      .catch(() => {
        setBlockIndices([]);
      })
      .finally(() => setLoading(false));
  }, [layer, refreshSignal]);

  useEffect(() => {
    if (selected.layer !== null && selected.block !== null) {
      getBlockContext(selected.layer, selected.block)
        .then(data => {
          setBlockDetails(data);
        })
        .catch(() => setBlockDetails(null));
    }
  }, [selected.layer, selected.block]);

  const handleBlockSelect = (idx: number) => {
    setSelected({ layer, block: idx });
  };

  const handleLayerChange = (newLayer: number) => {
    setLayer(newLayer);
  };

  let words: WordScore[] = blockDetails?.tokens.map((text: string, i: number) => ({
    text,
    value: blockDetails?.representation_score[i] || 1
  }));

  if (shouldPreprocess && words) {
    words = preprocess(words);
  }

  const hasValidData = blockDetails &&
    selected.layer !== null &&
    selected.block !== null &&
    blockDetails.tokens &&
    blockDetails.representation_score &&
    blockDetails.tokens.length > 0 &&
    blockDetails.representation_score.length > 0;

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Word Analysis Panel */}
      <Pane className="h-1/2 min-h-0">
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Token Explorer</h2>
              <div className="flex items-center space-x-2">
                <ToggleButton
                  active={showWordCloud}
                  onClick={() => setShowWordCloud(!showWordCloud)}
                  activeText="Cloud View"
                  inactiveText="Score View"
                  icon={showWordCloud ? <Eye size={14} /> : <EyeOff size={14} />}
                />
                <ToggleButton
                  active={shouldPreprocess}
                  onClick={() => setShouldPreprocess(!shouldPreprocess)}
                  activeText="Clean On"
                  inactiveText="Clean Off"
                  icon={shouldPreprocess ? <Zap size={14} /> : <ZapOff size={14} />}
                />
                <ToggleButton
                  active={debugMode}
                  onClick={() => setDebugMode(!debugMode)}
                  activeText="Debug On"
                  inactiveText="Debug Off"
                  icon={debugMode ? <Bug size={14} /> : <BugOff size={14} />}
                />
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-3">
                <div className={`
                    px-4 py-2 rounded-lg font-mono text-sm font-medium border backdrop-blur-sm
                    ${selected.layer !== null
                    ? 'bg-blue-500/20 border-blue-400/40 text-blue-200'
                    : 'bg-gray-500/20 border-gray-400/40 text-gray-400'
                  }
                  `}>
                  {selected.layer !== null ? `Layer ${selected.layer + 1}` : "No Layer"}
                </div>

                {selected.block !== null ? (
                  <div className={`
                      px-4 py-2 rounded-lg font-mono text-sm font-medium border backdrop-blur-sm
                      bg-gradient-to-r text-white shadow-sm
                      ${blockColors[selected.block % blockColors.length]}
                      ${borderColors[selected.block % borderColors.length]}/40 border
                    `}>
                    Block {selected.block + 1}
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-lg font-mono text-sm font-medium border backdrop-blur-sm bg-gray-500/20 border-gray-400/40 text-gray-400">
                    No Block
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="h-full flex items-center justify-center p-6">
              {debugMode || hasValidData ? (
                <div className="w-full h-full flex items-center justify-center">
                  {showWordCloud ? (
                    <WordCloud
                      words={debugMode ? [{ text: "Hello", value: 1 }] : words}
                      width={Math.min(500, window.innerWidth - 100)}
                      height={Math.min(300, window.innerHeight - 400)}
                    />
                  ) : (
                    <div className="w-full max-h-full overflow-auto">
                      <WordScores
                        words={debugMode ? [{ text: "Hello", value: 1 }] : words}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <Eye size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">{PLACEHOLDER_WORDCLOUD}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Pane>

      {/* Context Blocks Panel */}
      <Pane className="h-1/2 min-h-0">
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Evicted Context</h2>
            <div className="flex items-center space-x-3 text-sm text-gray-400">
              <span>{blockIndices.length} blocks</span>
              {loading && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          {/* Blocks Grid */}
          <div className="flex-1 min-h-0 mb-6">
            <div className="h-full overflow-auto">
              {blockIndices.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                  {blockIndices.map((idx) => (
                    <button
                      key={idx}
                      className={`
                          group relative overflow-hidden rounded-xl p-4 text-white font-mono text-sm 
                          transition-all duration-200 border-2 backdrop-blur-sm shadow-lg
                          bg-gradient-to-br hover:scale-105 active:scale-95
                          ${blockColors[idx % blockColors.length]}
                          ${(selected.layer === layer && selected.block === idx)
                          ? `${borderColors[idx % borderColors.length]} shadow-lg`
                          : 'border-transparent hover:border-white/20'
                        }
                        `}
                      onClick={() => handleBlockSelect(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Block {idx + 1}</span>
                        <X size={14} className="opacity-60 group-hover:opacity-80 transition-opacity" />
                      </div>

                      {/* Selection indicator */}
                      {(selected.layer === layer && selected.block === idx) && (
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-gray-400 border-dashed rounded"></div>
                    </div>
                    <p className="text-gray-400 font-medium">No evicted blocks</p>
                    <p className="text-gray-500 text-sm mt-1">Blocks will appear here when context is evicted</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Layer Slider */}
          <div className="bg-black/20 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-300 min-w-0">
                Layer
              </label>
              <div className="flex-1 px-2">
                <input
                  type="range"
                  min={0}
                  max={NUM_LAYERS - 1}
                  value={layer}
                  onChange={e => handleLayerChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(layer / (NUM_LAYERS - 1)) * 100}%, #374151 ${(layer / (NUM_LAYERS - 1)) * 100}%, #374151 100%)`
                  }}
                />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-mono font-semibold text-white bg-blue-500/20 border border-blue-400/40 px-2 py-1 rounded">
                  {layer + 1}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
              <span>1</span>
              <span>{NUM_LAYERS}</span>
            </div>
          </div>
        </div>
      </Pane>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1e40af;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1e40af;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}