import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Circle, Line, Rect, Text, Group } from 'react-konva';
import { useDroneStore } from '../store';

// Drone Icon (Simple SVG representation or just a shape)
const DroneShape = ({ x, y, z, rotation, isFlying }: { x: number; y: number; z: number; rotation: number; isFlying: boolean }) => {
  // Scale based on height (simulated perspective)
  // Max height ~200cm? Scale 1.0 to 1.5
  const scale = isFlying ? 1 + Math.min(z, 200) / 500 : 1;
  const shadowOpacity = isFlying ? Math.max(0.1, 0.5 - z / 200) : 0;

  return (
    <Group x={x} y={y}>
      {/* Shadow (stays on ground) */}
      {isFlying && (
        <Circle 
            radius={15} 
            fill="black" 
            opacity={shadowOpacity} 
            scaleX={1} 
            scaleY={1}
        />
      )}

      {/* Drone Body (scales up with height) */}
      <Group rotation={rotation} scaleX={scale} scaleY={scale}>
        {/* Arms */}
        <Line points={[-15, -15, 15, 15]} stroke="#333" strokeWidth={4} />
        <Line points={[15, -15, -15, 15]} stroke="#333" strokeWidth={4} />

        {/* Propellers (animate if flying? Konva animation is tricky in functional component, keep static or simple) */}
        <Circle x={-15} y={-15} radius={8} fill={isFlying ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)"} stroke="#333" strokeWidth={1} />
        <Circle x={15} y={-15} radius={8} fill={isFlying ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)"} stroke="#333" strokeWidth={1} />
        <Circle x={-15} y={15} radius={8} fill={isFlying ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)"} stroke="#333" strokeWidth={1} />
        <Circle x={15} y={15} radius={8} fill={isFlying ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)"} stroke="#333" strokeWidth={1} />

        {/* Body */}
        <Circle radius={10} fill={isFlying ? "#ef4444" : "#64748b"} stroke="#fff" strokeWidth={2} />
        
        {/* Front Indicator */}
        <Rect x={-2} y={-12} width={4} height={8} fill="#fff" />
      </Group>

      {/* Status Label */}
      {!isFlying && (
          <Text 
            x={20} 
            y={-10} 
            text="ATERRADO" 
            fontSize={12} 
            fontFamily="sans-serif" 
            fill="#64748b" 
            fontStyle="bold"
            align="left"
          />
      )}
    </Group>
  );
};

export const Simulator: React.FC = () => {
  const { drone } = useDroneStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Center of the canvas
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Transform drone coordinates (cm) to canvas pixels
  const PIXELS_PER_CM = 1; 

  const canvasX = centerX + drone.x * PIXELS_PER_CM;
  const canvasY = centerY - drone.y * PIXELS_PER_CM; // Y is inverted in canvas (up is negative)

  const pathPoints = drone.path.flatMap(p => [
    centerX + p.x * PIXELS_PER_CM,
    centerY - p.y * PIXELS_PER_CM
  ]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 overflow-hidden relative">
      <Stage width={dimensions.width} height={dimensions.height} draggable>
        <Layer>
          {/* Grid */}
          <Grid width={dimensions.width} height={dimensions.height} centerX={centerX} centerY={centerY} />
          
          {/* Path Trace */}
          <Line
            points={pathPoints}
            stroke="#94a3b8"
            strokeWidth={2}
            dash={[10, 5]}
            lineCap="round"
            lineJoin="round"
          />

          {/* Drone */}
          <DroneShape 
            x={canvasX} 
            y={canvasY} 
            z={drone.z}
            rotation={drone.yaw} 
            isFlying={drone.isFlying}
          />

          {/* Info Text */}
          <Text 
            x={10} 
            y={10} 
            text={`ESTADO: ${drone.isFlying ? 'A VOAR' : 'ATERRADO'}\nVEL: ${drone.speedSetting || 10} cm/s\nX: ${drone.x.toFixed(0)} cm\nY: ${drone.y.toFixed(0)} cm\nZ: ${drone.z.toFixed(0)} cm\nYaw: ${drone.yaw.toFixed(0)}°`}
            fontSize={14}
            fontFamily="monospace"
            fill="#334155"
          />
        </Layer>
      </Stage>
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur p-2 rounded text-xs text-slate-500 pointer-events-none">
        1 quadrado = 50cm
      </div>
    </div>
  );
};

const Grid = ({ width, height, centerX, centerY }: { width: number; height: number; centerX: number; centerY: number }) => {
  const gridSize = 50; // 50px (50cm)
  const lines = [];

  // Vertical lines
  const startX = centerX % gridSize;
  for (let x = startX - gridSize; x < width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x.toFixed(2)}`}
        points={[x, 0, x, height]}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    );
  }

  // Horizontal lines
  const startY = centerY % gridSize;
  for (let y = startY - gridSize; y < height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y.toFixed(2)}`}
        points={[0, y, width, y]}
        stroke="#e2e8f0"
        strokeWidth={1}
      />
    );
  }

  // Axes
  lines.push(
    <Line key="xAxis" points={[0, centerY, width, centerY]} stroke="#cbd5e1" strokeWidth={2} />,
    <Line key="yAxis" points={[centerX, 0, centerX, height]} stroke="#cbd5e1" strokeWidth={2} />
  );

  return <Group>{lines}</Group>;
};
