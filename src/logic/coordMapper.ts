// ============================================
// Coordinate Mapper - MediaPipe to World Space
// using Raycasting Logic for Perfect Alignment
// ============================================

import { Landmark } from '../types';
import * as THREE from 'three';

// Standard 16:9 aspect ratio assumption for unprojection if camera not available
const ASPECT_RATIO = 16 / 9;
// Standard FOV for webcam usually around 50-60
const FOV = 50;

/**
 * Maps a 2D normalized screen position (0-1) to a 3D world position
 * by "unprojecting" the point from the camera's perspective.
 * 
 * This creates a 1:1 feel where the 3D obj is exactly under the finger.
 */
export function mapToWorldRaycast(
    normalizedX: number,
    normalizedY: number,
    targetZ: number, // The depth we want to place the object at
    camera?: THREE.Camera // Optional Three.js camera
): { x: number; y: number; z: number } {

    // 1. Convert 0-1 (Top-Left) to NDC -1 to +1 (Center-Up)
    // Removed implicit mirroring - Input must be visual screen coordinates
    const ndcX = normalizedX * 2 - 1;
    // Invert Y (Screen Y is down, 3D Y is up)
    const ndcY = -(normalizedY * 2 - 1);

    // If we have actual camera, use it for perfect match
    if (camera) {
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5); // 0.5 is arbitrary depth
        vector.unproject(camera);

        // Ray direction from camera to unprojected point
        const dir = vector.sub(camera.position).normalize();

        // Calculate distance to reach targetZ
        // camera.z + distance * dir.z = targetZ
        // distance = (targetZ - camera.z) / dir.z
        const distance = (targetZ - camera.position.z) / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));

        return { x: pos.x, y: pos.y, z: targetZ };
    }

    // Fallback Math ( Approximate perspective projection )
    // Calculate view plane dimensions at target Z
    // This assumes camera is at Z=15 (our default) looking at 0,0,0
    const camZ = 15;
    const distance = Math.abs(camZ - targetZ);

    // Height of view plane at this distance
    // tan(FOV/2) = (height/2) / distance
    const vFov = (FOV * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * distance;
    const planeWidth = planeHeight * ASPECT_RATIO;

    const x = ndcX * (planeWidth / 2);
    const y = ndcY * (planeHeight / 2);

    return { x, y, z: targetZ };
}

/**
 * Estimate depth (Z) from hand landmarks
 * Uses hand bounding box size as proxy for distance
 */
export function estimateDepth(landmarks: Landmark[]): number {
    if (!landmarks || landmarks.length < 21) return 0;

    // Calculate hand bounding box
    const xs = landmarks.map((l) => l.x);
    const ys = landmarks.map((l) => l.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Hand size (larger = closer to camera)
    const handSize = Math.max(maxX - minX, maxY - minY);

    // Map size to depth
    const MIN_SIZE = 0.1;
    const MAX_SIZE = 0.4;

    const clampedSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, handSize));
    const normalized = (clampedSize - MIN_SIZE) / (MAX_SIZE - MIN_SIZE);

    // Invert: bigger hand = closer = smaller depth (closer to 0 or positive)
    // Range: -5 (far) to 5 (close)
    return -5 + normalized * 10;
}

/**
 * Standard mapToWorld2D (Deprecated for Raycast but kept for compatibility)
 */
export function mapToWorld2D(
    normalizedX: number,
    normalizedY: number
): { x: number; y: number } {
    // Just a wrapper now using default Z=0
    return mapToWorldRaycast(normalizedX, normalizedY, 0);
}

/**
 * Full 3D mapping
 */
export function mapToWorld3D(
    landmark: Landmark,
    allLandmarks: Landmark[],
    camera?: THREE.Camera
): { x: number; y: number; z: number } {
    const z = estimateDepth(allLandmarks);
    return mapToWorldRaycast(landmark.x, landmark.y, z, camera);
}

// Lerp helpers remain same
export function lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
}

export function lerp3D(
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    factor: number
): { x: number; y: number; z: number } {
    return {
        x: lerp(start.x, end.x, factor),
        y: lerp(start.y, end.y, factor),
        z: lerp(start.z, end.z, factor),
    };
}
