'use client';
// ============================================
// Hand Landmarker Component - MediaPipe Integration
// ============================================

import { useRef, useEffect, useCallback, useState } from 'react';
import {
    HandLandmarker,
    FilesetResolver,
    HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { Landmark, HandLandmarks } from '../../types';

interface HandLandmarkerProps {
    videoElement: HTMLVideoElement | null;
    onResults: (hands: HandLandmarks[]) => void;
    onReady?: () => void;
}

export default function HandLandmarkerComponent({
    videoElement,
    onResults,
    onReady,
}: HandLandmarkerProps) {
    const landmarkerRef = useRef<HandLandmarker | null>(null);
    const animationRef = useRef<number>(0);
    const [isReady, setIsReady] = useState(false);

    // Initialize MediaPipe Hand Landmarker
    const initializeLandmarker = useCallback(async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );

            landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                numHands: 2, // Support two-hand navigation
                minHandDetectionConfidence: 0.3,
                minHandPresenceConfidence: 0.3,
                minTrackingConfidence: 0.3,
            });

            setIsReady(true);
            onReady?.();
            console.log('✅ Hand Landmarker initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Hand Landmarker:', error);
        }
    }, [onReady]);

    // Process each video frame
    const processFrame = useCallback(() => {
        if (!landmarkerRef.current || !videoElement) {
            animationRef.current = requestAnimationFrame(processFrame);
            return;
        }

        // Strict readiness check to prevent MediaPipe crashes
        if (
            videoElement.paused ||
            videoElement.currentTime === 0 ||
            videoElement.readyState < 2 || // HAVE_CURRENT_DATA
            videoElement.videoWidth === 0 ||
            videoElement.videoHeight === 0
        ) {
            animationRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const startTimeMs = performance.now();
        const result: HandLandmarkerResult = landmarkerRef.current.detectForVideo(
            videoElement,
            startTimeMs
        );

        // Convert MediaPipe results to our format
        const hands: HandLandmarks[] = result.landmarks.map((landmarks, index) => ({
            landmarks: landmarks.map((lm): Landmark => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
            })),
            handedness: result.handednesses[index]?.[0]?.categoryName as 'Left' | 'Right' || 'Right',
        }));

        onResults(hands);
        animationRef.current = requestAnimationFrame(processFrame);
    }, [videoElement, onResults]);

    // Start processing when video and landmarker are ready
    useEffect(() => {
        if (videoElement && isReady) {
            animationRef.current = requestAnimationFrame(processFrame);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [videoElement, isReady, processFrame]);

    // Initialize on mount
    useEffect(() => {
        initializeLandmarker();

        return () => {
            if (landmarkerRef.current) {
                landmarkerRef.current.close();
            }
        };
    }, [initializeLandmarker]);

    return null; // This is a logic component, no UI
}
