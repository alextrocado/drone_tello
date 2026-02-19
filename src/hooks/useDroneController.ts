import { useDroneStore } from '../store';

export const useDroneController = () => {
  const { updateDrone, addLog } = useDroneStore();

  // Helper to get current drone state
  const getDrone = () => useDroneStore.getState().drone;

  // Wait until drone reaches target (or timeout)
  const waitForCompletion = async (targetType: 'position' | 'yaw' | 'takeoff' | 'land', timeoutMs = 5000) => {
    const start = Date.now();
    return new Promise<void>((resolve) => {
      const check = setInterval(() => {
        const drone = getDrone();
        const now = Date.now();
        
        let completed = false;
        
        if (targetType === 'takeoff') {
            if (drone.z >= 95) completed = true; // Close to 100cm
        } else if (targetType === 'land') {
            if (drone.z <= 5) completed = true;
        } else if (targetType === 'position') {
            const dx = drone.target.x - drone.x;
            const dy = drone.target.y - drone.y;
            const dz = drone.target.z - drone.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 5) completed = true; // Within 5cm
        } else if (targetType === 'yaw') {
            let diff = Math.abs(drone.target.yaw - drone.yaw);
            if (diff > 180) diff = 360 - diff;
            if (diff < 2) completed = true; // Within 2 degrees
        }

        if (completed || (now - start > timeoutMs)) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  };

  const tello = {
    takeoff: async () => {
      addLog('Taking off...');
      const drone = getDrone();
      updateDrone({ 
          isFlying: true, 
          target: { ...drone.target, z: 100 } // Target 1m height
      });
      await waitForCompletion('takeoff');
      
      // Do not reset path after takeoff, so we see the ascent
      // const currentDrone = getDrone();
      // useDroneStore.getState().setPath([{ x: currentDrone.x, y: currentDrone.y, z: currentDrone.z }]);
      
      addLog('Takeoff complete.');
    },
    land: async () => {
      addLog('Landing...');
      const drone = getDrone();
      updateDrone({ 
          target: { ...drone.target, z: 0 } 
      });
      await waitForCompletion('land');
      updateDrone({ isFlying: false });
      addLog('Landed.');
    },
    forward: async (dist: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Error: Cannot move while on ground.'); return; }
      addLog(`Forward ${dist}cm`);
      
      const yawRad = (drone.yaw * Math.PI) / 180;
      const dx = dist * Math.sin(yawRad);
      const dy = dist * Math.cos(yawRad);

      updateDrone({
          target: {
              ...drone.target,
              x: drone.target.x + dx,
              y: drone.target.y + dy
          }
      });
      await waitForCompletion('position');
    },
    back: async (dist: number) => {
      await tello.forward(-dist);
    },
    left: async (dist: number) => {
        const drone = getDrone();
        if (!drone.isFlying) { addLog('Error: Cannot move while on ground.'); return; }
        addLog(`Left ${dist}cm`);
        
        const yawRad = ((drone.yaw - 90) * Math.PI) / 180;
        const dx = dist * Math.sin(yawRad);
        const dy = dist * Math.cos(yawRad);
        
        updateDrone({
            target: {
                ...drone.target,
                x: drone.target.x + dx,
                y: drone.target.y + dy
            }
        });
        await waitForCompletion('position');
    },
    right: async (dist: number) => {
        const drone = getDrone();
        if (!drone.isFlying) { addLog('Error: Cannot move while on ground.'); return; }
        addLog(`Right ${dist}cm`);

        const yawRad = ((drone.yaw + 90) * Math.PI) / 180;
        const dx = dist * Math.sin(yawRad);
        const dy = dist * Math.cos(yawRad);
        
        updateDrone({
            target: {
                ...drone.target,
                x: drone.target.x + dx,
                y: drone.target.y + dy
            }
        });
        await waitForCompletion('position');
    },
    up: async (dist: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Error: Cannot move while on ground.'); return; }
      addLog(`Up ${dist}cm`);
      updateDrone({
          target: { ...drone.target, z: drone.target.z + dist }
      });
      await waitForCompletion('position');
    },
    down: async (dist: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Error: Cannot move while on ground.'); return; }
      addLog(`Down ${dist}cm`);
      updateDrone({
          target: { ...drone.target, z: Math.max(0, drone.target.z - dist) }
      });
      await waitForCompletion('position');
    },
    rotate: async (dir: 'cw' | 'ccw', deg: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Error: Cannot move while on ground.'); return; }
      addLog(`Rotate ${dir} ${deg}°`);
      
      const change = dir === 'cw' ? deg : -deg;
      updateDrone({
          target: { ...drone.target, yaw: drone.target.yaw + change }
      });
      await waitForCompletion('yaw');
    },
    flip: async (dir: string) => {
      addLog(`Flip ${dir} (Simulated)`);
      // Flips are hard to physics sim with just position targets, 
      // but we could animate it visually or just skip physics for the flip duration
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  return tello;
};
