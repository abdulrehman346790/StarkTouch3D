// ============================================
// Gesture Detection - Pinch & Hand Angle Logic
// ============================================

import { Landmark, FingerTip } from '../types';

// Pinch threshold - distance below which fingers are considered "pinching"
const PINCH_THRESHOLD = 0.05;

/**
 * Calculates Euclidean distance between two landmarks
 * @param p1 - First landmark (e.g., thumb tip)
 * @param p2 - Second landmark (e.g., index tip)
 * @returns Distance between the two points
 */
export function landmarkDistance(p1: Landmark, p2: Landmark): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Detects if thumb and index finger are pinching
 * @param thumbTip - Thumb tip landmark (index 4)
 * @param indexTip - Index finger tip landmark (index 8)
 * @param threshold - Distance threshold (default: 0.05)
 * @returns true if pinching
 * DEPRECATED: Use getPinchState for adaptive thresholding
 */
export function isPinching(
    thumbTip: Landmark,
    indexTip: Landmark,
    threshold: number = PINCH_THRESHOLD
): boolean {
    const distance = landmarkDistance(thumbTip, indexTip);
    return distance < threshold;
}

/**
 * Gets pinch state from full hand landmarks array
 * Uses ADAPTIVE THRESHOLDING based on hand size (depth)
 * @param landmarks - Array of 21 hand landmarks
 * @param baseRatio - Threshold relative to hand size (default: 0.35)
 */
export function getPinchState(
    landmarks: Landmark[],
    baseRatio: number = 0.35 // Pinch distance allowed to be 35% of palm size
): { isPinching: boolean; distance: number } {
    const thumbTip = landmarks[FingerTip.THUMB];
    const indexTip = landmarks[FingerTip.INDEX];

    // Calculate Reference Scale (Wrist to Middle Finger Knuckle/MCP)
    // Index 0: Wrist, Index 9: Middle MCP
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];

    if (!thumbTip || !indexTip || !wrist || !middleMCP) {
        return { isPinching: false, distance: 1 };
    }

    // 1. Calculate Hand Scale (approx palm size)
    const handScale = landmarkDistance(wrist, middleMCP);

    // 2. Calculate Adaptive Threshold
    // If hand is close (scale 0.4), threshold = 0.14
    // If hand is far (scale 0.1), threshold = 0.035
    const adaptiveThreshold = handScale * baseRatio;

    // 3. Measure Pinch Distance
    const pinchDistance = landmarkDistance(thumbTip, indexTip);

    return {
        isPinching: pinchDistance < adaptiveThreshold,
        distance: pinchDistance,
    };
}

/**
 * Calculates the angle of the hand based on wrist and middle finger
 * Used for rotation in navigation mode
 * @param landmarks - Array of 21 hand landmarks
 * @returns Angle in radians
 */
export function getHandAngle(landmarks: Landmark[]): number {
    const wrist = landmarks[0]; // Wrist is index 0
    const middleTip = landmarks[FingerTip.MIDDLE];

    if (!wrist || !middleTip) return 0;

    return Math.atan2(middleTip.y - wrist.y, middleTip.x - wrist.x);
}

/**
 * Calculates midpoint between two landmarks
 * Used for finding center point between two hands
 */
export function getMidpoint(p1: Landmark, p2: Landmark): Landmark {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: (p1.z + p2.z) / 2,
    };
}

/**
 * Detects if the hand is in a "Fist" gesture (fingers closed)
 * Logic: Checks if fingertips are close to the wrist
 * @param landmarks - Array of 21 hand landmarks
 * @returns true if fist detected
 */
export function isFist(landmarks: Landmark[]): boolean {
    const wrist = landmarks[0];
    const tips = [
        landmarks[FingerTip.INDEX],
        landmarks[FingerTip.MIDDLE],
        landmarks[FingerTip.RING],
        landmarks[FingerTip.PINKY]
    ];

    if (!wrist || tips.some(t => !t)) return false;

    // Check if ALL fingertips are close to the wrist
    // Adjusted threshold for robustness
    const FIST_THRESHOLD = 0.18;

    // Check average distance to allow for imperfect fists
    const avgDistance = tips.reduce((sum, tip) => sum + landmarkDistance(tip, wrist), 0) / tips.length;

    return avgDistance < FIST_THRESHOLD;
}

/**
 * Gets the index finger tip position from landmarks
 * This is the primary cursor position
 */
export function getIndexFingerTip(landmarks: Landmark[]): Landmark | null {
    return landmarks[FingerTip.INDEX] || null;
}
