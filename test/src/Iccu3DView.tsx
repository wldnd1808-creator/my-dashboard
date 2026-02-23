'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/** ICCU 부품 하나: 상자 + 조립/분해 위치, 클릭 시 빨간 Emissive */
function PartBox({
  basePosition,
  explodeOffset,
  size,
  explodeProgressRef,
  isSelected,
  onClick,
}: {
  basePosition: [number, number, number];
  explodeOffset: [number, number, number];
  size: [number, number, number];
  explodeProgressRef: React.MutableRefObject<number>;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const posRef = useRef(new THREE.Vector3(...basePosition));
  const targetPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!meshRef.current) return;
    const p = explodeProgressRef.current;
    targetPos.current.set(
      basePosition[0] + explodeOffset[0] * p,
      basePosition[1] + explodeOffset[1] * p,
      basePosition[2] + explodeOffset[2] * p
    );
    posRef.current.lerp(targetPos.current, 0.08);
    meshRef.current.position.copy(posRef.current);
  });

  return (
    <mesh
      ref={meshRef}
      position={basePosition}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={isSelected ? '#660000' : '#2a2a2a'}
        emissive={isSelected ? '#ff2222' : '#000000'}
        emissiveIntensity={isSelected ? 0.9 : 0}
        metalness={0.4}
        roughness={0.6}
      />
    </mesh>
  );
}

/** ICCU 조립체: Box 5~6개로 임시 형태 */
const PARTS: Array<{
  name: string;
  basePosition: [number, number, number];
  explodeOffset: [number, number, number];
  size: [number, number, number];
}> = [
  { name: 'main', basePosition: [0, 0, 0], explodeOffset: [0, 0, 0], size: [1.2, 0.8, 0.6] },
  { name: 'connector1', basePosition: [0.4, 0.35, 0], explodeOffset: [0.6, 0.5, 0], size: [0.35, 0.25, 0.5] },
  { name: 'connector2', basePosition: [-0.4, 0.35, 0], explodeOffset: [-0.6, 0.5, 0], size: [0.35, 0.25, 0.5] },
  { name: 'cell1', basePosition: [0.5, -0.25, 0.2], explodeOffset: [0.7, 0, 0.4], size: [0.3, 0.4, 0.25] },
  { name: 'cell2', basePosition: [-0.5, -0.25, 0.2], explodeOffset: [-0.7, 0, 0.4], size: [0.3, 0.4, 0.25] },
  { name: 'top', basePosition: [0, 0.55, 0], explodeOffset: [0, 0.8, 0], size: [0.7, 0.2, 0.5] },
];

function Scene({
  isExploded,
  selectedPart,
  onSelectPart,
}: {
  isExploded: boolean;
  selectedPart: string | null;
  onSelectPart: (name: string | null) => void;
}) {
  const progressRef = useRef(isExploded ? 1 : 0);
  useFrame(() => {
    const target = isExploded ? 1 : 0;
    progressRef.current += (target - progressRef.current) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, 2]} intensity={0.5} />
      {PARTS.map((p) => (
        <PartBox
          key={p.name}
          basePosition={p.basePosition}
          explodeOffset={p.explodeOffset}
          size={p.size}
          explodeProgressRef={progressRef}
          isSelected={selectedPart === p.name}
          onClick={() => onSelectPart(selectedPart === p.name ? null : p.name)}
        />
      ))}
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </>
  );
}

/** explodeProgress를 매 프레임 Scene에 전달하려면 부모에서 구독이 필요함. useRef만으로는 리렌더가 안 되므로, Scene 내부에서 isExploded를 직접 사용해 보간. */
function SceneWithProgress({
  isExploded,
  selectedPart,
  onSelectPart,
}: {
  isExploded: boolean;
  selectedPart: string | null;
  onSelectPart: (name: string | null) => void;
}) {
  return (
    <Scene
      isExploded={isExploded}
      selectedPart={selectedPart}
      onSelectPart={onSelectPart}
    />
  );
}

export type Iccu3DViewProps = {
  isExploded?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

export function Iccu3DView({ isExploded = false, style, className }: Iccu3DViewProps) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, ...style }} className={className}>
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 50 }} gl={{ antialias: true }}>
        <SceneWithProgress
          isExploded={isExploded}
          selectedPart={selectedPart}
          onSelectPart={setSelectedPart}
        />
      </Canvas>
    </div>
  );
}
