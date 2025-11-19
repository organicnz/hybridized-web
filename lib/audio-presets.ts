export interface EQPreset {
  name: string;
  description: string;
  bands: number[]; // 10 bands: 32, 64, 125, 250, 500, 1K, 2K, 4K, 8K, 16K Hz
}

export const EQ_PRESETS: EQPreset[] = [
  {
    name: "Flat",
    description: "No adjustments",
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: "Bass Boost",
    description: "Enhanced low frequencies",
    bands: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  },
  {
    name: "Treble Boost",
    description: "Enhanced high frequencies",
    bands: [0, 0, 0, 0, 0, 0, 2, 4, 6, 8],
  },
  {
    name: "Vocal Boost",
    description: "Enhanced mid-range for vocals",
    bands: [0, 0, 0, 3, 5, 5, 3, 0, 0, 0],
  },
  {
    name: "V-Shape",
    description: "Bass and treble boost",
    bands: [6, 4, 2, 0, -2, -2, 0, 2, 4, 6],
  },
  {
    name: "Classical",
    description: "Optimized for orchestral music",
    bands: [0, 0, 0, 0, 0, 0, -2, -2, -2, -4],
  },
  {
    name: "Rock",
    description: "Punchy mids and highs",
    bands: [4, 3, 2, 1, -1, -1, 1, 3, 4, 4],
  },
  {
    name: "Electronic",
    description: "Deep bass and crisp highs",
    bands: [8, 6, 4, 0, -2, -2, 0, 2, 4, 6],
  },
  {
    name: "Jazz",
    description: "Warm and balanced",
    bands: [2, 2, 1, 1, 0, 0, 1, 2, 2, 2],
  },
  {
    name: "Podcast",
    description: "Clear speech",
    bands: [-2, -1, 0, 3, 5, 5, 3, 0, -1, -2],
  },
];

export interface SpatialPreset {
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
}

export const SPATIAL_PRESETS: SpatialPreset[] = [
  {
    name: "Center",
    description: "Standard stereo",
    position: { x: 0, y: 0, z: -1 },
  },
  {
    name: "Wide",
    description: "Expanded soundstage",
    position: { x: 0, y: 0, z: -3 },
  },
  {
    name: "Concert Hall",
    description: "Distant and spacious",
    position: { x: 0, y: 2, z: -5 },
  },
  {
    name: "Intimate",
    description: "Close and personal",
    position: { x: 0, y: 0, z: 0.5 },
  },
  {
    name: "Left Stage",
    description: "Sound from left",
    position: { x: -3, y: 0, z: -2 },
  },
  {
    name: "Right Stage",
    description: "Sound from right",
    position: { x: 3, y: 0, z: -2 },
  },
];
