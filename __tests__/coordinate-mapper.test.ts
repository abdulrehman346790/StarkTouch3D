// ============================================
// Coordinate Mapper Tests (TDD)
// ============================================

import {
    normalizedToWorld,
    mapToWorld2D,
    estimateDepth,
    mapToWorld3D,
    lerp,
    lerp3D,
} from '../src/logic/coordMapper';
import { Landmark } from '../src/types';

// Helper to create a landmark
const createLandmark = (x: number, y: number, z: number = 0): Landmark => ({
    x,
    y,
    z,
});

describe('Coordinate Mapper', () => {
    describe('normalizedToWorld', () => {
        it('should map 0 to -10', () => {
            expect(normalizedToWorld(0)).toBe(-10);
        });

        it('should map 1 to 10', () => {
            expect(normalizedToWorld(1)).toBe(10);
        });

        it('should map 0.5 to 0', () => {
            expect(normalizedToWorld(0.5)).toBe(0);
        });

        it('should map 0.25 to -5', () => {
            expect(normalizedToWorld(0.25)).toBe(-5);
        });

        it('should map 0.75 to 5', () => {
            expect(normalizedToWorld(0.75)).toBe(5);
        });
    });

    describe('mapToWorld2D', () => {
        it('should mirror X by default (webcam mode)', () => {
            // When MediaPipe X = 0 (right side), world X should be +10
            const { x } = mapToWorld2D(0, 0.5, true);
            expect(x).toBe(10);
        });

        it('should not mirror X when disabled', () => {
            const { x } = mapToWorld2D(0, 0.5, false);
            expect(x).toBe(-10);
        });

        it('should invert Y (screen to world)', () => {
            // When MediaPipe Y = 0 (top), world Y should be +10 (up)
            const { y } = mapToWorld2D(0.5, 0, true);
            expect(y).toBe(10);

            // When MediaPipe Y = 1 (bottom), world Y should be -10 (down)
            const { y: y2 } = mapToWorld2D(0.5, 1, true);
            expect(y2).toBe(-10);
        });

        it('should map center to origin', () => {
            const { x, y } = mapToWorld2D(0.5, 0.5, true);
            expect(x).toBe(0);
            expect(y).toBe(0);
        });
    });

    describe('estimateDepth', () => {
        it('should return larger Z for smaller hand (far away)', () => {
            // Small hand bounding box (far)
            const smallHand: Landmark[] = [];
            for (let i = 0; i < 21; i++) {
                smallHand.push({
                    x: 0.5 + (Math.random() - 0.5) * 0.1, // Small spread
                    y: 0.5 + (Math.random() - 0.5) * 0.1,
                    z: 0,
                });
            }

            // Large hand bounding box (close)
            const largeHand: Landmark[] = [];
            for (let i = 0; i < 21; i++) {
                largeHand.push({
                    x: 0.5 + (Math.random() - 0.5) * 0.5, // Large spread
                    y: 0.5 + (Math.random() - 0.5) * 0.5,
                    z: 0,
                });
            }

            const smallHandZ = estimateDepth(smallHand);
            const largeHandZ = estimateDepth(largeHand);

            // Small hand should have larger Z (farther)
            expect(smallHandZ).toBeGreaterThanOrEqual(largeHandZ);
        });

        it('should return 0 for empty landmarks', () => {
            expect(estimateDepth([])).toBe(0);
        });

        it('should return 0 for incomplete landmarks', () => {
            expect(estimateDepth([{ x: 0.5, y: 0.5, z: 0 }])).toBe(0);
        });
    });

    describe('mapToWorld3D', () => {
        it('should map all three coordinates', () => {
            const landmarks: Landmark[] = [];
            for (let i = 0; i < 21; i++) {
                landmarks.push({ x: 0.5, y: 0.5, z: 0 });
            }

            const landmark = createLandmark(0.5, 0.5);
            const result = mapToWorld3D(landmark, landmarks);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
            expect(typeof result.z).toBe('number');
        });
    });

    describe('lerp', () => {
        it('should return current when factor is 0', () => {
            expect(lerp(0, 10, 0)).toBe(0);
        });

        it('should return target when factor is 1', () => {
            expect(lerp(0, 10, 1)).toBe(10);
        });

        it('should return midpoint when factor is 0.5', () => {
            expect(lerp(0, 10, 0.5)).toBe(5);
        });

        it('should interpolate correctly', () => {
            expect(lerp(0, 100, 0.25)).toBe(25);
            expect(lerp(0, 100, 0.75)).toBe(75);
        });

        it('should handle negative values', () => {
            expect(lerp(-10, 10, 0.5)).toBe(0);
        });
    });

    describe('lerp3D', () => {
        it('should lerp all three coordinates', () => {
            const current = { x: 0, y: 0, z: 0 };
            const target = { x: 10, y: 20, z: 30 };

            const result = lerp3D(current, target, 0.5);
            expect(result).toEqual({ x: 5, y: 10, z: 15 });
        });
    });
});
