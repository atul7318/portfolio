"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ═══════════════════════════════════════════════
   SHADERS
   ═══════════════════════════════════════════════ */

/* ── Aurora Ribbon Vertex ── */
const auroraVert = /* glsl */ `
  uniform float uTime;
  uniform float uMouseX;
  uniform float uMouseY;
  uniform float uIndex;

  varying vec2 vUv;
  varying float vElevation;
  varying float vFog;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Multi-wave displacement
    float freq1 = 0.8 + uIndex * 0.3;
    float freq2 = 1.2 + uIndex * 0.2;
    float speed = uTime * (0.4 + uIndex * 0.15);

    float wave1 = sin(pos.x * freq1 + speed) * cos(pos.x * 0.3 + speed * 0.7);
    float wave2 = sin(pos.x * freq2 - speed * 0.6) * 0.5;
    float wave3 = cos(pos.x * 0.2 + speed * 0.3) * sin(pos.x * 1.5 - speed);

    float elevation = (wave1 + wave2 + wave3) * (1.5 + uIndex * 0.5);

    // Mouse influence — gentle warp
    elevation += uMouseY * sin(pos.x * 0.5 + uTime) * 2.0;
    pos.x += uMouseX * cos(pos.x * 0.3) * 1.5;

    pos.y += elevation;
    pos.z += sin(pos.x * 0.15 + uTime * 0.2) * 3.0 * (1.0 + uIndex);

    vElevation = elevation;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vFog = smoothstep(10.0, 120.0, -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

/* ── Aurora Ribbon Fragment ── */
const auroraFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uIndex;

  varying vec2 vUv;
  varying float vElevation;
  varying float vFog;

  void main() {
    // Color shifts along X and with elevation
    float mix1 = sin(vUv.x * 3.14159 + uTime * 0.3 + uIndex) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, mix1);

    // Brightness pulse from elevation
    float brightness = 0.5 + abs(vElevation) * 0.12;
    color *= brightness;

    // Vertical fade — ribbon tapers at edges
    float edgeFade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);

    // Horizontal fade at extremes
    float hFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);

    float alpha = edgeFade * hFade * (0.12 + abs(vElevation) * 0.04);
    alpha *= (1.0 - vFog * 0.5);

    // Shimmer
    float shimmer = sin(vUv.x * 80.0 + uTime * 4.0) * 0.5 + 0.5;
    alpha += shimmer * 0.02 * edgeFade;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ── Starfield Vertex ── */
const starVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aFlicker;

  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Gentle drift
    pos.y += sin(uTime * 0.1 + pos.x * 0.05) * 0.5;
    pos.x += cos(uTime * 0.08 + pos.z * 0.03) * 0.3;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    // Twinkle
    float flicker = sin(uTime * aFlicker + pos.x + pos.y) * 0.4 + 0.6;
    vAlpha = flicker;

    gl_PointSize = aSize * flicker * uPixelRatio * (60.0 / -mvPos.z);
    gl_PointSize = max(gl_PointSize, 0.8);

    gl_Position = projectionMatrix * mvPos;
  }
`;

/* ── Starfield Fragment ── */
const starFrag = /* glsl */ `
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = exp(-d * 6.0) * 0.6;
    float alpha = (core + glow) * vAlpha * 0.7;
    if (alpha < 0.01) discard;
    vec3 color = mix(vec3(0.6, 0.8, 1.0), vec3(1.0), core);
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ── Toroid Knot Glow Vertex ── */
const knotVert = /* glsl */ `
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vFresnel;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/* ── Toroid Knot Glow Fragment ── */
const knotFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vFresnel;

  void main() {
    // Animated color band
    float band = sin(vUv.x * 30.0 - uTime * 2.0) * 0.5 + 0.5;
    vec3 color = mix(uColor1, uColor2, band);

    // Energy pulse traveling along the knot
    float pulse = sin(vUv.x * 60.0 - uTime * 5.0) * 0.5 + 0.5;
    pulse = pow(pulse, 6.0);

    // Fresnel edge glow
    float alpha = vFresnel * 0.6 + 0.05;
    alpha += pulse * 0.3;

    // Scan lines
    float scan = sin(vWorldPos.y * 15.0 + uTime * 1.5) * 0.5 + 0.5;
    scan = pow(scan, 12.0) * 0.2;
    alpha += scan;

    color += uColor2 * pulse * 0.5;
    color += vec3(0.3, 0.5, 1.0) * vFresnel * 0.3;

    gl_FragColor = vec4(color, min(alpha, 0.9));
  }
`;

/* ── Data Stream Particle Vertex ── */
const streamVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aAngle;
  attribute float aSpeed;
  attribute float aRadius;

  varying float vAlpha;

  void main() {
    // Orbit on a torus-like path
    float t = uTime * aSpeed + aAngle;

    float R = 2.0; // major radius
    float r = aRadius; // minor radius

    // Torus knot parametric (p=2, q=3 to match the mesh)
    float p = 2.0;
    float q = 3.0;
    float rr = cos(q * t) + R;
    vec3 pos;
    pos.x = rr * cos(p * t);
    pos.y = rr * sin(p * t);
    pos.z = -sin(q * t);
    pos *= 0.8;

    // Slight radial offset
    pos += normalize(pos) * (r - 0.8) * 0.5;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float flicker = sin(uTime * 3.0 + aAngle * 10.0) * 0.3 + 0.7;
    vAlpha = flicker * 0.8;

    gl_PointSize = (2.0 + r * 0.5) * flicker * uPixelRatio * (30.0 / -mvPos.z);
    gl_PointSize = max(gl_PointSize, 1.0);

    gl_Position = projectionMatrix * mvPos;
  }
`;

/* ── Data Stream Particle Fragment ── */
const streamFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = exp(-d * 5.0) * 0.5;
    float alpha = (core + glow) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor * (1.0 + core * 0.4), alpha);
  }
`;

/* ═══════════════════════════════════════════════
   HERO — Digital Aurora with Starfield
   ═══════════════════════════════════════════════ */

function AuroraRibbon({ index, color1, color2, yOffset }: {
  index: number; color1: THREE.Color; color2: THREE.Color; yOffset: number;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uMouseX.value +=
      (mouseRef.current.x - matRef.current.uniforms.uMouseX.value) * 0.03;
    matRef.current.uniforms.uMouseY.value +=
      (mouseRef.current.y - matRef.current.uniforms.uMouseY.value) * 0.03;
  });

  return (
    <mesh ref={meshRef} position={[0, yOffset, -10 - index * 8]} rotation={[-0.15, 0, 0]}>
      <planeGeometry args={[140, 12, 200, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVert}
        fragmentShader={auroraFrag}
        uniforms={{
          uTime: { value: 0 },
          uMouseX: { value: 0 },
          uMouseY: { value: 0 },
          uIndex: { value: index },
          uColor1: { value: color1 },
          uColor2: { value: color2 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Starfield() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const count = 500;

  const { positions, sizes, flickers } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const fli = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = -Math.random() * 80 - 5;
      siz[i] = 0.8 + Math.random() * 2.5;
      fli[i] = 1.0 + Math.random() * 4.0;
    }
    return { positions: pos, sizes: siz, flickers: fli };
  }, []);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aFlicker" args={[flickers, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={starVert}
        fragmentShader={starFrag}
        uniforms={{
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
        }}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* Floating geometric shapes drifting in the background */
function FloatingShape({ position, rotation, speed, scale, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  scale: number;
  color: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const initY = position[1];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = rotation[0] + t * speed * 0.3;
    ref.current.rotation.y = rotation[1] + t * speed * 0.5;
    ref.current.rotation.z = rotation[2] + t * speed * 0.2;
    ref.current.position.y = initY + Math.sin(t * speed * 0.4) * 2;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.08} />
    </mesh>
  );
}

function HeroScene() {
  const cameraRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0, y: 0 });

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
    cameraRef.current.x += (mouseRef.current.x * 8 - cameraRef.current.x) * 0.02;
    cameraRef.current.y += (mouseRef.current.y * 5 - cameraRef.current.y) * 0.02;
    camera.position.x = cameraRef.current.x;
    camera.position.y = cameraRef.current.y;
    camera.lookAt(0, 0, -20);
  });

  const ribbons = useMemo(() => [
    { color1: new THREE.Color(0x00d4ff), color2: new THREE.Color(0x7b2fff), y: 8 },
    { color1: new THREE.Color(0x0078ff), color2: new THREE.Color(0x00d4ff), y: 0 },
    { color1: new THREE.Color(0x7b2fff), color2: new THREE.Color(0xff006e), y: -6 },
    { color1: new THREE.Color(0x00d4ff), color2: new THREE.Color(0x0078ff), y: -14 },
  ], []);

  const shapes = useMemo(() => [
    { pos: [-30, 15, -25] as [number, number, number], rot: [0.5, 0.3, 0] as [number, number, number], speed: 0.6, scale: 3, color: 0x00d4ff },
    { pos: [35, -10, -30] as [number, number, number], rot: [0, 0.8, 0.2] as [number, number, number], speed: 0.4, scale: 2.5, color: 0x7b2fff },
    { pos: [-20, -18, -20] as [number, number, number], rot: [0.2, 0, 0.7] as [number, number, number], speed: 0.5, scale: 2, color: 0x0078ff },
    { pos: [25, 20, -35] as [number, number, number], rot: [0.7, 0.4, 0] as [number, number, number], speed: 0.35, scale: 3.5, color: 0x00d4ff },
    { pos: [0, -25, -22] as [number, number, number], rot: [0, 0.6, 0.3] as [number, number, number], speed: 0.55, scale: 1.8, color: 0x7b2fff },
  ], []);

  return (
    <group>
      <Starfield />
      {ribbons.map((r, i) => (
        <AuroraRibbon key={i} index={i} color1={r.color1} color2={r.color2} yOffset={r.y} />
      ))}
      {shapes.map((s, i) => (
        <FloatingShape key={i} position={s.pos} rotation={s.rot} speed={s.speed} scale={s.scale} color={s.color} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ABOUT — Crystalline Torus Knot with Data Streams
   ═══════════════════════════════════════════════ */

function CrystalKnot() {
  const knotRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const streamMatRef = useRef<THREE.ShaderMaterial>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Data stream particles orbiting the knot
  const streamCount = 120;
  const streamData = useMemo(() => {
    const angles = new Float32Array(streamCount);
    const speeds = new Float32Array(streamCount);
    const radii = new Float32Array(streamCount);
    const positions = new Float32Array(streamCount * 3); // placeholder

    for (let i = 0; i < streamCount; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 0.8;
      radii[i] = 0.7 + Math.random() * 0.4;
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }
    return { angles, speeds, radii, positions };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (knotRef.current) {
      knotRef.current.rotation.x = t * 0.1;
      knotRef.current.rotation.y = t * 0.15;
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
    }
    if (streamMatRef.current) {
      streamMatRef.current.uniforms.uTime.value = t;
    }

    // Pulsing core
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.15;
      coreRef.current.scale.setScalar(pulse);
    }

    // Rotating rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.5;
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.35;
      ring2Ref.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group>
      {/* Main torus knot with glow shader */}
      <mesh ref={knotRef}>
        <torusKnotGeometry args={[1.6, 0.35, 200, 32, 2, 3]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={knotVert}
          fragmentShader={knotFrag}
          uniforms={{
            uTime: { value: 0 },
            uColor1: { value: new THREE.Color(0x00d4ff) },
            uColor2: { value: new THREE.Color(0x7b2fff) },
          }}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay for crystalline look */}
      <mesh rotation={[0, 0, 0]}>
        <torusKnotGeometry args={[1.62, 0.36, 80, 8, 2, 3]} />
        <meshBasicMaterial color={0x00d4ff} wireframe transparent opacity={0.04} />
      </mesh>

      {/* Energy core at center */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.15} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.4} />
      </mesh>

      {/* Data stream particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[streamData.positions, 3]} />
          <bufferAttribute attach="attributes-aAngle" args={[streamData.angles, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[streamData.speeds, 1]} />
          <bufferAttribute attach="attributes-aRadius" args={[streamData.radii, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={streamMatRef}
          vertexShader={streamVert}
          fragmentShader={streamFrag}
          uniforms={{
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0x00d4ff) },
            uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Orbital ring 1 */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.8, 0.006, 4, 96]} />
        <meshBasicMaterial color={0x7b2fff} transparent opacity={0.35} />
      </mesh>

      {/* Orbital ring 2 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[2.3, 0.005, 4, 80]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.2} />
      </mesh>

      {/* Ambient glow shell */}
      <mesh>
        <sphereGeometry args={[3.2, 16, 16]} />
        <meshBasicMaterial color={0x0078ff} transparent opacity={0.015} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   Shared — Pause rendering when off-screen
   ═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   Scene3D Export
   ═══════════════════════════════════════════════ */
export default function Scene3D({ type }: { type: "hero" | "sphere" }) {
  if (type === "hero") {
    return (
      <Canvas
        camera={{ position: [0, 0, 45], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <HeroScene />
        <FrameControl />
      </Canvas>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <CrystalKnot />
      <FrameControl />
    </Canvas>
  );
}
