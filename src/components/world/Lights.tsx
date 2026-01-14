'use client';
// ============================================
// Lights Component - Scene Lighting Setup
// ============================================

import { useRef } from 'react';
import { useHelper } from '@react-three/drei';
import { DirectionalLight, DirectionalLightHelper } from 'three';

interface LightsProps {
    debug?: boolean;
}

export default function Lights({ debug = false }: LightsProps) {
    const directionalRef = useRef<DirectionalLight>(null);

    // Show light helper in debug mode
    // useHelper(debug && directionalRef, DirectionalLightHelper, 1, '#FFFF00');

    return (
        <>
            {/* Ambient for base illumination */}
            <ambientLight intensity={0.4} color="#FFFFFF" />

            {/* Main directional light (sun-like) */}
            <directionalLight
                ref={directionalRef}
                position={[10, 15, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />

            {/* Accent lights for retro vibe */}
            <pointLight position={[-10, 5, -10]} intensity={0.5} color="#00FFFF" />
            <pointLight position={[10, 5, -10]} intensity={0.5} color="#FF00FF" />
            <pointLight position={[0, -5, 10]} intensity={0.3} color="#FFFF00" />

            {/* Fill light from below */}
            <hemisphereLight
                color="#87CEEB"
                groundColor="#362D26"
                intensity={0.3}
            />
        </>
    );
}
