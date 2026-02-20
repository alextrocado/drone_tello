import { useDroneStore } from '../store';

export const useDroneController = () => {
  const { updateDrone, addLog } = useDroneStore();

  // Helper to get current drone state
  const getDrone = () => useDroneStore.getState().drone;

  // Wait until drone reaches target (or timeout)
  const waitForCompletion = async (targetType: 'position' | 'yaw' | 'takeoff' | 'land', timeoutMs = 30000) => {
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

        if (completed) {
          clearInterval(check);
          resolve();
        } else if (now - start > timeoutMs) {
          clearInterval(check);
          addLog(`Aviso: Tempo limite excedido para ${targetType}`);
          resolve();
        }
      }, 100);
    });
  };

  const tello = {
    takeoff: async () => {
      addLog('A descolar...');
      const drone = getDrone();
      updateDrone({ 
          isFlying: true, 
          target: { ...drone.target, z: 100 } // Target 1m height
      });
      await waitForCompletion('takeoff');
      
      // Do not reset path after takeoff, so we see the ascent
      // const currentDrone = getDrone();
      // useDroneStore.getState().setPath([{ x: currentDrone.x, y: currentDrone.y, z: currentDrone.z }]);
      
      addLog('Descolagem completa.');
    },
    land: async () => {
      addLog('A aterrar...');
      const drone = getDrone();
      updateDrone({ 
          target: { ...drone.target, z: 0 } 
      });
      await waitForCompletion('land');
      updateDrone({ isFlying: false });
      addLog('Aterrou.');
    },
    forward: async (dist: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
      addLog(`Frente ${dist}cm`);
      
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
        if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
        addLog(`Esquerda ${dist}cm`);
        
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
        if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
        addLog(`Direita ${dist}cm`);

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
      if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
      addLog(`Cima ${dist}cm`);
      updateDrone({
          target: { ...drone.target, z: drone.target.z + dist }
      });
      await waitForCompletion('position');
    },
    down: async (dist: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
      addLog(`Baixo ${dist}cm`);
      updateDrone({
          target: { ...drone.target, z: Math.max(0, drone.target.z - dist) }
      });
      await waitForCompletion('position');
    },
    rotate: async (dir: 'cw' | 'ccw', deg: number) => {
      const drone = getDrone();
      if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
      addLog(`Rodar ${dir} ${deg}°`);
      
      const change = dir === 'cw' ? deg : -deg;
      updateDrone({
          target: { ...drone.target, yaw: drone.target.yaw + change }
      });
      await waitForCompletion('yaw');
    },
    flip: async (dir: string) => {
      addLog(`Acrobacia ${dir} (Simulado)`);
      // Flips are hard to physics sim with just position targets, 
      // but we could animate it visually or just skip physics for the flip duration
      await new Promise(r => setTimeout(r, 1000));
    },
    set_speed: async (speed: number) => {
        if (speed < 10 || speed > 100) {
            addLog('Aviso: Velocidade deve estar entre 10 e 100 cm/s');
            speed = Math.max(10, Math.min(100, speed));
        }
        addLog(`Definir velocidade para ${speed} cm/s`);
        updateDrone({ speedSetting: speed });
        // In a real physics engine we would update max velocity here
    },
    get_battery: () => {
        const drone = getDrone();
        return drone.battery;
    },
    get_height: () => {
        const drone = getDrone();
        return Math.round(drone.z);
    },
    get_time: () => {
        // Simulated flight time
        return 0; 
    },
    go_xyz_speed: async (x: number, y: number, z: number, speed: number) => {
        const drone = getDrone();
        if (!drone.isFlying) { addLog('Erro: Não é possível mover no chão.'); return; }
        
        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(speed)) {
            addLog('Erro: Coordenadas ou velocidade inválidas.');
            return;
        }

        const validSpeed = Math.max(10, Math.min(100, speed));
        addLog(`Ir para x:${x} y:${y} z:${z} a ${validSpeed} cm/s`);
        
        updateDrone({ speedSetting: validSpeed });
        
        updateDrone({
            target: {
                x: drone.target.x + x,
                y: drone.target.y + y,
                z: drone.target.z + z,
                yaw: drone.target.yaw
            }
        });
        await waitForCompletion('position');
    },
    emergency: async () => {
        addLog('EMERGÊNCIA: Parar motores!');
        updateDrone({ isFlying: false });
    }
  };

  return tello;
};
