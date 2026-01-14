'use client';
// ============================================
// Grid Highlight - Shows which grid block is selected
// The "Snapped Highlight" that glows when cursor enters a grid cell
// ============================================

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MathUtils, BoxGeometry, EdgesGeometry, LineBasicMaterial } from 'three';
import { useCursorPosition, useMode } from '../../store/useVoxelStore';

interface GridHighlightProps {
    visible?: boolean;
}

export default function GridHighlight({ visible = true }: GridHighlightProps) {
    const meshRef = useRef<Mesh>(null);
    const snappedPosition = useCursorPosition(); // Already snapped to grid
    const mode = useMode();

    // Current position for smooth transition
    const currentPos = useRef({ x: 0, y: 0, z: 0 });

    // Edge geometry for retro outlines
    const edgeGeometry = useMemo(() => new EdgesGeometry(new BoxGeometry(1, 1, 1)), []);
    const edgeMaterial = useMemo(
        () => new LineBasicMaterial({ color: '#00FFFF', linewidth: 2, transparent: true, opacity: 0.8 }),
        []
    );

    useFrame(() => {
        if (!meshRef.current) return;

        // ============================================
        // 3. THE VISUAL: Snapped Highlight (Grid Chamak)
        // Smoothly move highlight to the snapped grid position
        // ============================================
        const lerpFactor = 0.3; // Quick but smooth transition

        currentPos.current.x = MathUtils.lerp(
            currentPos.current.x,
            snappedPosition.x,
            lerpFactor
        );
        currentPos.current.y = MathUtils.lerp(
            currentPos.current.y,
            snappedPosition.y,
            lerpFactor
        );
        currentPos.current.z = MathUtils.lerp(
            currentPos.current.z,
            snappedPosition.z,
            lerpFactor
        );

        meshRef.current.position.set(
            currentPos.current.x,
            currentPos.current.y,
            currentPos.current.z
        );

        // Subtle pulsing glow effect
        const pulse = 0.8 + Math.sin(Date.now() * 0.006) * 0.2;
        meshRef.current.scale.setScalar(pulse);
    });

    if (!visible) return null;

    // Only show in BUILD or ERASE mode
    if (mode !== 'BUILD' && mode !== 'ERASE') return null;

    const isErase = mode === 'ERASE';
    const mainColor = isErase ? '#FF0000' : '#00FFFF';

    return (
        <group>
            {/* Outer glowing wireframe cube */}
            <mesh ref={meshRef}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={mainColor}
                    transparent
                    opacity={0.15}
                    emissive={mainColor}
                    emissiveIntensity={0.3}
                />
            </mesh>

            {/* Edge highlight */}
            <mesh position={[snappedPosition.x, snappedPosition.y, snappedPosition.z]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial
                    color={mainColor}
                    wireframe
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </group>
    );
}
