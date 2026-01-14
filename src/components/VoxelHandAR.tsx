'use client';
// ============================================
// Main VoxelHand AR Application
// Optimized: Uses Ref-based loop for tracking to prevent re-renders
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Components
import CameraFeed from '@/components/vision/CameraFeed';
import HandLandmarkerComponent from '@/components/vision/HandLandmarker';
import DebugOverlay from '@/components/vision/DebugOverlay';
import RetroOverlay from '@/components/ui/RetroOverlay';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ToastContainer, { Toasts } from '@/components/ui/ToastNotification';

// Logic
import { HandLandmarks } from '@/types';
import { NavigationState, resetNavigationReference } from '@/logic/navigation';
import {
    useVoxelStore,
    useSceneRotation,
    useCameraZoom,
} from '@/store/useVoxelStore';

// Dynamic import for R3F components
const Scene = dynamic(() => import('@/components/world/Scene'), { ssr: false });
const VoxelWorld = dynamic(() => import('@/components/world/VoxelWorld'), { ssr: false });
const GridHighlight = dynamic(() => import('@/components/world/GridHighlight'), { ssr: false });
const Lights = dynamic(() => import('@/components/world/Lights'), { ssr: false });
// Interaction manager (logic inside scene)
const InteractionManager = dynamic(() => import('@/components/logic/InteractionManager'), { ssr: false });

export default function VoxelHandAR() {
    // State
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    // REMOVED: const [hands, setHands] = useState<HandLandmarks[]>([]); 
    // Optimization: Use MutableRefObject for high-frequency tracking data
    const handsRef = useRef<HandLandmarks[]>([]);

    const [isReady, setIsReady] = useState(false);
    const [showDebug, setShowDebug] = useState(true);
    const modelLoaded = useVoxelStore((state) => state.modelLoaded);

    // Combined ready state - everything must be loaded
    const allReady = isReady && modelLoaded;

    // Screen Dimensions for responding to resize
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Init properties
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });

        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Store actions
    const {
        setMode,
        setSceneRotation,
        setCameraZoom,
    } = useVoxelStore();

    // Navigation state from store
    const sceneRotation = useSceneRotation();
    const cameraZoom = useCameraZoom();

    // Navigation tracking
    const wasNavigating = useRef(false);
    const navState = useRef<NavigationState>({
        rotation: { x: 0, y: 0 },
        zoom: 15,
        isNavigating: false,
    });

    // FPS tracking
    const [fps, setFps] = useState(0);
    const frameCount = useRef(0);
    const lastFpsUpdate = useRef(Date.now());

    // Video Dimensions Logic
    const [videoAspect, setVideoAspect] = useState(16 / 9);

    const handleVideoReady = useCallback((video: HTMLVideoElement) => {
        setVideoElement(video);
        if (video.videoWidth && video.videoHeight) {
            setVideoAspect(video.videoWidth / video.videoHeight);
        }
    }, []);

    // Handle hand tracking ready
    const handleTrackingReady = useCallback(() => {
        setIsReady(true);
    }, []);

    // Process hand tracking results
    const handleHandResults = useCallback(
        (detectedHands: HandLandmarks[]) => {
            // Update Ref directly (No re-render)
            handsRef.current = detectedHands;

            // FPS calculation
            frameCount.current++;
            const now = Date.now();
            if (now - lastFpsUpdate.current >= 1000) {
                setFps(frameCount.current);
                frameCount.current = 0;
                lastFpsUpdate.current = now;
            }
        },
        [] // No dependencies! This callback remains stable forever.
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();

            if (k === 'd') {
                setShowDebug((prev) => !prev);
            }
            if (k === 'r') {
                setSceneRotation(0, 0);
                setCameraZoom(15);
                resetNavigationReference();
            }
            if (k === 'c') {
                useVoxelStore.getState().resetBlocks();
                Toasts.cleared();
            }
            if (k === 's') {
                Toasts.saving();
                setTimeout(() => {
                    useVoxelStore.getState().saveToLocalStorage();
                    Toasts.saved();
                }, 300);
            }
            if (k === 'l') {
                Toasts.loading();
                setTimeout(() => {
                    useVoxelStore.getState().loadFromLocalStorage();
                    Toasts.loaded();
                }, 300);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSceneRotation, setCameraZoom]);

    // Calculate Fitted Dimensions for Layers (Contain Mode)
    // This ensures overlay matches the visible video exactly
    const screenAspect = windowSize.width / windowSize.height;
    let fitWidth, fitHeight;

    if (screenAspect > videoAspect) {
        // Screen is wider -> Fit to Height
        fitHeight = windowSize.height;
        fitWidth = fitHeight * videoAspect;
    } else {
        // Screen is taller -> Fit to Width
        fitWidth = windowSize.width;
        fitHeight = fitWidth / videoAspect;
    }

    // Centering Offsets
    const offsetX = (windowSize.width - fitWidth) / 2;
    const offsetY = (windowSize.height - fitHeight) / 2;

    return (
        <main className="voxel-app">
            {/* Layer 1: Camera Feed (Fills Screen, with Contain) */}
            <div className="camera-layer">
                <CameraFeed onVideoReady={handleVideoReady} />
            </div>

            {/* Content Container - Centered and Sized to match Video */}
            <div
                className="content-layer"
                style={{
                    position: 'absolute',
                    left: offsetX,
                    top: offsetY,
                    width: fitWidth,
                    height: fitHeight,
                    zIndex: 2
                }}
            >
                {/* Layer 2: Hand Tracking (invisible) */}
                <HandLandmarkerComponent
                    videoElement={videoElement}
                    onResults={handleHandResults}
                    onReady={handleTrackingReady}
                />

                {/* Layer 3: Debug Overlay (2D canvas) */}
                <DebugOverlay
                    handsRef={handsRef} // Passing Ref
                    width={fitWidth}
                    height={fitHeight}
                    videoWidth={videoElement?.videoWidth}
                    videoHeight={videoElement?.videoHeight}
                    show={showDebug}
                />

                {/* Layer 4: 3D Scene (R3F Canvas) */}
                <div className="scene-layer" style={{ width: '100%', height: '100%' }}>
                    <Scene rotation={sceneRotation} zoom={cameraZoom}>
                        {/* Interaction Logic lives INSIDE the scene now */}
                        <InteractionManager
                            handsRef={handsRef}
                            width={fitWidth}
                            height={fitHeight}
                            videoWidth={videoElement?.videoWidth || 1280}
                            videoHeight={videoElement?.videoHeight || 720}
                        />

                        <Lights />
                        <VoxelWorld />

                        {/* Grid Highlight - visible logic handled internally */}
                        <GridHighlight visible={true} />

                        {/* Ground plane for reference */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                            <planeGeometry args={[40, 40]} />
                            <meshStandardMaterial
                                color="#1a1a2e"
                                transparent
                                opacity={0.3}
                            />
                        </mesh>

                        {/* Grid helper */}
                        <gridHelper args={[20, 20, '#00FFFF', '#333333']} />
                    </Scene>
                </div>
            </div>

            {/* Layer 5: UI Overlay (Full Screen) */}
            <RetroOverlay isReady={isReady} fps={fps} />

            {/* Loading Screen - waits for EVERYTHING */}
            <LoadingScreen isReady={allReady} />

            {/* Toast Notifications */}
            <ToastContainer />

            <style jsx>{`
        .voxel-app {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #000;
        }

        .camera-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .scene-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
          pointer-events: none;
        }
      `}</style>
        </main>
    );
}
