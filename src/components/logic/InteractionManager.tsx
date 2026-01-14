'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useRef, MutableRefObject } from 'react';
import { HandLandmarks } from '@/types';
import { mapToWorldRaycast, estimateDepth } from '@/logic/coordMapper';
import { getIndexFingerTip, getPinchState, isFist } from '@/logic/gestures';
import { snapToGrid } from '@/logic/gridMath';
import { useVoxelStore } from '@/store/useVoxelStore';
import {
    calculateNavigation,
    resetNavigationReference,
    isDoublePinching,
    NavigationState
} from '@/logic/navigation';

import { videoToScreenCoordinates } from '@/logic/cameraMath';

interface InteractionManagerProps {
    handsRef: MutableRefObject<HandLandmarks[]>;
    width: number;
    height: number;
    videoWidth: number;
    videoHeight: number;
}

export default function InteractionManager({
    handsRef,
    width,
    height,
    videoWidth,
    videoHeight
}: InteractionManagerProps) {
    const { camera } = useThree();
    const {
        setRawCursorPosition,
        setCursorPosition,
        addBlock,
        removeBlockAt,
        setMode,
        setSceneRotation,
        setCameraZoom,
        sceneRotation,
        cameraZoom
    } = useVoxelStore();

    const lastInteractTime = useRef(0);
    const INTERACT_COOLDOWN = 150; // Faster for erasing

    // Navigation State (Moved from VoxelHandAR)
    const wasNavigating = useRef(false);
    const navState = useRef<NavigationState>({
        rotation: { x: 0, y: 0 },
        zoom: 15,
        isNavigating: false,
    });

    useFrame(() => {
        const hands = handsRef.current; // Read from Ref (No re-renders needed)

        // 1. Identify Hands
        const leftHand = hands.find(h => h.handedness === 'Left');
        const rightHand = hands.find(h => h.handedness === 'Right');

        // 2. Check Gestures
        const pinchLeft = leftHand ? getPinchState(leftHand.landmarks).isPinching : false;
        const pinchRight = rightHand ? getPinchState(rightHand.landmarks).isPinching : false;

        // FIST DETECTION (Imported from gestures.ts)
        // Right Hand Fist triggers Erase Mode
        const fistRight = rightHand ? isFist(rightHand.landmarks) : false;

        // 3. Logic Flow (Priority Based)

        // PRIORITY 1: NAVIGATION (Double Pinch)
        // If both hands are pinching, we navigate regardless of anything else.
        if (leftHand && rightHand && pinchLeft && pinchRight) {
            setMode('NAVIGATE');

            const newNavState = calculateNavigation(leftHand, rightHand, {
                rotation: sceneRotation,
                zoom: cameraZoom,
                isNavigating: true,
            });

            setSceneRotation(newNavState.rotation.x, newNavState.rotation.y);
            setCameraZoom(newNavState.zoom);
            navState.current = newNavState;
            wasNavigating.current = true;
            return; // Stop here
        }

        // Reset Navigation if we just stopped
        if (wasNavigating.current) {
            resetNavigationReference();
            wasNavigating.current = false;
        }

        // PRIORITY 2: ERASE MODE (Swapped Logic)
        // Trigger: Right Hand makes a Fist ✊
        // Cursor: Left Hand 👈
        // Action: Left Hand Pinch 👌
        if (rightHand && fistRight && leftHand) {
            setMode('ERASE');

            const indexTip = getIndexFingerTip(leftHand.landmarks);
            if (indexTip) {
                // Visual X (Mirrored)
                const visualX = 1 - indexTip.x;
                const visualY = indexTip.y;
                const z = estimateDepth(leftHand.landmarks);

                // Raycast & Snap
                const worldPos = mapToWorldRaycast(visualX, visualY, z, camera);
                setRawCursorPosition(worldPos.x, worldPos.y, worldPos.z);

                const snappedX = snapToGrid(worldPos.x);
                const snappedY = Math.max(0, snapToGrid(worldPos.y));
                const snappedZ = snapToGrid(worldPos.z);
                setCursorPosition(snappedX, snappedY, snappedZ);

                // Action: Delete on Left Pinch
                if (pinchLeft) {
                    const now = Date.now();
                    if (now - lastInteractTime.current > INTERACT_COOLDOWN) {
                        removeBlockAt(snappedX, snappedY, snappedZ);
                        lastInteractTime.current = now;
                    }
                }
            }
            return; // Stop here
        }

        // PRIORITY 3: BUILD MODE (Default)
        // Trigger: Right Hand exists (and NOT Fist)
        // Cursor: Right Hand 👈
        // Action: Right Hand Pinch 👌
        if (rightHand) {
            setMode('BUILD');

            const indexTip = getIndexFingerTip(rightHand.landmarks);
            if (indexTip) {
                // Visual X (Mirrored)
                const visualX = 1 - indexTip.x;
                const visualY = indexTip.y;
                const z = estimateDepth(rightHand.landmarks);

                // Raycast & Snap
                const worldPos = mapToWorldRaycast(visualX, visualY, z, camera);
                setRawCursorPosition(worldPos.x, worldPos.y, worldPos.z);

                const snappedX = snapToGrid(worldPos.x);
                const snappedY = Math.max(0, snapToGrid(worldPos.y));
                const snappedZ = snapToGrid(worldPos.z);
                setCursorPosition(snappedX, snappedY, snappedZ);

                // Action: Build on Right Pinch
                if (pinchRight) {
                    const now = Date.now();
                    if (now - lastInteractTime.current > 300) { // Slower for build
                        addBlock(snappedX, snappedY, snappedZ);
                        lastInteractTime.current = now;
                    }
                }
            }
            return;
        }

        // Idle / No Right Hand
        // If only Left Hand exists, we can perhaps just move cursor but do nothing?
        // For now, let's keep it clean.
    });

    return null;
}
