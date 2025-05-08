"use client";

import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import Pane from "./Pane";

const NUM_LAYERS = 39;
const PLACEHOLDER_WORDCLOUD = "[Word Cloud Placeholder]";

const evictedContextData = [
  Array(3).fill(null),
  Array(2).fill(null),
  Array(5).fill(null),
  Array(18).fill(null)
];

const blockColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-lime-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-amber-500"
];

export default function ContextManagerPanel() {
  // Only one block can be selected across all layers
  const [selected, setSelected] = useState<{ layer: number | null; block: number | null }>({ layer: null, block: null });
  const [layer, setLayer] = useState(0);

  const evictedBlocks = evictedContextData.length > layer ? evictedContextData[layer] : [];

  // Info for display (displayed layer/block)
  const displayed = selected;

  // Helper to update selected block globally
  const handleBlockSelect = (idx: number) => {
    setSelected({ layer, block: idx });
  };

  // Helper to change layer
  const handleLayerChange = (newLayer: number) => {
    setLayer(newLayer);
  };

  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Top: Word cloud in a Pane */}
      <Pane className="h-1/2">
        <div className="flex flex-col h-full w-full p-4">
          <div className="mb-4 flex flex-row items-center gap-2 justify-center">
            <span className="text-lg font-mono text-gray-400">Currently Displayed:</span>
            <span className="text-base font-mono font-bold px-3 py-1 rounded border border-blue-500 bg-blue-900 text-blue-300 flex items-center h-8 min-w-[110px] justify-center">
              {displayed.layer !== null ? `Layer ${displayed.layer + 1}` : "Layer: --"}
            </span>
            {displayed.block !== null ? (
              <span className={`text-base font-mono font-bold px-3 py-1 rounded border ${blockColors[displayed.block % blockColors.length]} text-white flex items-center h-8 min-w-[110px] justify-center`}>Block {displayed.block + 1}</span>
            ) : (
              <span className="text-base font-mono text-gray-400 flex items-center h-8 min-w-[110px] justify-center border border-gray-500 rounded px-3 py-1">Block: --</span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center flex-1 border border-dashed border-gray-600 rounded-lg bg-gray-800">
            <span className="text-gray-400 font-mono text-lg">{PLACEHOLDER_WORDCLOUD}</span>
          </div>
        </div>
      </Pane>
      {/* Bottom: Layer slider and evicted context blocks in a Pane */}
      <Pane className="h-1/2">
        <div className="flex flex-col h-full w-full p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-gray-300">Evicted Context</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-2 items-start content-start mb-4">
            {evictedBlocks.map((_, idx) => (
              <button
                key={idx}
                className={`flex items-center justify-center gap-2 w-28 h-10 rounded-lg text-white font-mono text-sm shadow transition-all border-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${blockColors[idx % blockColors.length]} ${(selected.layer === layer && selected.block === idx) ? 'border-white' : 'border-transparent'}`}
                onClick={() => handleBlockSelect(idx)}
              >
                Block {idx + 1}
                <FaTimes className="ml-1 text-white/70 text-xs" />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between flex-shrink-0 mt-auto">
            <span className="text-xs font-mono text-gray-400 mr-2">Layer</span>
            <input
              type="range"
              min={0}
              max={NUM_LAYERS - 1}
              value={layer}
              onChange={e => handleLayerChange(Number(e.target.value))}
              className="w-5/6 accent-blue-500 mx-4"
            />
            <span className="text-xs font-mono text-gray-400 ml-2 w-6 text-center">{layer + 1}</span>
          </div>
        </div>
      </Pane>
    </div>
  );
}