// ============================================
// Pinch Detector Tests (TDD)
// ============================================

import {
    landmarkDistance,
    isPinching,
    getPinchState,
    getHandAngle,
    getMidpoint,
    getIndexFingerTip,
} from '../src/logic/gestures';
import { Landmark, FingerTip } from '../src/types';

// Helper to create a landmark
const createLandmark = (x: number, y: number, z: number = 0): Landmark => ({
    x,
    y,
    z,
});

// Create a mock hand with 21 landmarks
const createMockHand = (): Landmark[] => {
    const landmarks: Landmark[] = [];
    for (let i = 0; i < 21; i++) {
        landmarks.push({ x: 0.5, y: 0.5, z: 0 });
    }
    return landmarks;
};

describe('Pinch Detector', () => {
    describe('landmarkDistance', () => {
        it('should calculate distance between two points in 2D', () => {
            const p1 = createLandmark(0, 0);
            const p2 = createLandmark(3, 4);
            expect(landmarkDistance(p1, p2)).toBe(5); // 3-4-5 triangle
        });

        it('should calculate distance in 3D', () => {
            const p1 = createLandmark(0, 0, 0);
            const p2 = createLandmark(1, 2, 2);
            expect(landmarkDistance(p1, p2)).toBe(3); // sqrt(1 + 4 + 4) = 3
        });

        it('should return 0 for same point', () => {
            const p = createLandmark(5, 5, 5);
            expect(landmarkDistance(p, p)).toBe(0);
        });
    });

    describe('isPinching', () => {
        it('should return true when fingers are close (< 0.05)', () => {
            const thumb = createLandmark(0.5, 0.5);
            const index = createLandmark(0.52, 0.52); // Distance ≈ 0.028
            expect(isPinching(thumb, index)).toBe(true);
        });

        it('should return false when fingers are far apart', () => {
            const thumb = createLandmark(0.3, 0.3);
            const index = createLandmark(0.6, 0.6); // Distance ≈ 0.42
            expect(isPinching(thumb, index)).toBe(false);
        });

        it('should respect custom threshold', () => {
            const thumb = createLandmark(0.5, 0.5);
            const index = createLandmark(0.55, 0.55); // Distance ≈ 0.07

            expect(isPinching(thumb, index, 0.05)).toBe(false);
            expect(isPinching(thumb, index, 0.1)).toBe(true);
        });

        it('should return true for exactly touching fingers', () => {
            const thumb = createLandmark(0.5, 0.5);
            const index = createLandmark(0.5, 0.5);
            expect(isPinching(thumb, index)).toBe(true);
        });
    });

    describe('getPinchState', () => {
        it('should detect pinch from landmarks array', () => {
            const landmarks = createMockHand();
            // Set thumb and index very close
            landmarks[FingerTip.THUMB] = createLandmark(0.5, 0.5);
            landmarks[FingerTip.INDEX] = createLandmark(0.52, 0.52);

            const state = getPinchState(landmarks);
            expect(state.isPinching).toBe(true);
            expect(state.distance).toBeLessThan(0.05);
        });

        it('should not detect pinch when fingers apart', () => {
            const landmarks = createMockHand();
            landmarks[FingerTip.THUMB] = createLandmark(0.3, 0.3);
            landmarks[FingerTip.INDEX] = createLandmark(0.7, 0.7);

            const state = getPinchState(landmarks);
            expect(state.isPinching).toBe(false);
        });

        it('should return safe default for incomplete landmarks', () => {
            const state = getPinchState([]);
            expect(state.isPinching).toBe(false);
            expect(state.distance).toBe(1);
        });
    });

    describe('getHandAngle', () => {
        it('should return 0 for horizontal hand pointing right', () => {
            const landmarks = createMockHand();
            landmarks[0] = createLandmark(0.3, 0.5); // Wrist
            landmarks[FingerTip.MIDDLE] = createLandmark(0.7, 0.5); // Middle finger pointing right

            expect(getHandAngle(landmarks)).toBe(0);
        });

        it('should return PI/2 for hand pointing up', () => {
            const landmarks = createMockHand();
            landmarks[0] = createLandmark(0.5, 0.7); // Wrist
            landmarks[FingerTip.MIDDLE] = createLandmark(0.5, 0.3); // Middle finger pointing up

            // Note: Screen Y is inverted, so pointing up means negative Y difference
            expect(getHandAngle(landmarks)).toBeCloseTo(-Math.PI / 2);
        });

        it('should return 0 for empty landmarks', () => {
            expect(getHandAngle([])).toBe(0);
        });
    });

    describe('getMidpoint', () => {
        it('should calculate midpoint between two landmarks', () => {
            const p1 = createLandmark(0, 0, 0);
            const p2 = createLandmark(2, 4, 6);

            const mid = getMidpoint(p1, p2);
            expect(mid).toEqual({ x: 1, y: 2, z: 3 });
        });
    });

    describe('getIndexFingerTip', () => {
        it('should return index finger tip landmark', () => {
            const landmarks = createMockHand();
            landmarks[FingerTip.INDEX] = createLandmark(0.7, 0.3, 0.1);

            const tip = getIndexFingerTip(landmarks);
            expect(tip).toEqual({ x: 0.7, y: 0.3, z: 0.1 });
        });

        it('should return null for incomplete landmarks', () => {
            expect(getIndexFingerTip([])).toBeNull();
        });
    });
});
