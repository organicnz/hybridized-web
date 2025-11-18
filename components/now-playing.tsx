"use client";

import { X, Play } from "lucide-react";
import { useState } from "react";

export function NowPlaying() {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start gap-4 mb-4">
        {/* Artist Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-xl">H</span>
        </div>

        {/* Artist Info */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Hybrid</h3>
          <p className="text-sm text-gray-500">Hybridized</p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsExpanded(false)}
          className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full mb-2">
            <div className="h-2 bg-blue-500 rounded-full w-0" />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>00:00:00</span>
            <span>00:00:00</span>
          </div>
        </div>

        {/* Play Button */}
        <button className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg">
          <Play className="w-6 h-6 text-white ml-1" fill="white" />
        </button>
      </div>
    </div>
  );
}
