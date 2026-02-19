import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Line } from '@react-three/drei';
import { useDroneStore } from '../store';
import * as THREE from 'three';

const Propeller = ({ position, clockwise = true }: { position: [number, number, number], clockwise?: boolean }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    const drone = useDroneStore.getState().drone;
    if (drone.isFlying && ref.current) {
      const speed = 40; 
      ref.current.rotation.y += delta * speed * (clockwise ? 1 : -1);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <boxGeometry args={[0.8, 0.02, 0.08]} />
        <meshStandardMaterial color="#111" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
         <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
         <meshStandardMaterial color="#silver" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const DroneModel = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const drone = useDroneStore.getState().drone;
    
    // Convert cm to 3D units (1 unit = 10cm)
    let x = drone.x / 10;
    let y = drone.z / 10;
    let z = -drone.y / 10;

    // Add hover bobbing effect when flying
    if (drone.isFlying) {
        y += Math.sin(state.clock.elapsedTime * 3) * 0.02;
    }

    groupRef.current.position.set(x, y, z);
    
    // Rotation
    const pitchRad = (drone.tilt?.pitch || 0) * Math.PI / 180;
    const rollRad = (drone.tilt?.roll || 0) * Math.PI / 180;
    const yawRad = -drone.yaw * Math.PI / 180;

    const euler = new THREE.Euler(pitchRad, yawRad, rollRad, 'YXZ');
    groupRef.current.setRotationFromEuler(euler);
  });

  return (
    <group ref={groupRef}> 
      {/* Main Body - Red Tello Style */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.5]} />
        <meshStandardMaterial color="#e11d23" roughness={0.3} />
      </mesh>
      
      {/* Top Cover - Glossy Red */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color="#ff3333" roughness={0.1} />
      </mesh>

      {/* Bottom Sensor/Battery Area - Black */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.4, 0.05, 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Front Camera */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0, 0.29]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        <meshStandardMaterial color="#000" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Arms & Motors */}
      {[
        { pos: [0.4, 0, 0.4], rot: [0, Math.PI/4, 0], cw: true },   // Front Left
        { pos: [-0.4, 0, 0.4], rot: [0, -Math.PI/4, 0], cw: false }, // Front Right
        { pos: [0.4, 0, -0.4], rot: [0, -Math.PI/4, 0], cw: false }, // Back Left
        { pos: [-0.4, 0, -0.4], rot: [0, Math.PI/4, 0], cw: true },  // Back Right
      ].map((arm, i) => (
        <group key={i} position={arm.pos as any}>
            {/* Arm Strut */}
            <mesh position={[0, -0.05, 0]} rotation={arm.rot as any}>
                <boxGeometry args={[0.6, 0.05, 0.08]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            
            {/* Motor Housing */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.25, 16]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Propeller */}
            <Propeller position={[0, 0.15, 0]} clockwise={arm.cw} />

            {/* Prop Guard (Simplified) */}
            <mesh position={[0, 0.05, 0]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.45, 0.02, 8, 32]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            
            {/* Feet */}
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
      ))}

      {/* Status LED */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.05, 0.02, 0.01]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

const Trail = () => {
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [settings, setSettings] = useState({ color: '#00ffff', width: 2, show: true });
  
  // Use refs to track current state without triggering re-renders inside useFrame
  const pointsRef = useRef<THREE.Vector3[]>([]);
  const settingsRef = useRef({ color: '#00ffff', width: 2, show: true });

  useFrame(() => {
    const state = useDroneStore.getState();
    const currentSettings = state.drone.trailSettings;
    
    // Check if settings changed
    if (
        currentSettings.color !== settingsRef.current.color || 
        currentSettings.width !== settingsRef.current.width || 
        currentSettings.show !== settingsRef.current.show
    ) {
        settingsRef.current = { ...currentSettings };
        setSettings({ ...currentSettings });
    }

    if (!currentSettings.show) return;

    // Update points
    const path = state.drone.path;
    
    if (path.length !== pointsRef.current.length) {
        const newPoints = path.map(p => new THREE.Vector3(p.x / 10, p.z / 10, -p.y / 10)); // Correct mapping: Z is -Y
        pointsRef.current = newPoints;
        setPoints(newPoints);
    }
  });

  if (!settings.show || points.length < 2) return null;

  return (
    <Line
      points={points}
      color={settings.color}
      lineWidth={settings.width}
      dashed={false}
    />
  );
};

export const ThreeSimulator: React.FC = () => {
  const environmentSettings = useDroneStore((state) => state.drone.environmentSettings);

  return (
    <div className="w-full h-full" style={{ backgroundColor: environmentSettings.backgroundColor }}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment key={environmentSettings.preset} preset={environmentSettings.preset} />
        
        {environmentSettings.showGrid && (
            <Grid infiniteGrid fadeDistance={50} sectionColor="#4f4f4f" cellColor="#2f2f2f" />
        )}
        
        <DroneModel />
        <Trail />

        <OrbitControls makeDefault />
      </Canvas>
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur p-2 rounded text-xs text-white pointer-events-none">
        3D View (1 unit = 10cm)
      </div>
    </div>
  );
};
