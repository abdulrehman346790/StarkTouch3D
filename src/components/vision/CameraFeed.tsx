'use client';
// ============================================
// Camera Feed Component - Webcam with Mirror Effect
// ============================================

import { useRef, useEffect, useState, useCallback } from 'react';

interface CameraFeedProps {
    onVideoReady?: (video: HTMLVideoElement) => void;
    width?: number;
    height?: number;
}

export default function CameraFeed({
    onVideoReady,
    width = 1280,
    height = 720,
}: CameraFeedProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        // Reset state
        setError(null);
        setIsLoading(true);

        // Stop any existing stream first
        stopCamera();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: width },
                    height: { ideal: height },
                    facingMode: 'user',
                },
            });

            // Check if component is still mounted
            if (!mountedRef.current) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Handle play() with proper error catching
                try {
                    await videoRef.current.play();
                    if (mountedRef.current) {
                        setIsLoading(false);
                        setError(null);
                        onVideoReady?.(videoRef.current);
                    }
                } catch (playError) {
                    // AbortError is expected during hot reload - ignore it
                    if ((playError as Error).name !== 'AbortError') {
                        console.error('Video play error:', playError);
                    }
                }
            }
        } catch (err) {
            if (mountedRef.current) {
                const errorName = (err as Error).name;
                if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
                    setError('Camera access denied. Please allow camera permissions.');
                } else if (errorName === 'NotFoundError') {
                    setError('No camera found. Please connect a webcam.');
                } else {
                    setError('Camera error. Please try again.');
                }
                setIsLoading(false);
                console.error('Camera error:', err);
            }
        }
    }, [width, height, onVideoReady, stopCamera]);

    useEffect(() => {
        mountedRef.current = true;
        startCamera();

        return () => {
            mountedRef.current = false;
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    if (error) {
        return (
            <div className="camera-error">
                <p>🎥 {error}</p>
                <button onClick={startCamera}>Retry</button>
            </div>
        );
    }

    return (
        <div className="camera-container">
            {isLoading && <div className="camera-loading">Loading camera...</div>}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Simple pipeline: Fit entire video, no cropping (may have black bars)
                    transform: 'scaleX(-1)', // Mirror effect for natural movement
                }}
            />
        </div>
    );
}
