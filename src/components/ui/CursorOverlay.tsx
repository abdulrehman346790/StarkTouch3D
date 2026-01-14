'use client';
// ============================================
// Index-Locked Cursor - "Shahadat ki Ungli ka Nishana"
// Follows Index Finger Tip (Landmark 8) with magnetic smoothing
// ============================================

import { useRef, useEffect, useState } from 'react';
import { HandLandmarks, FingerTip } from '../../types';
import { useMode } from '../../store/useVoxelStore';

interface CursorOverlayProps {
    hands: HandLandmarks[];
    width: number;
    height: number;
    videoWidth?: number;
    videoHeight?: number;
}

// Lerp factor - lower = smoother but slower, higher = faster but can jitter
const LERP_FACTOR = 0.25; // 25% towards target each frame - magnetic feel

export default function CursorOverlay({
    hands,
    width,
    height,
    videoWidth = 1280,
    videoHeight = 720,
}: CursorOverlayProps) {
    const mode = useMode();

    // Smoothed cursor position (lerp applied)
    const smoothedPos = useRef({ x: width / 2, y: height / 2 });
    const [displayPos, setDisplayPos] = useState({ x: width / 2, y: height / 2 });
    const [isPinching, setIsPinching] = useState(false);
    const [visible, setVisible] = useState(false);
    const animationRef = useRef<number>(0);

    // Helper to map normalized coordinates to screen
    // Simplified: Assumes video matches screen size (stretched/filled)
    const getScreenCoordinates = (normX: number, normY: number) => {
        return {
            x: (1 - normX) * width, // Mirror X
            y: normY * height,
        };
    };

    useEffect(() => {
        const updateCursor = () => {
            if (hands.length === 0 || hands.length >= 2) {
                setVisible(false);
                animationRef.current = requestAnimationFrame(updateCursor);
                return;
            }

            // ============================================
            // 1. THE SOURCE: STRICTLY Landmark 8 (Index Finger Tip)
            // Ignore all other 20 landmarks
            // ============================================
            const hand = hands[0];
            const indexTip = hand.landmarks[FingerTip.INDEX]; // Landmark 8 ONLY
            const thumbTip = hand.landmarks[FingerTip.THUMB]; // For pinch detection

            if (!indexTip) {
                animationRef.current = requestAnimationFrame(updateCursor);
                return;
            }

            // Convert to screen coordinates using mapping
            const { x: targetX, y: targetY } = getScreenCoordinates(indexTip.x, indexTip.y);

            // ============================================
            // 2. THE GLUE: "Magnetic" Smoothing (Lerp)
            // Cursor magnetically follows finger - no jitter
            // ============================================
            smoothedPos.current.x += (targetX - smoothedPos.current.x) * LERP_FACTOR;
            smoothedPos.current.y += (targetY - smoothedPos.current.y) * LERP_FACTOR;

            setDisplayPos({
                x: smoothedPos.current.x,
                y: smoothedPos.current.y,
            });
            setVisible(true);

            // Check pinch state (for trigger visual)
            if (thumbTip) {
                // Determine pinch distance in SCREEN PIXELS for consistent feel
                const thumbPos = getScreenCoordinates(thumbTip.x, thumbTip.y);
                const indexPos = getScreenCoordinates(indexTip.x, indexTip.y);

                const dx = thumbPos.x - indexPos.x;
                const dy = thumbPos.y - indexPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Threshold ~60px
                setIsPinching(distance < 60);
            }

            animationRef.current = requestAnimationFrame(updateCursor);
        };

        animationRef.current = requestAnimationFrame(updateCursor);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [hands, width, height, videoWidth, videoHeight]);

    // Hide during navigation mode (2 hands)
    if (!visible) return null;

    const color = mode === 'BUILD' ? '#00FFFF' : '#4169E1';

    return (
        <div
            style={{
                position: 'absolute',
                left: displayPos.x,
                top: displayPos.y,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 50,
                transition: 'none', // No CSS transition - we handle smoothing ourselves
            }}
        >
            {/* Main Crosshair Circle */}
            <div
                style={{
                    width: isPinching ? 50 : 36,
                    height: isPinching ? 50 : 36,
                    border: `2px solid ${isPinching ? '#FF4444' : color}`,
                    borderRadius: '50%',
                    boxShadow: isPinching
                        ? '0 0 20px #FF4444, 0 0 40px #FF4444, inset 0 0 10px rgba(255,68,68,0.3)'
                        : `0 0 15px ${color}, 0 0 30px ${color}`,
                    transition: 'width 0.1s, height 0.1s, border-color 0.1s, box-shadow 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isPinching ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                }}
            >
                {/* Center Dot - The actual pointing indicator */}
                <div
                    style={{
                        width: isPinching ? 10 : 6,
                        height: isPinching ? 10 : 6,
                        backgroundColor: isPinching ? '#FF4444' : color,
                        borderRadius: '50%',
                        boxShadow: isPinching
                            ? '0 0 10px #FF4444'
                            : `0 0 8px ${color}`,
                        transition: 'all 0.1s',
                    }}
                />
            </div>

            {/* Crosshair Lines - extends from circle */}
            {[0, 90, 180, 270].map((angle) => (
                <div
                    key={angle}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 12,
                        height: 2,
                        backgroundColor: color,
                        opacity: 0.8,
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${isPinching ? 32 : 24}px)`,
                        boxShadow: `0 0 5px ${color}`,
                        transition: 'transform 0.1s',
                    }}
                />
            ))}

            {/* Pinch/Fire Pulse Effect */}
            {isPinching && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 70,
                        height: 70,
                        border: '2px solid #FF4444',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'pulse-ring 0.4s ease-out infinite',
                        opacity: 0.6,
                    }}
                />
            )}

            <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
