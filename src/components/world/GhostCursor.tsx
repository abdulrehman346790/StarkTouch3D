'use client';
// ============================================
// Ghost Cursor - Follows Index Finger Like Gun Sight
// ============================================

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MathUtils, BoxGeometry } from 'three';
import { useRawCursorPosition, useMode } from '../../store/useVoxelStore';

interface GhostCursorProps {
    visible?: boolean;
}

export default function GhostCursor({ visible = true }: GhostCursorProps) {
    const meshRef = useRef<Mesh>(null);
    const rawPosition = useRawCursorPosition(); // Follows finger exactly
    const mode = useMode();

    useFrame(() => {
        if (!meshRef.current) return;

        // Smooth but fast interpolation - cursor follows finger like gun sight
        const lerpFactor = 0.3; // Higher = more responsive
        meshRef.current.position.x = MathUtils.lerp(
            meshRef.current.position.x,
            rawPosition.x,
            lerpFactor
        );
        meshRef.current.position.y = MathUtils.lerp(
            meshRef.current.position.y,
            rawPosition.y,
            lerpFactor
        );
        meshRef.current.position.z = MathUtils.lerp(
            meshRef.current.position.z,
            rawPosition.z,
            lerpFactor
        );

        // Subtle pulsing animation
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.08;
        meshRef.current.scale.setScalar(pulse);
    });

    if (!visible) return null;

    // Color based on mode: Cyan crosshair for BUILD, Blue for NAVIGATE
    const color = mode === 'BUILD' ? '#00FFFF' : '#4169E1';

    return (
        <group>
            {/* Main cursor - small crosshair style */}
            <mesh ref={meshRef}>
                {/* Inner solid cube */}
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Outer ring / crosshair effect */}
            <mesh ref={meshRef} position={[rawPosition.x, rawPosition.y, rawPosition.z]}>
                <ringGeometry args={[0.4, 0.5, 16]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.6}
                    side={2} // DoubleSide
                />
            </mesh>
        </group>
    );
}
