// ============================================
// Navigation Logic - Two-Hand Scene Control
// ============================================

import { Landmark, HandLandmarks } from '../types';
import { getMidpoint, landmarkDistance } from './gestures';

// Navigation state
export interface NavigationState {
    rotation: { x: number; y: number };
    zoom: number;
    isNavigating: boolean;
}

// Track initial positions when navigation starts
let initialMidpoint: Landmark | null = null;
let initialHandDistance: number | null = null;
let initialRotation: { x: number; y: number } = { x: 0, y: 0 };
let initialZoom = 15;

/**
 * Calculate navigation parameters from two hands
 * Uses INCREMENTAL movement from initial position
 * @param leftHand - Left hand landmarks
 * @param rightHand - Right hand landmarks
 * @param currentState - Current navigation state
 */
export function calculateNavigation(
    leftHand: HandLandmarks,
    rightHand: HandLandmarks,
    currentState: NavigationState
): NavigationState {
    // Get palm centers (wrist landmark as approximation)
    const leftPalm = leftHand.landmarks[0]; // Wrist
    const rightPalm = rightHand.landmarks[0];

    if (!leftPalm || !rightPalm) {
        return currentState;
    }

    // Calculate current midpoint and distance
    const currentMidpoint = getMidpoint(leftPalm, rightPalm);
    const currentDistance = landmarkDistance(leftPalm, rightPalm);

    // Initialize reference on first frame of navigation
    if (initialMidpoint === null || initialHandDistance === null) {
        initialMidpoint = { ...currentMidpoint };
        initialHandDistance = currentDistance;
        initialRotation = { ...currentState.rotation };
        initialZoom = currentState.zoom;
    }

    // Calculate DELTA from initial position (incremental movement)
    const deltaX = currentMidpoint.x - initialMidpoint.x;
    const deltaY = currentMidpoint.y - initialMidpoint.y;

    // Apply delta to initial rotation (accumulate rotation)
    // Multiply by sensitivity factor for smooth control
    const rotationSensitivity = Math.PI * 2; // Full rotation with full hand sweep
    const newRotationX = initialRotation.x - deltaY * rotationSensitivity;
    const newRotationY = initialRotation.y + deltaX * rotationSensitivity;

    // Calculate zoom based on distance change ratio
    // Prevent division by zero
    const safeDistance = Math.max(0.001, currentDistance);
    const zoomRatio = initialHandDistance / safeDistance;
    const newZoom = Math.max(5, Math.min(30, initialZoom * zoomRatio));

    return {
        rotation: { x: newRotationX, y: newRotationY },
        zoom: newZoom,
        isNavigating: true,
    };
}

/**
 * Reset navigation reference when exiting navigation mode
 * This allows the next navigation session to start fresh
 * while keeping the current rotation/zoom as the new baseline
 */
export function resetNavigationReference(): void {
    initialMidpoint = null;
    initialHandDistance = null;
    // Don't reset initialRotation/initialZoom here - 
    // they will be set from currentState when navigation resumes
}

/**
 * Calculate the angle between two hands (for rotation gesture)
 * @param leftHand - Left hand landmarks
 * @param rightHand - Right hand landmarks
 */
export function getHandsAngle(
    leftHand: HandLandmarks,
    rightHand: HandLandmarks
): number {
    const leftPalm = leftHand.landmarks[0];
    const rightPalm = rightHand.landmarks[0];

    if (!leftPalm || !rightPalm) return 0;

    return Math.atan2(rightPalm.y - leftPalm.y, rightPalm.x - leftPalm.x);
}

/**
 * Check if both hands are pinching (double pinch for navigation activation)
 */
export function isDoublePinching(
    leftHand: HandLandmarks,
    rightHand: HandLandmarks,
    threshold: number = 0.06 // Slightly larger threshold for easier activation
): boolean {
    const leftThumb = leftHand.landmarks[4];
    const leftIndex = leftHand.landmarks[8];
    const rightThumb = rightHand.landmarks[4];
    const rightIndex = rightHand.landmarks[8];

    if (!leftThumb || !leftIndex || !rightThumb || !rightIndex) {
        return false;
    }

    const leftPinching = landmarkDistance(leftThumb, leftIndex) < threshold;
    const rightPinching = landmarkDistance(rightThumb, rightIndex) < threshold;

    return leftPinching && rightPinching;
}
