"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

type PackedSplatsLike = {
  forEachSplat: (
    callback: (
      index: number,
      center: THREE.Vector3,
      scales: THREE.Vector3,
      quaternion: THREE.Quaternion,
      opacity: number,
      color: THREE.Color,
    ) => void,
  ) => void;
  setSplat: (
    index: number,
    center: THREE.Vector3,
    scales: THREE.Vector3,
    quaternion: THREE.Quaternion,
    opacity: number,
    color: THREE.Color,
  ) => void;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  const clamped = Math.min(1, Math.max(0, p));
  const index = Math.floor((sorted.length - 1) * clamped);
  return sorted[index];
}

function sanitizePackedSplats(splats: PackedSplatsLike): void {
  const orientationCorrection = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    Math.PI,
  );
  const maxScaleValues: number[] = [];

  splats.forEachSplat((_index, _center, scales) => {
    maxScaleValues.push(Math.max(scales.x, scales.y, scales.z));
  });

  maxScaleValues.sort((a, b) => a - b);
  const p99 = percentile(maxScaleValues, 0.99);
  const p999 = percentile(maxScaleValues, 0.999);

  const clampMin = 0.002;
  const clampMax = Math.max(clampMin, Math.min(0.08, Math.max(p99 * 1.35, p999 * 1.05)));

  const center = new THREE.Vector3();
  const scales = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const color = new THREE.Color();

  splats.forEachSplat((index, srcCenter, srcScales, srcQuaternion, opacity, srcColor) => {
    center.copy(srcCenter).applyQuaternion(orientationCorrection);
    scales.copy(srcScales).clampScalar(clampMin, clampMax);

    quaternion.copy(srcQuaternion);
    const norm = quaternion.length();

    if (Number.isFinite(norm) && norm > 1e-8) {
      quaternion.set(
        quaternion.x / norm,
        quaternion.y / norm,
        quaternion.z / norm,
        quaternion.w / norm,
      );
    } else {
      quaternion.set(0, 0, 0, 1);
    }

    quaternion.premultiply(orientationCorrection).normalize();

    color.copy(srcColor);
    splats.setSplat(index, center, scales, quaternion, opacity, color);
  });
}

function frameCameraToSplats(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  meshes: SplatMesh[],
): void {
  const bounds = new THREE.Box3();
  let hasBounds = false;

  for (const mesh of meshes) {
    const meshBounds = mesh.getBoundingBox(true);
    if (meshBounds.isEmpty()) {
      continue;
    }

    if (!hasBounds) {
      bounds.copy(meshBounds);
      hasBounds = true;
    } else {
      bounds.union(meshBounds);
    }
  }

  if (!hasBounds) {
    controls.target.set(0, 0, 0);
    camera.position.set(0, 1.4, 1.5);
    camera.near = 0.01;
    camera.far = 100;
    camera.updateProjectionMatrix();
    return;
  }

  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const distance = maxDimension / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5))) * 0.45;
  const eyeY = center.y + size.y * 0.05;
  const targetZ = center.z - size.z * 0.2;

  camera.position.set(center.x, eyeY, center.z + distance);
  controls.target.set(center.x, eyeY, targetZ);
  camera.near = Math.max(0.01, distance / 200);
  camera.far = Math.max(120, maxDimension * 35);
  camera.updateProjectionMatrix();
  controls.update();
}

export default function SplatViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let disposed = false;
    let animationFrameId = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#070b12");
    scene.fog = new THREE.Fog("#070b12", 8, 40);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.01,
      200,
    );
    camera.position.set(0, 1.2, 3.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.style.outline = "none";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 1.1;
    controls.panSpeed = 0.9;
    controls.minDistance = 0.12;
    controls.maxDistance = 14;
    controls.minPolarAngle = 0.04;
    controls.maxPolarAngle = Math.PI * 0.96;

    const pressedCodes = new Set<string>();
    const moveSpeed = 1.8;
    const turnSpeed = 1.5;

    const worldUp = new THREE.Vector3(0, 1, 0);
    const moveForward = new THREE.Vector3();
    const moveRight = new THREE.Vector3();
    const moveDelta = new THREE.Vector3();
    const lookDirection = new THREE.Vector3();
    const pitchAxis = new THREE.Vector3();

    const isTypingTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;

      if (!element) {
        return false;
      }

      return (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT" ||
        element.isContentEditable
      );
    };

    const movementCodes = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
    ]);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      const code = event.code;
      if (!movementCodes.has(code)) {
        return;
      }

      pressedCodes.add(code);
      event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const code = event.code;
      if (!movementCodes.has(code)) {
        return;
      }

      pressedCodes.delete(code);
      event.preventDefault();
    };

    const handleWindowBlur = () => {
      pressedCodes.clear();
    };

    const sparkRenderer = new SparkRenderer({
      renderer,
      autoUpdate: true,
      preUpdate: true,
      maxStdDev: Math.sqrt(5),
      minPixelRadius: 0,
      maxPixelRadius: 128,
      blurAmount: 0.18,
    });
    scene.add(sparkRenderer);

    const splatMesh = new SplatMesh({
      url: "/room.ply",
      constructSplats: async (splats) => {
        sanitizePackedSplats(splats as PackedSplatsLike);
      },
    });

    scene.add(splatMesh);

    let lastFrameTimeMs = performance.now();
    let elapsedTimeSeconds = 0;

    const handleResize = () => {
      if (disposed) {
        return;
      }

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
    };

    const renderFrame = () => {
      if (disposed) {
        return;
      }

      const nowMs = performance.now();
      let deltaTime = (nowMs - lastFrameTimeMs) / 1000;
      lastFrameTimeMs = nowMs;

      if (!Number.isFinite(deltaTime) || deltaTime < 0) {
        deltaTime = 0;
      }
      deltaTime = Math.min(deltaTime, 0.1);
      elapsedTimeSeconds += deltaTime;
      const time = elapsedTimeSeconds;

      const forwardInput = (pressedCodes.has("KeyW") ? 1 : 0) - (pressedCodes.has("KeyS") ? 1 : 0);
      const strafeInput = (pressedCodes.has("KeyD") ? 1 : 0) - (pressedCodes.has("KeyA") ? 1 : 0);
      const yawInput = (pressedCodes.has("ArrowRight") ? 1 : 0) - (pressedCodes.has("ArrowLeft") ? 1 : 0);
      const pitchInput = (pressedCodes.has("ArrowUp") ? 1 : 0) - (pressedCodes.has("ArrowDown") ? 1 : 0);

      if (forwardInput !== 0 || strafeInput !== 0) {
        const step = moveSpeed * deltaTime;

        camera.getWorldDirection(moveForward);
        moveForward.y = 0;
        if (moveForward.lengthSq() < 1e-8) {
          moveForward.set(0, 0, -1);
        }
        moveForward.normalize();

        moveRight.crossVectors(moveForward, worldUp).normalize();

        moveDelta
          .set(0, 0, 0)
          .addScaledVector(moveForward, forwardInput * step)
          .addScaledVector(moveRight, strafeInput * step);

        camera.position.add(moveDelta);
        controls.target.add(moveDelta);
      }

      if (yawInput !== 0 || pitchInput !== 0) {
        const turnStep = turnSpeed * deltaTime;
        const lookDistance = Math.max(0.2, camera.position.distanceTo(controls.target));

        lookDirection.copy(controls.target).sub(camera.position).normalize();

        if (yawInput !== 0) {
          lookDirection.applyAxisAngle(worldUp, -yawInput * turnStep);
        }

        if (pitchInput !== 0) {
          pitchAxis.crossVectors(lookDirection, worldUp).normalize();
          if (pitchAxis.lengthSq() > 1e-8) {
            lookDirection.applyAxisAngle(pitchAxis, pitchInput * turnStep);
          }
        }

        const maxPitchY = 0.92;
        if (Math.abs(lookDirection.y) > maxPitchY) {
          const clampedY = Math.sign(lookDirection.y) * maxPitchY;
          const horizontalLength = Math.hypot(lookDirection.x, lookDirection.z);
          const nextHorizontal = Math.sqrt(1 - clampedY * clampedY);

          if (horizontalLength > 1e-8) {
            lookDirection.x = (lookDirection.x / horizontalLength) * nextHorizontal;
            lookDirection.z = (lookDirection.z / horizontalLength) * nextHorizontal;
          } else {
            lookDirection.x = 0;
            lookDirection.z = -nextHorizontal;
          }
          lookDirection.y = clampedY;
        }

        controls.target.copy(camera.position).addScaledVector(lookDirection.normalize(), lookDistance);
      }

      controls.update();
      camera.updateMatrixWorld();

      sparkRenderer.time = time;
      sparkRenderer.deltaTime = deltaTime;
      sparkRenderer.update({ scene, viewToWorld: camera.matrixWorld });

      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    renderer.domElement.focus();
    renderFrame();

    splatMesh.initialized
      .then(() => {
        if (disposed) {
          return;
        }

        try {
          frameCameraToSplats(camera, controls, [splatMesh]);
        } catch {
          controls.target.set(0, 0, 0);
          controls.update();
        }

        setIsLoading(false);
      })
      .catch((loadError) => {
        if (disposed) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Failed to load splat";
        setError(message);
        setIsLoading(false);
      });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);

      controls.dispose();
      splatMesh.dispose();
      scene.remove(splatMesh);
      scene.remove(sparkRenderer);

      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_82%_85%,rgba(20,184,166,0.13),transparent_38%)]" />

      {isLoading && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/65 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-cyan-300" />
            <p className="text-sm tracking-[0.18em] text-slate-100/90">LOADING PROPERTY SCAN</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-30 rounded-xl border border-red-300/60 bg-red-950/65 p-3 text-sm text-red-100 backdrop-blur md:left-8 md:right-auto md:max-w-md">
          Unable to render 3D scene: {error}
        </div>
      )}
    </section>
  );
}
