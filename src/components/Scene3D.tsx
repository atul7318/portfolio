"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo } from "react";

/* ── Hero Neural Network (Optimized) ── */
function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  const count = 80; // reduced from 180
  const threshold = 30;
  const maxLines = 300; // pre-allocate buffer for max lines

  const { positions, velocities } = useMemo(() => {
    const pos: number[] = [];
    const vel: number[] = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 25 + Math.random() * 40;
      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      vel.push(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.02
      );
    }
    return { positions: new Float32Array(pos), velocities: vel };
  }, []);

  // Pre-allocate line buffer once — no GC pressure
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), []);
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(linePositions, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    geo.setDrawRange(0, 0);
    return geo;
  }, [linePositions]);

  const lineMaterial = useMemo(
    () => new THREE.LineBasicMaterial({ color: 0x0078ff, transparent: true, opacity: 0.2 }),
    []
  );

  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const frameRef = useRef(0);

  useFrame(({ camera }) => {
    if (!pointsRef.current) return;
    frameRef.current++;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      const dist = Math.sqrt(pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2 + pos[i * 3 + 2] ** 2);
      if (dist > 65 || dist < 15) {
        velocities[i * 3] *= -1;
        velocities[i * 3 + 1] *= -1;
        velocities[i * 3 + 2] *= -1;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += 0.001;
    pointsRef.current.rotation.x += 0.0005;

    // Update connections every 10 frames using pre-allocated buffer
    if (lineRef.current && frameRef.current % 10 === 0) {
      let idx = 0;
      for (let i = 0; i < count && idx < maxLines; i++) {
        for (let j = i + 1; j < count && idx < maxLines; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq < threshold * threshold) {
            const o = idx * 6;
            linePositions[o] = pos[i * 3];
            linePositions[o + 1] = pos[i * 3 + 1];
            linePositions[o + 2] = pos[i * 3 + 2];
            linePositions[o + 3] = pos[j * 3];
            linePositions[o + 4] = pos[j * 3 + 1];
            linePositions[o + 5] = pos[j * 3 + 2];
            idx++;
          }
        }
      }
      lineGeometry.setDrawRange(0, idx * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineRef.current.rotation.copy(pointsRef.current.rotation);
    }

    // Mouse parallax
    camera.position.x += (mouseRef.current.x * 15 - camera.position.x) * 0.02;
    camera.position.y += (mouseRef.current.y * 10 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={0x00d4ff} size={1.4} transparent opacity={0.7} sizeAttenuation />
      </points>
      <lineSegments ref={lineRef} geometry={lineGeometry} material={lineMaterial} />
    </group>
  );
}

/* ── About Section Sphere (Optimized) ── */
function WireframeSphere() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const orbitPositions = useMemo(() => {
    const arr = new Float32Array(30 * 3); // reduced from 60
    for (let i = 0; i < 30; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 0.3;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.003;
    if (ringRef.current) ringRef.current.rotation.z += 0.005;
  });

  return (
    <group ref={groupRef}>
      {/* Outer wireframe */}
      <mesh>
        <sphereGeometry args={[2, 20, 20]} />
        <meshBasicMaterial color={0x0078ff} wireframe transparent opacity={0.15} />
      </mesh>
      {/* Inner wireframe */}
      <mesh>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshBasicMaterial color={0x00d4ff} wireframe transparent opacity={0.08} />
      </mesh>
      {/* Orbiting particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbitPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={0x00d4ff} size={0.05} transparent opacity={0.8} />
      </points>
      {/* Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.5, 0.008, 6, 64]} />
        <meshBasicMaterial color={0x7b2fff} transparent opacity={0.45} />
      </mesh>
      {/* Second ring */}
      <mesh rotation={[Math.PI / 5, 0, Math.PI / 4]}>
        <torusGeometry args={[1.8, 0.006, 6, 48]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

/* ── Pause rendering when off-screen ── */
function FrameControl() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gl.setAnimationLoop(gl.render.bind(gl) as () => void);
        } else {
          gl.setAnimationLoop(null);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [gl]);
  return null;
}

/* ── Scene3D Component ── */
export default function Scene3D({ type }: { type: "hero" | "sphere" }) {
  if (type === "hero") {
    return (
      <Canvas
        camera={{ position: [0, 0, 80], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <NeuralNetwork />
        <FrameControl />
      </Canvas>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      style={{ width: "100%", height: "100%" }}
    >
      <WireframeSphere />
      <FrameControl />
    </Canvas>
  );
}
