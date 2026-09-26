"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF, Center } from "@react-three/drei";
import { Suspense, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { RGBELoader } from "three-stdlib";

/* ─────────────────────────────────────────
   Screen texture
───────────────────────────────────────── */
function makeScreenTexture(): THREE.CanvasTexture {
  const W = 1024, H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#08131d";
  ctx.fillRect(0, 0, W, H);

  const g = ctx.createRadialGradient(W * 0.75, H * 0.18, 0, W * 0.75, H * 0.18, 240);
  g.addColorStop(0, "rgba(41,171,226,0.28)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#29abe2"; ctx.shadowBlur = 28;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px Arial Black, Arial, sans-serif";
  ctx.fillText("FoRTI", W * 0.75, H * 0.18);
  ctx.shadowBlur = 8; ctx.fillStyle = "#29abe2";
  ctx.font = "bold 14px Courier New, monospace";
  ctx.fillText("FORUM  RISET  TI", W * 0.75, H * 0.34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = true; tex.needsUpdate = true;
  return tex;
}

/* ─────────────────────────────────────────
   HDR Environment — load manual dari lokal
───────────────────────────────────────── */
function HDREnvironment() {
  const { scene, gl } = useThree();
  useEffect(() => {
    // Set tone mapping dulu sebelum HDR load
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;

    const loader = new RGBELoader();
    loader.load("/hdri/potsdamer_platz_1k.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    });
    return () => { scene.environment = null; };
  }, [scene, gl]);
  return null;
}

/* ─────────────────────────────────────────
   Laptop
───────────────────────────────────────── */
function LaptopModel() {
  const { scene } = useGLTF("/models/laptop.glb");
  const groupRef = useRef<THREE.Group>(null!);

  const autoScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const s = box.getSize(new THREE.Vector3());
    return 3.0 / Math.max(s.x, s.y, s.z);
  }, [scene]);

  useMemo(() => {
    const tex = makeScreenTexture();
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;

      if (mesh.name === "Screen_ComputerScreen_0") {
        mesh.material = new THREE.MeshBasicMaterial({ map: tex });
        return;
      }

      if (mesh.name === "Frame_ComputerFrame_0") {
        // GLB punya emissiveFactor [1,1,1] — ini yang bikin frame/keyboard putih
        // Harus di-clone dulu biar tidak mutate shared material
        const orig = mesh.material as THREE.MeshStandardMaterial;
        const mat = orig.clone();
        mat.emissive.set(0, 0, 0);
        mat.emissiveIntensity = 0;
        mat.emissiveMap = null;
        mat.needsUpdate = true;
        mesh.material = mat;
      }
    });
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = -0.3 + Math.sin(t * 0.4) * 0.18;
    groupRef.current.position.y = 0.15 + Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} scale={autoScale} />
      </Center>
    </group>
  );
}

/* ─────────────────────────────────────────
   Particles
───────────────────────────────────────── */
function Particles({ count = 38 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { positions, colors } = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const palette = [
      new THREE.Color("#29abe2"), new THREE.Color("#3dbef5"),
      new THREE.Color("#7fd3f2"), new THREE.Color("#b0c4d8"),
    ];
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.15) * Math.PI;
      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
      const c = palette[Math.floor(Math.random() * palette.length)];
      col.push(c.r, c.g, c.b);
    }
    return { positions: new Float32Array(pos), colors: new Float32Array(col) };
  }, [count]);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.03; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

/* ─────────────────────────────────────────
   Main Scene
───────────────────────────────────────── */
export default function LaptopScene() {
  return (
    <Canvas
      camera={{ position: [0.3, 0.2, 6.5], fov: 48 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ touchAction: "pan-y", pointerEvents: "none" }}
    >
      {/* Lampu fill ringan — HDR yang jadi sumber utama */}
      <ambientLight intensity={0.1} />
      <directionalLight position={[4, 1, 2]} intensity={0.3} color="#29abe2" />

      <Suspense fallback={null}>
        <HDREnvironment />
        <LaptopModel />
        <Particles />
        <ContactShadows position={[0, -1.6, 0]} opacity={0.22} scale={7} blur={2.5} far={2} color="#0d1a24" />
      </Suspense>


    </Canvas>
  );
}
