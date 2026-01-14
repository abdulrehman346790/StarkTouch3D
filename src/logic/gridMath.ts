// ============================================
// Grid Math Engine - Pure functions for snapping
// ============================================

/**
 * Snaps a value to the nearest grid unit
 * @param value - The input value to snap
 * @param gridSize - Size of each grid unit (default: 1)
 * @returns The snapped value
 */
export function snapToGrid(value: number, gridSize: number = 1): number {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps a 3D position to the grid
 * @param x - X coordinate
 * @param y - Y coordinate  
 * @param z - Z coordinate
 * @param gridSize - Size of each grid unit
 * @returns Snapped position object
 */
export function snapPositionToGrid(
    x: number,
    y: number,
    z: number,
    gridSize: number = 1
): { x: number; y: number; z: number } {
    return {
        x: snapToGrid(x, gridSize),
        y: snapToGrid(y, gridSize),
        z: snapToGrid(z, gridSize),
    };
}

/**
 * Clamps a value within min/max bounds
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Creates a unique position key for block lookup
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param z - Z coordinate
 */
export function positionKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
}

/**
 * Generates a unique block ID
 */
export function generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
