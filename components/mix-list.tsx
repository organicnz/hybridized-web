"use client";

import { Calendar, Clock, MoreVertical, Play } from "lucide-react";

interface Mix {
  id: number;
  name: string | null;
  description: string | null;
  created_at: string;
  formula: string | null;
}

interface MixListProps {
  items: Mix[];
}

export function MixList({ items }: MixListProps) {
  // Mock duration for display
  const getDuration = () => {
    const hours = Math.floor(Math.random() * 2);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-bold text-gray-900 truncate mb-2">
                {item.name || "Untitled Mix"}
              </h3>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(item.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{getDuration()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-md">
                <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">No mixes available</p>
        </div>
      )}
    </div>
  );
}
