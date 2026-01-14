// ============================================
// VoxelHand AR - Type Definitions
// ============================================

// Hand Landmark Types (MediaPipe)
export interface Landmark {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  z: number; // depth (relative)
}

export interface HandLandmarks {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
}

// Voxel Block Types
export interface Block {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  color: string;
}

// Store Types
export type InteractionMode = 'BUILD' | 'NAVIGATE' | 'ERASE';

export interface VoxelState {
  blocks: Block[];
  mode: InteractionMode;
  cursorPosition: { x: number; y: number; z: number };

  // Actions
  addBlock: (x: number, y: number, z: number, color?: string) => void;
  removeBlock: (id: string) => void;
  setMode: (mode: InteractionMode) => void;
  setCursorPosition: (x: number, y: number, z: number) => void;
}

// MediaPipe Finger Indices
export enum FingerTip {
  THUMB = 4,
  INDEX = 8,
  MIDDLE = 12,
  RING = 16,
  PINKY = 20,
}

// Grid Configuration
export interface GridConfig {
  size: number;      // Grid unit size
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
