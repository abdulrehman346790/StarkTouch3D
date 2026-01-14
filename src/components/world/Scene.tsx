'use client';
// ============================================
// Scene Component - R3F Canvas Setup with Navigation
// ============================================

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { ReactNode, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';

interface SceneProps {
    children: ReactNode;
    rotation?: { x: number; y: number };
    zoom?: number;
}

// Inner component to handle navigation animation
function NavigableWorld({
    children,
    rotation,
}: {
    children: ReactNode;
    rotation: { x: number; y: number };
}) {
    const groupRef = useRef<Group>(null);

    useFrame(() => {
        if (!groupRef.current) return;

        // Smooth rotation with lerp
        groupRef.current.rotation.x = MathUtils.lerp(
            groupRef.current.rotation.x,
            rotation.x,
            0.1
        );
        groupRef.current.rotation.y = MathUtils.lerp(
            groupRef.current.rotation.y,
            rotation.y,
            0.1
        );
    });

    return <group ref={groupRef}>{children}</group>;
}

// Camera controller for zoom
function CameraController({ zoom }: { zoom: number }) {
    useFrame(({ camera }) => {
        // Smooth zoom with lerp
        const targetZ = zoom;
        camera.position.z = MathUtils.lerp(camera.position.z, targetZ, 0.1);
    });

    return null;
}

export default function Scene({
    children,
    rotation = { x: 0, y: 0 },
    zoom = 15,
}: SceneProps) {
    return (
        <Canvas
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                background: 'transparent',
            }}
            gl={{ alpha: true }}
        >
            <PerspectiveCamera makeDefault position={[0, 5, zoom]} fov={60} />
            <CameraController zoom={zoom} />

            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00FFFF" />

            <NavigableWorld rotation={rotation}>{children}</NavigableWorld>
        </Canvas>
    );
}
