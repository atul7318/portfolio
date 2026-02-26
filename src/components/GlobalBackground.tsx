"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ═══════════════════════════════════════════════
   ✦  ELEGANT PARTICLE CONSTELLATION  ✦
   Minimal, clean — beautiful in dark & light
   ═══════════════════════════════════════════════ */

/* ── Star Particle Shaders ── */
const starVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScroll;
  uniform float uDark;

  attribute float aSize;
  attribute float aPhase;
  attribute float aBrightness;

  varying float vAlpha;
  varying float vBright;

  void main() {
    vec3 pos = position;

    // Very gentle organic drift
    pos.x += sin(uTime * 0.06 + aPhase * 6.28) * 1.2;
    pos.y += cos(uTime * 0.05 + aPhase * 4.5) * 0.8;

    // Scroll parallax — closer particles move faster
    float depthFactor = 1.0 + (pos.z + 60.0) * 0.01;
    pos.y -= uScroll * 0.004 * depthFactor;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    // Gentle breathing with occasional soft twinkle
    float breath = sin(uTime * 0.4 + aPhase * 6.28) * 0.15 + 0.85;
    float twinkle = pow(max(sin(uTime * 1.2 + aPhase * 30.0), 0.0), 12.0) * 0.4;

    float depth = smoothstep(-100.0, -5.0, mvPos.z);
    vAlpha = depth * (breath + twinkle) * aBrightness;
    vBright = aBrightness;

    float size = aSize * (breath + twinkle * 0.6);
    gl_PointSize = size * uPixelRatio * (50.0 / -mvPos.z);
    gl_PointSize = clamp(gl_PointSize, 0.5, 22.0);

    gl_Position = projectionMatrix * mvPos;
  }
`;

const starFrag = /* glsl */ `
  uniform float uDark;

  varying float vAlpha;
  varying float vBright;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // Crisp core + soft glow halo
    float core = smoothstep(0.5, 0.02, d);
    float glow = exp(-d * 4.0) * 0.55;

    // Dark mode: blue-white stars. Light mode: blue-indigo dots
    vec3 coreColor = mix(vec3(0.15, 0.30, 0.65), vec3(0.65, 0.78, 1.0), uDark);
    vec3 glowColor = mix(vec3(0.12, 0.18, 0.50), vec3(0.40, 0.55, 0.95), uDark);
    vec3 hotColor  = mix(vec3(0.30, 0.40, 0.80), vec3(0.90, 0.94, 1.0), uDark);

    vec3 color = mix(glowColor, coreColor, glow + core * 0.5);
    color = mix(color, hotColor, core * 0.6);

    float baseMult = mix(0.55, 0.75, uDark);
    float alpha = (core + glow) * vAlpha * baseMult;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ── Connection Line Shaders ── */
const lineVert = /* glsl */ `
  attribute float aProgress;
  attribute float aPulseId;
  attribute float aBaseAlpha;

  uniform float uTime;
  uniform float uScroll;

  varying float vProg;
  varying float vPulseId;
  varying float vBaseAlpha;

  void main() {
    vProg = aProgress;
    vPulseId = aPulseId;
    vBaseAlpha = aBaseAlpha;

    vec3 pos = position;
    pos.y -= uScroll * 0.004;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const lineFrag = /* glsl */ `
  uniform float uTime;
  uniform float uDark;

  varying float vProg;
  varying float vPulseId;
  varying float vBaseAlpha;

  void main() {
    // Elegant single pulse traveling along connection
    float speed = 0.12 + fract(vPulseId * 7.3) * 0.12;
    float p = fract(uTime * speed + vPulseId);
    float d = abs(vProg - p);
    d = min(d, 1.0 - d);
    float pulse = exp(-d * 20.0);

    // Subtle secondary reverse pulse
    float p2 = fract(-uTime * speed * 0.5 + vPulseId * 4.1);
    float d2 = abs(vProg - p2);
    d2 = min(d2, 1.0 - d2);
    float pulse2 = exp(-d2 * 14.0) * 0.25;

    float total = max(pulse, pulse2);

    // Dark: blue-cyan lines. Light: indigo-blue lines
    vec3 dim  = mix(vec3(0.10, 0.14, 0.35), vec3(0.20, 0.22, 0.45), uDark);
    vec3 bright = mix(vec3(0.20, 0.35, 0.70), vec3(0.40, 0.65, 1.0), uDark);
    vec3 hot  = mix(vec3(0.35, 0.45, 0.85), vec3(0.70, 0.85, 1.0), uDark);

    vec3 color = mix(dim, bright, total);
    color = mix(color, hot, total * total);

    float lineMult = mix(0.7, 1.0, uDark);
    float alpha = (vBaseAlpha * 0.018 + total * 0.22) * lineMult;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ── Soft Gradient Wash Shaders ── */
const washVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const washFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uSeed;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    float n1 = noise(center * 3.0 + uTime * 0.06 + uSeed) * 0.3;
    float n2 = noise(center * 5.0 - uTime * 0.04 + uSeed * 2.0) * 0.15;

    float blob = smoothstep(0.65, 0.0, dist + n1 + n2);
    blob = pow(blob, 2.0);

    float colorMix = noise(center * 2.0 + uTime * 0.03 + uSeed * 5.0);
    vec3 color = mix(uColor1, uColor2, colorMix);

    float breath = sin(uTime * 0.15 + uSeed * 6.28) * 0.12 + 0.88;

    float alpha = blob * uIntensity * breath;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════
   CONSTELLATION TOPOLOGY
   ═══════════════════════════════════════════════ */

function generateConstellation(count: number, maxDist: number) {
  const nodes: THREE.Vector3[] = [];

  const clusters = [
    { x: -38, y: 18, z: -12, r: 16 },
    { x: -8, y: -12, z: -18, r: 18 },
    { x: 22, y: 10, z: -14, r: 16 },
    { x: 40, y: -8, z: -20, r: 14 },
    { x: 5, y: 28, z: -22, r: 12 },
    { x: -25, y: -22, z: -16, r: 14 },
    { x: 32, y: 22, z: -24, r: 12 },
    { x: -12, y: -30, z: -18, r: 14 },
    { x: 50, y: 15, z: -26, r: 10 },
    { x: -45, y: -5, z: -20, r: 12 },
  ];

  for (let i = 0; i < count; i++) {
    const c = clusters[Math.floor(Math.random() * clusters.length)];
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * c.r;
    nodes.push(
      new THREE.Vector3(
        c.x + r * Math.sin(phi) * Math.cos(theta),
        c.y + r * Math.sin(phi) * Math.sin(theta),
        c.z + r * Math.cos(phi) * 0.4
      )
    );
  }

  const maxPer = 3;
  const counts = new Array(count).fill(0);
  const conns: { from: number; to: number }[] = [];

  for (let i = 0; i < count; i++) {
    const nearby: { j: number; d: number }[] = [];
    for (let j = i + 1; j < count; j++) {
      if (counts[j] >= maxPer) continue;
      const d = nodes[i].distanceTo(nodes[j]);
      if (d < maxDist) nearby.push({ j, d });
    }
    nearby.sort((a, b) => a.d - b.d);
    for (const { j } of nearby.slice(0, maxPer - counts[i])) {
      if (counts[i] >= maxPer) break;
      conns.push({ from: i, to: j });
      counts[i]++;
      counts[j]++;
    }
  }

  return { nodes, connections: conns };
}

/* ═══════════════════════════════════════════════
   SCENE COMPONENTS
   ═══════════════════════════════════════════════ */

type ScrollRef = React.RefObject<{ value: number }>;

/* — Star Particles — */
function Stars({
  nodes,
  scrollRef,
  isDark,
}: {
  nodes: THREE.Vector3[];
  scrollRef: ScrollRef;
  isDark: boolean;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, sizes, phases, brightnesses } = useMemo(() => {
    const pos = new Float32Array(nodes.length * 3);
    const siz = new Float32Array(nodes.length);
    const pha = new Float32Array(nodes.length);
    const bri = new Float32Array(nodes.length);
    for (let i = 0; i < nodes.length; i++) {
      pos[i * 3] = nodes[i].x;
      pos[i * 3 + 1] = nodes[i].y;
      pos[i * 3 + 2] = nodes[i].z;
      siz[i] = 1.2 + Math.random() * 2.8;
      pha[i] = Math.random();
      bri[i] = 0.4 + Math.random() * 0.6;
    }
    return { positions: pos, sizes: siz, phases: pha, brightnesses: bri };
  }, [nodes]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uScroll.value = scrollRef.current?.value ?? 0;
    matRef.current.uniforms.uDark.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uDark.value,
      isDark ? 1.0 : 0.0,
      0.05
    );
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aBrightness" args={[brightnesses, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={starVert}
        fragmentShader={starFrag}
        uniforms={{
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uDark: { value: isDark ? 1.0 : 0.0 },
          uPixelRatio: {
            value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
          },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* — Connection Lines — */
function ConnectionLines({
  nodes,
  connections,
  scrollRef,
  isDark,
}: {
  nodes: THREE.Vector3[];
  connections: { from: number; to: number }[];
  scrollRef: ScrollRef;
  isDark: boolean;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, progresses, pulseIds, baseAlphas } = useMemo(() => {
    const segs = 12;
    const vertCount = connections.length * segs * 2;
    const pos = new Float32Array(vertCount * 3);
    const prog = new Float32Array(vertCount);
    const pIds = new Float32Array(vertCount);
    const bAlpha = new Float32Array(vertCount);

    for (let c = 0; c < connections.length; c++) {
      const a = nodes[connections[c].from];
      const b = nodes[connections[c].to];
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      const perp = new THREE.Vector3(-dir.y, dir.x, dir.z * 0.3).normalize();
      const curveAmt = len * 0.12 * (Math.random() > 0.5 ? 1 : -1);
      mid.add(perp.multiplyScalar(curveAmt));

      const baseA = Math.max(0.0, 1.0 - len / 25.0);
      const pid = Math.random();
      const offset = c * segs * 2;

      for (let s = 0; s < segs; s++) {
        const t0 = s / segs;
        const t1 = (s + 1) / segs;

        const p0 = new THREE.Vector3()
          .copy(a).multiplyScalar((1 - t0) * (1 - t0))
          .add(mid.clone().multiplyScalar(2 * (1 - t0) * t0))
          .add(b.clone().multiplyScalar(t0 * t0));
        const p1 = new THREE.Vector3()
          .copy(a).multiplyScalar((1 - t1) * (1 - t1))
          .add(mid.clone().multiplyScalar(2 * (1 - t1) * t1))
          .add(b.clone().multiplyScalar(t1 * t1));

        const idx = offset + s * 2;
        pos[idx * 3] = p0.x;
        pos[idx * 3 + 1] = p0.y;
        pos[idx * 3 + 2] = p0.z;
        prog[idx] = t0;
        pIds[idx] = pid;
        bAlpha[idx] = baseA;

        pos[(idx + 1) * 3] = p1.x;
        pos[(idx + 1) * 3 + 1] = p1.y;
        pos[(idx + 1) * 3 + 2] = p1.z;
        prog[idx + 1] = t1;
        pIds[idx + 1] = pid;
        bAlpha[idx + 1] = baseA;
      }
    }

    return { positions: pos, progresses: prog, pulseIds: pIds, baseAlphas: bAlpha };
  }, [nodes, connections]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uScroll.value = scrollRef.current?.value ?? 0;
    matRef.current.uniforms.uDark.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uDark.value,
      isDark ? 1.0 : 0.0,
      0.05
    );
  });

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aProgress" args={[progresses, 1]} />
        <bufferAttribute attach="attributes-aPulseId" args={[pulseIds, 1]} />
        <bufferAttribute attach="attributes-aBaseAlpha" args={[baseAlphas, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={lineVert}
        fragmentShader={lineFrag}
        uniforms={{
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uDark: { value: isDark ? 1.0 : 0.0 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/* — Soft Gradient Washes — */
function GradientWash({
  position,
  scale,
  color1,
  color2,
  seed,
  intensity,
}: {
  position: [number, number, number];
  scale: number;
  color1: THREE.Color;
  color2: THREE.Color;
  seed: number;
  intensity: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={washVert}
        fragmentShader={washFrag}
        uniforms={{
          uTime: { value: 0 },
          uColor1: { value: color1 },
          uColor2: { value: color2 },
          uSeed: { value: seed },
          uIntensity: { value: intensity },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   SCENE ORCHESTRATOR
   ═══════════════════════════════════════════════ */

function ConstellationScene({
  scrollRef,
  isDark,
}: {
  scrollRef: ScrollRef;
  isDark: boolean;
}) {
  const mouseRef = useRef({ x: 0, y: 0 });
  const camSmooth = useRef({ x: 0, y: 0 });

  const { nodes, connections } = useMemo(
    () => generateConstellation(160, 20),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useFrame(({ camera }) => {
    camSmooth.current.x += (mouseRef.current.x * 3 - camSmooth.current.x) * 0.012;
    camSmooth.current.y += (mouseRef.current.y * 2 - camSmooth.current.y) * 0.012;
    camera.position.x = camSmooth.current.x;
    camera.position.y = camSmooth.current.y;
    camera.lookAt(0, 0, -18);
  });

  const washes = useMemo(() => {
    if (isDark) {
      return [
        { pos: [-28, 18, -50] as [number, number, number], scale: 55, c1: new THREE.Color(0x0a0a30), c2: new THREE.Color(0x1a1060), seed: 0, intensity: 0.10 },
        { pos: [30, -12, -55] as [number, number, number], scale: 50, c1: new THREE.Color(0x15083a), c2: new THREE.Color(0x2a1570), seed: 2.1, intensity: 0.07 },
        { pos: [5, 10, -45] as [number, number, number], scale: 40, c1: new THREE.Color(0x081028), c2: new THREE.Color(0x182860), seed: 4.2, intensity: 0.06 },
      ];
    }
    return [
      { pos: [-28, 18, -50] as [number, number, number], scale: 55, c1: new THREE.Color(0x4060c0), c2: new THREE.Color(0x5070d0), seed: 0, intensity: 0.03 },
      { pos: [30, -12, -55] as [number, number, number], scale: 50, c1: new THREE.Color(0x5050b0), c2: new THREE.Color(0x6060c0), seed: 2.1, intensity: 0.02 },
    ];
  }, [isDark]);

  return (
    <group>
      {/* Atmospheric gradient washes */}
      {washes.map((w, i) => (
        <GradientWash
          key={`${isDark}-${i}`}
          position={w.pos}
          scale={w.scale}
          color1={w.c1}
          color2={w.c2}
          seed={w.seed}
          intensity={w.intensity}
        />
      ))}

      {/* Constellation connections */}
      <ConnectionLines
        nodes={nodes}
        connections={connections}
        scrollRef={scrollRef}
        isDark={isDark}
      />

      {/* Star nodes */}
      <Stars nodes={nodes} scrollRef={scrollRef} isDark={isDark} />
    </group>
  );
}

/* ═══════════════════════════════════════════════
   GLOBAL BACKGROUND — fixed fullscreen Canvas
   ═══════════════════════════════════════════════ */
export default function GlobalBackground() {
  const scrollRef = useRef({ value: 0 });
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current.value = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-detect theme changes
  useEffect(() => {
    const check = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDark(theme !== "light");
    };
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 50], fov: 58 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <ConstellationScene scrollRef={scrollRef} isDark={isDark} />
      </Canvas>
    </div>
  );
}
