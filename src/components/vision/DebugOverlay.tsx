'use client';
// ============================================
// Debug Overlay - Visual fingertip dots (2D Canvas)
// optimized: Reads from Ref via RequestAnimationFrame
// ============================================

import { useRef, useEffect, MutableRefObject } from 'react';
import { HandLandmarks, FingerTip } from '../../types';

interface DebugOverlayProps {
    handsRef: MutableRefObject<HandLandmarks[]>; // Read directly from ref
    width: number;
    height: number;
    videoWidth?: number;
    videoHeight?: number;
    show?: boolean;
}

// Colors for different fingertips
const FINGERTIP_COLORS: { [key: number]: string } = {
    [FingerTip.THUMB]: '#FF6B6B',   // Red
    [FingerTip.INDEX]: '#4ECDC4',   // Cyan
    [FingerTip.MIDDLE]: '#45B7D1', // Blue
    [FingerTip.RING]: '#96CEB4',   // Green
    [FingerTip.PINKY]: '#FFEAA7',  // Yellow
};

export default function DebugOverlay({
    handsRef,
    width,
    height,
    videoWidth = 1280,
    videoHeight = 720,
    show = true,
}: DebugOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number>(0);

    // Helper to map normalized coordinates to screen
    // Simplified: Canvas is now sized to match video exactly, so just scale & mirror
    const getScreenCoordinates = (normX: number, normY: number) => {
        return {
            x: (1 - normX) * width, // Mirror X
            y: normY * height,
        };
    };

    const draw = () => {
        if (!show || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Read hands from REF (Optimized)
        const hands = handsRef.current;

        // Visual Configuration
        ctx.shadowBlur = 15; // NEON GLOW
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        hands.forEach((hand, handIndex) => {
            const isLeft = hand.handedness === 'Left';
            // Left = Hot Pink/Magenta, Right = Cyan/Electric Blue
            const mainColor = isLeft ? '#FF00FF' : '#00FFFF';
            ctx.shadowColor = mainColor;
            ctx.strokeStyle = mainColor;
            ctx.fillStyle = mainColor;

            // 1. Draw Skeleton Lines (Bones)
            // Simplified connections for style: Wrist -> Knuckles -> Tips
            const wrist = hand.landmarks[0];
            if (!wrist) return;
            const wristPos = getScreenCoordinates(wrist.x, wrist.y);

            // Fingers: Thumb(1-4), Index(5-8), Middle(9-12), Ring(13-16), Pinky(17-20)
            const fingers = [
                [1, 2, 3, 4],       // Thumb
                [5, 6, 7, 8],       // Index
                [9, 10, 11, 12],    // Middle
                [13, 14, 15, 16],   // Ring
                [17, 18, 19, 20]    // Pinky
            ];

            fingers.forEach(indices => {
                ctx.beginPath();
                ctx.moveTo(wristPos.x, wristPos.y); // Start from wrist

                indices.forEach(idx => {
                    const lm = hand.landmarks[idx];
                    const pos = getScreenCoordinates(lm.x, lm.y);
                    ctx.lineTo(pos.x, pos.y);
                });

                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6;
                ctx.stroke();
            });

            // 2. Draw Glowing Nodes (Joints)
            hand.landmarks.forEach((lm) => {
                const { x, y } = getScreenCoordinates(lm.x, lm.y);

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2); // Small joints
                ctx.globalAlpha = 0.9;
                ctx.fill();
            });

            // 3. Highlight Fingertips (Bigger glow)
            [4, 8, 12, 16, 20].forEach(tipIdx => {
                const tip = hand.landmarks[tipIdx];
                const { x, y } = getScreenCoordinates(tip.x, tip.y);

                // Core
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF'; // White core
                ctx.shadowBlur = 20;       // Intense glow
                ctx.fill();

                // Ring
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.strokeStyle = mainColor;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // 4. Sci-Fi Text Label
            ctx.shadowBlur = 0; // Turn off for text crispness
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = mainColor;
            ctx.textAlign = 'center';
            ctx.fillText(isLeft ? 'LH-SYSTEM' : 'RH-SYSTEM', wristPos.x, wristPos.y + 40);
        });

        // Loop
        animationFrameId.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        if (show) {
            animationFrameId.current = requestAnimationFrame(draw);
        } else {
            // Clear if hidden
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, width, height);
            }
        }

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [show, width, height, videoWidth, videoHeight]); // Re-start loop if dimensions change or visibility toggles

    if (!show) return null;

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 10,
            }}
        />
    );
}
