'use client';

import dynamic from 'next/dynamic';

// Dynamic import for client-side only rendering
const VoxelHandAR = dynamic(
  () => import('@/components/VoxelHandAR'),
  { ssr: false }
);

export default function Home() {
  return <VoxelHandAR />;
}
