'use client';
// ============================================
// Minecraft Grass Block Texture Generator
// Creates procedural textures like Minecraft
// ============================================

import { useMemo } from 'react';
import { CanvasTexture, NearestFilter, RepeatWrapping } from 'three';

// Minecraft color palette
const GRASS_COLORS = ['#5D9E3E', '#4E8B32', '#6AAE4A', '#3D7A28'];
const DIRT_COLORS = ['#8B5A2B', '#6B4423', '#5D4037', '#7A5030'];

/**
 * Creates a pixelated texture like Minecraft
 * @param size - Texture size (16 for classic Minecraft look)
 * @param colors - Array of colors to randomly pick from
 * @param noiseLevel - How much color variation (0-1)
 */
function createPixelTexture(
    size: number = 16,
    colors: string[],
    noiseLevel: number = 0.3
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Fill with random pixels from color palette
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Pick a random color from palette
            const baseColor = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    return canvas;
}

/**
 * Creates grass side texture (dirt with grass on top)
 */
function createGrassSideTexture(size: number = 16): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Bottom 3/4 is dirt
    for (let y = Math.floor(size * 0.25); y < size; y++) {
        for (let x = 0; x < size; x++) {
            const color = DIRT_COLORS[Math.floor(Math.random() * DIRT_COLORS.length)];
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    // Top 1/4 is grass with jagged edge
    for (let y = 0; y < Math.floor(size * 0.35); y++) {
        for (let x = 0; x < size; x++) {
            // Create jagged grass edge
            const grassHeight = Math.floor(size * 0.25) + Math.floor(Math.random() * 3);
            if (y < grassHeight) {
                const color = GRASS_COLORS[Math.floor(Math.random() * GRASS_COLORS.length)];
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    return canvas;
}

/**
 * Hook to create Minecraft-style textures
 */
export function useMinecraftTextures() {
    const textures = useMemo(() => {
        // Only run on client
        if (typeof window === 'undefined') return null;

        // Grass top texture
        const grassTopCanvas = createPixelTexture(16, GRASS_COLORS);
        const grassTopTexture = new CanvasTexture(grassTopCanvas);
        grassTopTexture.magFilter = NearestFilter; // Pixelated look
        grassTopTexture.minFilter = NearestFilter;
        grassTopTexture.wrapS = RepeatWrapping;
        grassTopTexture.wrapT = RepeatWrapping;

        // Dirt texture
        const dirtCanvas = createPixelTexture(16, DIRT_COLORS);
        const dirtTexture = new CanvasTexture(dirtCanvas);
        dirtTexture.magFilter = NearestFilter;
        dirtTexture.minFilter = NearestFilter;

        // Grass side texture (dirt + grass stripe)
        const grassSideCanvas = createGrassSideTexture(16);
        const grassSideTexture = new CanvasTexture(grassSideCanvas);
        grassSideTexture.magFilter = NearestFilter;
        grassSideTexture.minFilter = NearestFilter;

        return {
            grassTop: grassTopTexture,
            dirt: dirtTexture,
            grassSide: grassSideTexture,
        };
    }, []);

    return textures;
}

export { createPixelTexture, createGrassSideTexture, GRASS_COLORS, DIRT_COLORS };
