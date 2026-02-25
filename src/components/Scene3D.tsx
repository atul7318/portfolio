"use client";

import { useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo } from "react";

/* ─────────────────────────────────────────────
   Custom Shader Materials
   ───────────────────────────────────────────── */

const heroVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMouseX;
  uniform float uMouseY;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  // Simplex-ish noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
      vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = position;

    // Flowing noise displacement
    float t = uTime * 0.15;
    float noiseVal = snoise(pos * 0.015 + t);
    float noiseVal2 = snoise(pos * 0.025 - t * 0.7);

    pos.x += noiseVal * 8.0;
    pos.y += noiseVal2 * 6.0;
    pos.z += snoise(pos * 0.02 + t * 0.5) * 5.0;

    // Mouse influence - particles flow away from mouse
    float mouseInfluence = 1.0 / (1.0 + length(vec2(pos.x / 60.0 - uMouseX, pos.y / 40.0 - uMouseY)) * 3.0);
    pos.x += uMouseX * mouseInfluence * 15.0;
    pos.y += uMouseY * mouseInfluence * 10.0;

    // Breathing/pulse
    float pulse = sin(uTime * 0.5 + aPhase) * 0.15 + 1.0;
    pos *= pulse;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation with pulse
    float sizePulse = sin(uTime * aSpeed + aPhase) * 0.5 + 1.0;
    gl_PointSize = aSize * sizePulse * uPixelRatio * (80.0 / -mvPosition.z);
    gl_PointSize = max(gl_PointSize, 1.0);

    gl_Position = projectionMatrix * mvPosition;

    vColor = aColor;
    // Distance-based alpha fade
    float dist = length(pos) / 65.0;
    vAlpha = smoothstep(1.2, 0.0, dist) * (0.5 + sizePulse * 0.3);
  }
`;

const heroFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft circular particle with glow
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Core
    float core = smoothstep(0.5, 0.05, dist);
    // Glow
    float glow = smoothstep(0.5, 0.0, dist) * 0.4;

    float alpha = (core + glow) * vAlpha;
    if (alpha < 0.01) discard;

    // Add slight bloom to color
    vec3 color = vColor + vColor * core * 0.5;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ── Connection Line Shaders ── */
const lineVertexShader = /* glsl */ `
  attribute float aOpacity;
  varying float vOpacity;

  void main() {
    vOpacity = aOpacity;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vOpacity;

  void main() {
    gl_FragColor = vec4(uColor, vOpacity);
  }
`;

/* ── About sphere shaders ── */
const sphereVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  // Simplex noise (same as above, compressed)
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0,0.5,1,2);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
    vec3 i1=min(g,l.zxy);vec3 i2=max(g,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0,i1.z,i2.z,1))+i.y+vec4(0,i1.y,i2.y,1))+i.x+vec4(0,i1.x,i2.x,1));
    float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=1.79284291400159-0.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normal;

    float t = uTime * 0.3;
    // Multi-octave noise displacement
    float n1 = snoise(normal * 1.5 + t) * 0.35;
    float n2 = snoise(normal * 3.0 + t * 1.5) * 0.15;
    float n3 = snoise(normal * 6.0 - t * 0.8) * 0.05;
    float displacement = n1 + n2 + n3;

    // Hover amplification
    displacement *= 1.0 + uHover * 0.6;

    vec3 newPosition = position + normal * displacement;
    vDisplacement = displacement;
    vPosition = newPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const sphereFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  void main() {
    // Fresnel rim lighting
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

    // Color based on displacement
    float d = vDisplacement * 2.0 + 0.5;
    vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, d));
    color = mix(color, uColor3, smoothstep(0.5, 1.0, d));

    // Scan line effect
    float scanLine = sin(vPosition.y * 20.0 - uTime * 2.0) * 0.5 + 0.5;
    scanLine = pow(scanLine, 8.0) * 0.15;

    // Horizontal grid lines
    float grid = smoothstep(0.02, 0.0, abs(fract(vUv.y * 30.0) - 0.5) - 0.48);
    grid += smoothstep(0.02, 0.0, abs(fract(vUv.x * 30.0) - 0.5) - 0.48);
    grid *= 0.08;

    // Combine
    float alpha = fresnel * 0.7 + 0.08 + scanLine + grid;
    alpha = min(alpha, 0.85);

    // Glow more on peaks
    color += vec3(0.15, 0.4, 1.0) * fresnel * 0.5;
    color += uColor3 * scanLine;

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─────────────────────────────────────────────
   Hero Particle Field (GPU Shader-based)
   ───────────────────────────────────────────── */
function HeroParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const count = 600;
  const connectionThreshold = 18;
  const maxLines = 500;

  // Color palette
  const colors = useMemo(() => ({
    cyan: new THREE.Color(0x00d4ff),
    blue: new THREE.Color(0x0078ff),
    purple: new THREE.Color(0x7b2fff),
    pink: new THREE.Color(0xff006e),
  }), []);

  const { positions, sizes, phases, speeds, particleColors, velocities } = useMemo(() => {
    const pos: number[] = [];
    const siz: number[] = [];
    const pha: number[] = [];
    const spd: number[] = [];
    const col: number[] = [];
    const vel: number[] = [];

    const colorArr = [
      [0, 0.83, 1],     // cyan
      [0, 0.47, 1],     // blue
      [0.48, 0.18, 1],  // purple
      [0, 0.65, 1],     // teal
    ];

    for (let i = 0; i < count; i++) {
      // Distribute in multiple formations
      const formation = Math.random();
      let x, y, z;

      if (formation < 0.35) {
        // Spiral/helix band
        const angle = (i / count) * Math.PI * 8 + Math.random() * 0.5;
        const radius = 20 + Math.random() * 25;
        x = Math.cos(angle) * radius + (Math.random() - 0.5) * 10;
        y = (i / count - 0.5) * 80 + (Math.random() - 0.5) * 15;
        z = Math.sin(angle) * radius + (Math.random() - 0.5) * 10;
      } else if (formation < 0.65) {
        // Sphere shell
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 30 + Math.random() * 20;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else {
        // Random field volume
        x = (Math.random() - 0.5) * 120;
        y = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 60;
      }

      pos.push(x, y, z);

      siz.push(1.5 + Math.random() * 3.0);
      pha.push(Math.random() * Math.PI * 2);
      spd.push(0.5 + Math.random() * 2.0);

      const c = colorArr[Math.floor(Math.random() * colorArr.length)];
      col.push(c[0], c[1], c[2]);

      vel.push(
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.02
      );
    }

    return {
      positions: new Float32Array(pos),
      sizes: new Float32Array(siz),
      phases: new Float32Array(pha),
      speeds: new Float32Array(spd),
      particleColors: new Float32Array(col),
      velocities: vel,
    };
  }, []);

  // Connection lines
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), []);
  const lineOpacities = useMemo(() => new Float32Array(maxLines * 2), []);
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(linePositions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", posAttr);
    const opAttr = new THREE.BufferAttribute(lineOpacities, 1);
    opAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aOpacity", opAttr);
    geo.setDrawRange(0, 0);
    return geo;
  }, [linePositions, lineOpacities]);

  const lineMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
        uniforms: { uColor: { value: new THREE.Color(0x00d4ff) } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
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

  useFrame(({ clock, camera }) => {
    if (!pointsRef.current || !materialRef.current) return;
    frameRef.current++;

    const time = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uMouseX.value +=
      (mouseRef.current.x - materialRef.current.uniforms.uMouseX.value) * 0.05;
    materialRef.current.uniforms.uMouseY.value +=
      (mouseRef.current.y - materialRef.current.uniforms.uMouseY.value) * 0.05;

    // Animate base positions
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];
      const dist = Math.sqrt(pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2 + pos[i * 3 + 2] ** 2);
      if (dist > 70 || dist < 10) {
        velocities[i * 3] *= -1;
        velocities[i * 3 + 1] *= -1;
        velocities[i * 3 + 2] *= -1;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Slow global rotation
    pointsRef.current.rotation.y = time * 0.02;
    pointsRef.current.rotation.x = Math.sin(time * 0.01) * 0.1;

    // Update connections every 8 frames
    if (lineRef.current && frameRef.current % 8 === 0) {
      let idx = 0;
      const threshSq = connectionThreshold * connectionThreshold;
      for (let i = 0; i < count && idx < maxLines; i++) {
        for (let j = i + 1; j < count && idx < maxLines; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const dSq = dx * dx + dy * dy + dz * dz;
          if (dSq < threshSq) {
            const o = idx * 6;
            linePositions[o] = pos[i * 3];
            linePositions[o + 1] = pos[i * 3 + 1];
            linePositions[o + 2] = pos[i * 3 + 2];
            linePositions[o + 3] = pos[j * 3];
            linePositions[o + 4] = pos[j * 3 + 1];
            linePositions[o + 5] = pos[j * 3 + 2];
            // Opacity fades with distance
            const opacity = (1.0 - Math.sqrt(dSq) / connectionThreshold) * 0.25;
            lineOpacities[idx * 2] = opacity;
            lineOpacities[idx * 2 + 1] = opacity;
            idx++;
          }
        }
      }
      lineGeometry.setDrawRange(0, idx * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.aOpacity.needsUpdate = true;
      lineRef.current.rotation.copy(pointsRef.current.rotation);
    }

    // Mouse parallax camera
    camera.position.x += (mouseRef.current.x * 12 - camera.position.x) * 0.015;
    camera.position.y += (mouseRef.current.y * 8 - camera.position.y) * 0.015;
    camera.lookAt(0, 0, 0);
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[particleColors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={heroVertexShader}
          fragmentShader={heroFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uMouseX: { value: 0 },
            uMouseY: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          }}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={lineRef} geometry={lineGeometry} material={lineMaterial} />
    </group>
  );
}

/* ─────────────────────────────────────────────
   About Section — Morphing Holographic Sphere
   ───────────────────────────────────────────── */
function HolographicSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const ringRef3 = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const hoverRef = useRef(0);

  // Orbiting particles
  const orbitData = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);
    const yOffsets = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.2 + Math.random() * 1.0;
      const yOff = (Math.random() - 0.5) * 3.0;

      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = yOff;
      pos[i * 3 + 2] = Math.sin(angle) * r;

      sizes[i] = 0.02 + Math.random() * 0.04;
      angles[i] = angle;
      radii[i] = r;
      yOffsets[i] = yOff;
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    return { positions: pos, sizes, angles, radii, yOffsets, speeds, count };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Hover smoothing
    hoverRef.current += (0 - hoverRef.current) * 0.05;

    if (meshRef.current && materialRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.15;
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.uHover.value = hoverRef.current;
    }

    // Animate rings
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 0.3;
      ringRef1.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.2) * 0.1;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.2;
      ringRef2.current.rotation.y = t * 0.15;
    }
    if (ringRef3.current) {
      ringRef3.current.rotation.z = t * 0.25;
      ringRef3.current.rotation.x = Math.PI / 2 + Math.cos(t * 0.15) * 0.2;
    }

    // Animate orbiting particles
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < orbitData.count; i++) {
        const angle = orbitData.angles[i] + t * orbitData.speeds[i];
        const r = orbitData.radii[i] + Math.sin(t * 2 + i) * 0.1;
        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = orbitData.yOffsets[i] + Math.sin(t + i * 0.5) * 0.3;
        pos[i * 3 + 2] = Math.sin(angle) * r;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const onPointerEnter = useCallback(() => { hoverRef.current = 1; }, []);

  return (
    <group>
      {/* Main morphing sphere */}
      <mesh ref={meshRef} onPointerEnter={onPointerEnter}>
        <icosahedronGeometry args={[1.8, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={sphereVertexShader}
          fragmentShader={sphereFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uHover: { value: 0 },
            uColor1: { value: new THREE.Color(0x0078ff) },
            uColor2: { value: new THREE.Color(0x00d4ff) },
            uColor3: { value: new THREE.Color(0x7b2fff) },
          }}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ring 1 — large tilted */}
      <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.6, 0.008, 4, 128]} />
        <meshBasicMaterial color={0x7b2fff} transparent opacity={0.5} />
      </mesh>

      {/* Ring 2 — medium */}
      <mesh ref={ringRef2} rotation={[Math.PI / 5, 0, Math.PI / 4]}>
        <torusGeometry args={[2.1, 0.006, 4, 96]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.3} />
      </mesh>

      {/* Ring 3 — inner fast */}
      <mesh ref={ringRef3} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.004, 4, 64]} />
        <meshBasicMaterial color={0x0078ff} transparent opacity={0.2} />
      </mesh>

      {/* Orbiting particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbitData.positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0x00d4ff}
          size={0.04}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Ambient glow */}
      <mesh>
        <sphereGeometry args={[2.8, 16, 16]} />
        <meshBasicMaterial color={0x0078ff} transparent opacity={0.02} side={THREE.BackSide} />
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
        camera={{ position: [0, 0, 70], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <HeroParticleField />
        <FrameControl />
      </Canvas>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <HolographicSphere />
      <FrameControl />
    </Canvas>
  );
}
