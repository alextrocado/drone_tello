import { useEffect, useRef } from 'react';
import { useDroneStore } from '../store';

const GRAVITY = 9.81; // m/s^2
const ROTATION_SPEED = 90; // degrees per second
const MAX_TILT = 25; // degrees

export const usePhysicsEngine = () => {
    // Use selector to avoid re-renders on every state change, we only need the update function
    const updateDrone = useDroneStore((state) => state.updateDrone);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const animate = () => {
            const now = Date.now();
            // Cap dt to prevent huge jumps if tab is backgrounded
            const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); 
            lastTimeRef.current = now;

            const state = useDroneStore.getState();
            const { drone } = state;

            if (drone.isFlying) {
                // --- Rotation ---
                let newYaw = drone.yaw;
                // Normalize target yaw diff
                let diff = (drone.target.yaw - drone.yaw) % 360;
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                if (Math.abs(diff) > 0.5) {
                    const sign = Math.sign(diff);
                    const step = ROTATION_SPEED * dt;
                    if (Math.abs(diff) < step) newYaw = drone.target.yaw;
                    else newYaw += sign * step;
                }

                // --- Position (PID) ---
                // Convert to meters
                const pos = { x: drone.x / 100, y: drone.y / 100, z: drone.z / 100 };
                const target = { x: drone.target.x / 100, y: drone.target.y / 100, z: drone.target.z / 100 };
                const vel = drone.velocity;

                // Error
                const ex = target.x - pos.x;
                const ey = target.y - pos.y;
                const ez = target.z - pos.z;

                // Gains
                const Kp = 1.5; // Position gain
                const Kv = 2.5; // Velocity damping

                // Desired Vel
                // Use speedSetting from store (cm/s) converted to m/s
                const MAX_SPEED = (drone.speedSetting || 10) / 100; 
                let vDesX = ex * Kp;
                let vDesY = ey * Kp;
                let vDesZ = ez * Kp;

                // Clamp speed
                const speed = Math.sqrt(vDesX**2 + vDesY**2 + vDesZ**2);
                if (speed > MAX_SPEED) {
                    const scale = MAX_SPEED / speed;
                    vDesX *= scale;
                    vDesY *= scale;
                    vDesZ *= scale;
                }

                // Acceleration (Force)
                const ax = (vDesX - vel.x) * Kv;
                const ay = (vDesY - vel.y) * Kv;
                const az = (vDesZ - vel.z) * Kv;

                // Integrate
                const newVelX = vel.x + ax * dt;
                const newVelY = vel.y + ay * dt;
                const newVelZ = vel.z + az * dt;

                const newPosX = pos.x + newVelX * dt;
                const newPosY = pos.y + newVelY * dt;
                const newPosZ = pos.z + newVelZ * dt;

                // --- Tilt Calculation ---
                // Convert global acceleration to local frame for tilt
                const yawRad = (newYaw * Math.PI) / 180;
                
                const fwdX = Math.sin(yawRad);
                const fwdY = Math.cos(yawRad);
                const rightX = Math.cos(yawRad);
                const rightY = -Math.sin(yawRad);

                const accelFwd = ax * fwdX + ay * fwdY;
                const accelRight = ax * rightX + ay * rightY;

                // Tilt logic:
                // Accelerating Forward -> Nose down -> Pitch negative
                // Accelerating Right -> Roll Right -> Roll negative
                const pitch = -accelFwd * 15; 
                const roll = -accelRight * 15;

                // Clamp tilt
                const clampedPitch = Math.max(-MAX_TILT, Math.min(MAX_TILT, pitch));
                const clampedRoll = Math.max(-MAX_TILT, Math.min(MAX_TILT, roll));

                updateDrone({
                    x: newPosX * 100,
                    y: newPosY * 100,
                    z: newPosZ * 100,
                    yaw: newYaw,
                    velocity: { x: newVelX, y: newVelY, z: newVelZ },
                    tilt: { pitch: clampedPitch, roll: clampedRoll }
                });

            } else {
                // Gravity when not flying
                if (drone.z > 0) {
                    const velZ = drone.velocity.z - GRAVITY * dt;
                    const newZ = Math.max(0, drone.z / 100 + velZ * dt);
                    updateDrone({
                        z: newZ * 100,
                        velocity: { ...drone.velocity, z: velZ },
                        tilt: { pitch: 0, roll: 0 }
                    });
                    if (newZ === 0) {
                         updateDrone({ velocity: { x: 0, y: 0, z: 0 } });
                    }
                }
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        };
    }, [updateDrone]);
};
