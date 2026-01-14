'use client';
// ============================================
// Voxel World - Minecraft Grass Block (GLB Model)
// ============================================

import { useRef, useMemo, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import {
    InstancedMesh,
    Object3D,
    Mesh,
    BufferGeometry,
    Material,
    MeshLambertMaterial,
    EdgesGeometry,
    LineBasicMaterial,
    BoxGeometry,
} from 'three';
import { useBlocks, useVoxelStore } from '../../store/useVoxelStore';

const MAX_BLOCKS = 2000;
const dummy = new Object3D();

// Preload the model
useGLTF.preload('/models/grass_block.glb');

export default function VoxelWorld() {
    const meshRef = useRef<InstancedMesh>(null);
    const blocks = useBlocks();
    const [modelReady, setModelReady] = useState(false);
    const setModelLoaded = useVoxelStore((state) => state.setModelLoaded);

    // Load the GLB model
    const gltf = useGLTF('/models/grass_block.glb');

    // Extract geometry and material from the loaded model
    const { geometry, material } = useMemo(() => {
        let geo: BufferGeometry = new BoxGeometry(0.92, 0.92, 0.92);
        let mat: Material | Material[] = new MeshLambertMaterial({ color: '#5D9E3E' });

        if (gltf && gltf.scene) {
            gltf.scene.traverse((child) => {
                if (child instanceof Mesh && child.geometry && child.material) {
                    geo = child.geometry.clone(); // Clone to avoid issues
                    mat = child.material;
                }
            });
            setModelReady(true);
            setModelLoaded(true); // Update global store
        }

        return { geometry: geo, material: mat };
    }, [gltf, setModelLoaded]);

    // Edge geometry for outlines
    const edgeGeometry = useMemo(() => new EdgesGeometry(new BoxGeometry(0.92, 0.92, 0.92)), []);
    const edgeMaterial = useMemo(
        () =>
            new LineBasicMaterial({
                color: '#000000',
                linewidth: 1,
                transparent: true,
                opacity: 0.3,
            }),
        []
    );

    // Update instance matrices when blocks change
    useEffect(() => {
        if (!meshRef.current) return;

        const mesh = meshRef.current;

        blocks.forEach((block, i) => {
            dummy.position.set(
                block.position.x,
                block.position.y,
                block.position.z
            );
            // Scale down if GLB is larger than expected
            dummy.scale.set(0.5, 0.5, 0.5);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        });

        // Hide unused instances
        for (let i = blocks.length; i < MAX_BLOCKS; i++) {
            dummy.position.set(0, -1000, 0);
            dummy.scale.set(0.5, 0.5, 0.5);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    }, [blocks, modelReady]);

    // Don't render until model is ready
    if (!modelReady) return null;

    return (
        <>
            <instancedMesh
                ref={meshRef}
                args={[geometry, material as Material, MAX_BLOCKS]}
                castShadow
                receiveShadow
            />

            {/* Black edge outlines */}
            {blocks.map((block) => (
                <lineSegments
                    key={block.id}
                    position={[block.position.x, block.position.y, block.position.z]}
                    geometry={edgeGeometry}
                    material={edgeMaterial}
                    scale={[0.5, 0.5, 0.5]}
                />
            ))}
        </>
    );
}

