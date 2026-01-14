// ============================================
// Voxel Store - Zustand State Management
// ============================================

import { create } from 'zustand';
import { Block, InteractionMode, VoxelState } from '../types';
import { generateBlockId, positionKey } from '../logic/gridMath';
import { playBlockPlaceSound, playBlockBreakSound } from '../logic/soundManager';

// Default color palette - Blue/Teal shades like reference image
// Minecraft-inspired color palette
const COLORS = [
    '#5D9E3E', // Grass Green
    '#74A95B', // Lighter Grass
    '#4E8B32', // Darker Grass
    '#8B5A2B', // Dirt Brown
    '#5D4037', // Dark Brown
    '#795548', // Wood Brown
];

// Extended state interface with navigation
interface ExtendedVoxelState extends VoxelState {
    // Raw cursor position (follows finger exactly)
    rawCursorPosition: { x: number; y: number; z: number };

    // Navigation state
    sceneRotation: { x: number; y: number };
    cameraZoom: number;

    // Actions
    setRawCursorPosition: (x: number, y: number, z: number) => void;
    setSceneRotation: (x: number, y: number) => void;
    setCameraZoom: (zoom: number) => void;
    removeBlockAt: (x: number, y: number, z: number) => void;
    resetBlocks: () => void;
    saveToLocalStorage: () => void;
    loadFromLocalStorage: () => void;
}

export const useVoxelStore = create<ExtendedVoxelState>((set, get) => ({
    // State
    blocks: [],
    mode: 'BUILD',
    cursorPosition: { x: 0, y: 0, z: 0 },
    rawCursorPosition: { x: 0, y: 0, z: 0 },
    sceneRotation: { x: 0, y: 0 },
    cameraZoom: 15,

    // Actions
    addBlock: (x: number, y: number, z: number, color?: string) => {
        const state = get();
        const key = positionKey(x, y, z);

        // Check if block already exists at this position
        const exists = state.blocks.some(
            (b) => positionKey(b.position.x, b.position.y, b.position.z) === key
        );

        if (exists) return; // Don't add duplicate blocks

        const newBlock: Block = {
            id: generateBlockId(),
            position: { x, y, z },
            color: color || COLORS[state.blocks.length % COLORS.length],
        };

        set({ blocks: [...state.blocks, newBlock] });

        // Play Minecraft block place sound
        playBlockPlaceSound();
    },

    removeBlock: (id: string) => {
        set((state) => ({
            blocks: state.blocks.filter((b) => b.id !== id),
        }));
    },

    removeBlockAt: (x: number, y: number, z: number) => {
        const key = positionKey(x, y, z);
        const state = get();
        const blockExists = state.blocks.some(
            (b) => positionKey(b.position.x, b.position.y, b.position.z) === key
        );

        if (blockExists) {
            set((state) => ({
                blocks: state.blocks.filter(
                    (b) => positionKey(b.position.x, b.position.y, b.position.z) !== key
                ),
            }));
            playBlockBreakSound();
        }
    },

    setMode: (mode: InteractionMode) => {
        set({ mode });
    },

    setCursorPosition: (x: number, y: number, z: number) => {
        set({ cursorPosition: { x, y, z } });
    },

    setRawCursorPosition: (x: number, y: number, z: number) => {
        set({ rawCursorPosition: { x, y, z } });
    },

    setSceneRotation: (x: number, y: number) => {
        set({ sceneRotation: { x, y } });
    },

    setCameraZoom: (zoom: number) => {
        set({ cameraZoom: Math.max(5, Math.min(30, zoom)) });
    },

    resetBlocks: () => {
        set({ blocks: [] });
    },

    saveToLocalStorage: () => {
        const { blocks } = get();
        try {
            localStorage.setItem('starktouch_saves', JSON.stringify(blocks));
            console.log('✅ Game Saved:', blocks.length, 'blocks');
        } catch (e) {
            console.error('❌ Save failed', e);
        }
    },

    loadFromLocalStorage: () => {
        try {
            const data = localStorage.getItem('starktouch_saves');
            if (data) {
                const loadedBlocks = JSON.parse(data);
                set({ blocks: loadedBlocks });
                console.log('✅ Game Loaded:', loadedBlocks.length, 'blocks');
            } else {
                console.log('⚠️ No save file found');
            }
        } catch (e) {
            console.error('❌ Load failed', e);
        }
    },
}));

// Selector hooks for optimized re-renders
export const useBlocks = () => useVoxelStore((state) => state.blocks);
export const useMode = () => useVoxelStore((state) => state.mode);
export const useCursorPosition = () => useVoxelStore((state) => state.cursorPosition);
export const useRawCursorPosition = () => useVoxelStore((state) => state.rawCursorPosition);
export const useBlockCount = () => useVoxelStore((state) => state.blocks.length);
export const useSceneRotation = () => useVoxelStore((state) => state.sceneRotation);
export const useCameraZoom = () => useVoxelStore((state) => state.cameraZoom);
