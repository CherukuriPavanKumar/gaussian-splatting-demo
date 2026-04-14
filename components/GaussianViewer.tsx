"use client";
/* @refresh reset */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PackedSplats, SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

export interface GaussianViewerProps {
  splatUrl: string;
  height?: number;
  splatAlphaRemovalThreshold?: number;
  onLoad?: () => void;
  orientationPreset?: "auto" | "identity" | "yDownToYUp" | "zUpToYUp" | "zUpToYUpInverse";
  keyboardControls?: boolean;
  controlMode?: "hybrid" | "keyboardOnly" | "orbitOnly";
  movementSpeed?: number;
  sprintMultiplier?: number;
  lookSpeed?: number;
  inertia?: boolean;
}

type ExtendedSplatMeshOptions = NonNullable<ConstructorParameters<typeof SplatMesh>[0]> & {
  splatAlphaRemovalThreshold?: number;
  onError?: (error: Error) => void;
};

type DownloadProgress = {
  loadedBytes: number;
  totalBytes: number | null;
  percent: number;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const order = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, order);
  const decimals = order === 0 ? 0 : 1;
  return String(value.toFixed(decimals)) + " " + units[order];
}

async function fetchFileWithProgress(
  url: string,
  signal: AbortSignal,
  onProgress: (loadedBytes: number, totalBytes: number | null) => void,
): Promise<Uint8Array> {
  const response = await fetch(url, {
    method: "GET",
    signal,
    cache: "default",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch splat asset: " + response.status + " " + response.statusText);
  }

  const contentLengthHeader = response.headers.get("content-length");
  const parsedTotal = contentLengthHeader ? Number(contentLengthHeader) : NaN;
  const totalBytes = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;

  if (!response.body) {
    const arrayBuffer = await response.arrayBuffer();
    const result = new Uint8Array(arrayBuffer);
    onProgress(result.byteLength, totalBytes ?? result.byteLength);
    return result;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;
  let lastProgressUpdateMs = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value || value.byteLength === 0) {
      continue;
    }

    chunks.push(value);
    loadedBytes += value.byteLength;

    const nowMs = performance.now();
    if (nowMs - lastProgressUpdateMs > 90) {
      onProgress(loadedBytes, totalBytes);
      lastProgressUpdateMs = nowMs;
    }
  }

  const fileBytes = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    fileBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  onProgress(fileBytes.byteLength, totalBytes ?? fileBytes.byteLength);
  return fileBytes;
}

function getFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.href);
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    return last || "room.ply";
  } catch {
    return "room.ply";
  }
}

const ORIENTATION_QUATERNIONS: Record<
  Exclude<GaussianViewerProps["orientationPreset"], "auto" | undefined>,
  THREE.Quaternion
> = {
  identity: new THREE.Quaternion(),
  yDownToYUp: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI),
  zUpToYUp: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
  zUpToYUpInverse: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
};

function collectCenterSamples(splats: PackedSplats, maxSamples: number): THREE.Vector3[] {
  const samples: THREE.Vector3[] = [];
  const total = Math.max(1, splats.numSplats || 0);
  const stride = Math.max(1, Math.floor(total / maxSamples));

  splats.forEachSplat((index, center) => {
    if (index % stride === 0 && samples.length < maxSamples) {
      samples.push(center.clone());
    }
  });

  return samples;
}

function scoreOrientation(samples: THREE.Vector3[], correction: THREE.Quaternion): number {
  if (samples.length === 0) {
    return Number.NEGATIVE_INFINITY;
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  const transformedY: number[] = [];
  const transformed = new THREE.Vector3();

  for (const point of samples) {
    transformed.copy(point).applyQuaternion(correction);
    transformedY.push(transformed.y);

    if (transformed.x < minX) minX = transformed.x;
    if (transformed.x > maxX) maxX = transformed.x;
    if (transformed.y < minY) minY = transformed.y;
    if (transformed.y > maxY) maxY = transformed.y;
    if (transformed.z < minZ) minZ = transformed.z;
    if (transformed.z > maxZ) maxZ = transformed.z;
  }

  transformedY.sort((a, b) => a - b);
  const lowIndex = Math.floor((transformedY.length - 1) * 0.1);
  const highIndex = Math.floor((transformedY.length - 1) * 0.9);
  const lowCut = transformedY[lowIndex];
  const highCut = transformedY[highIndex];

  let floorCount = 0;
  let ceilingCount = 0;
  for (const y of transformedY) {
    if (y <= lowCut) {
      floorCount += 1;
    }
    if (y >= highCut) {
      ceilingCount += 1;
    }
  }

  const sizeX = Math.max(1e-4, maxX - minX);
  const sizeY = Math.max(1e-4, maxY - minY);
  const sizeZ = Math.max(1e-4, maxZ - minZ);
  const horizontalSpan = Math.max(sizeX, sizeZ);

  const flatnessScore = horizontalSpan / sizeY;
  const floorBias = (floorCount - ceilingCount) / transformedY.length;

  return flatnessScore * 0.55 + floorBias * 0.45;
}

function pickOrientationQuaternion(
  splats: PackedSplats,
  preset: GaussianViewerProps["orientationPreset"],
): THREE.Quaternion {
  if (!preset || preset === "auto") {
    const samples = collectCenterSamples(splats, 8000);
    const candidates = Object.values(ORIENTATION_QUATERNIONS);

    let best = candidates[0];
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const candidate of candidates) {
      const score = scoreOrientation(samples, candidate);
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    return best.clone();
  }

  return ORIENTATION_QUATERNIONS[preset].clone();
}

function reorientPackedSplats(
  splats: PackedSplats,
  correction: THREE.Quaternion,
): void {
  if (Math.abs(correction.lengthSq() - 1) > 1e-6) {
    correction.normalize();
  }

  const center = new THREE.Vector3();
  const scales = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const color = new THREE.Color();

  splats.forEachSplat((index, srcCenter, srcScales, srcQuaternion, opacity, srcColor) => {
    center.copy(srcCenter).applyQuaternion(correction);
    scales.copy(srcScales);
    quaternion.copy(srcQuaternion).premultiply(correction).normalize();
    color.copy(srcColor);
    splats.setSplat(index, center, scales, quaternion, opacity, color);
  });
}

export default function GaussianViewer({
  splatUrl,
  height = 600,
  splatAlphaRemovalThreshold = 10,
  onLoad,
  orientationPreset = "auto",
  keyboardControls = true,
  controlMode = "hybrid",
  movementSpeed = 2.4,
  sprintMultiplier = 2,
  lookSpeed = 1.5,
  inertia = true,
}: GaussianViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    loadedBytes: 0,
    totalBytes: null,
    percent: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let disposed = false;
    let animationFrameId = 0;
    const downloadAbortController = new AbortController();
    let splatMesh: SplatMesh | null = null;

    setIsLoading(true);
    setError(null);
    setDownloadProgress({ loadedBytes: 0, totalBytes: null, percent: 0 });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f0f);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.up.set(0, 1, 0);
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.opacity = "0";
    renderer.domElement.style.transition = "opacity 500ms ease";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.enabled = controlMode !== "keyboardOnly";
    controls.target.set(0, 0, 0);
    controls.update();

    // Input handling state.
    const pressedCodes = new Set<string>();
    let keyboardEnabled = keyboardControls && controlMode !== "orbitOnly";
    const movementCodes = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "ShiftLeft",
      "ShiftRight",
    ]);

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

    const resetKeyboardMotion = () => {
      pressedCodes.clear();
      linearVelocity.set(0, 0, 0);
      angularVelocity.set(0, 0);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.code === "KeyM" && controlMode === "hybrid" && !event.repeat) {
        keyboardEnabled = !keyboardEnabled;
        if (!keyboardEnabled) {
          resetKeyboardMotion();
        }
        event.preventDefault();
        return;
      }

      if (!movementCodes.has(event.code)) {
        return;
      }

      pressedCodes.add(event.code);
      event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!movementCodes.has(event.code)) {
        return;
      }

      pressedCodes.delete(event.code);
      event.preventDefault();
    };

    const handleWindowBlur = () => {
      resetKeyboardMotion();
    };

    // Movement and rotation vectors.
    const worldUp = new THREE.Vector3(0, 1, 0);
    const moveForward = new THREE.Vector3();
    const moveRight = new THREE.Vector3();
    const desiredVelocity = new THREE.Vector3();
    const linearVelocity = new THREE.Vector3();
    const frameDisplacement = new THREE.Vector3();

    const lookDirection = new THREE.Vector3();
    const pitchAxis = new THREE.Vector3();
    const desiredAngular = new THREE.Vector2();
    const angularVelocity = new THREE.Vector2();
    const maxPitchY = Math.sin(THREE.MathUtils.degToRad(80));

    const sparkRenderer = new SparkRenderer({
      renderer,
      autoUpdate: true,
      preUpdate: true,
      maxStdDev: Math.sqrt(5),
      blurAmount: 0.18,
      focalAdjustment: 1.2,
    });
    scene.add(sparkRenderer);

    const failLoad = () => {
      if (disposed) {
        return;
      }

      setError("Failed to load 3D scene. Please try again.");
      setIsLoading(false);
    };

    const updateProgress = (loadedBytes: number, totalBytes: number | null) => {
      if (disposed) {
        return;
      }

      const normalizedTotal = totalBytes && totalBytes > 0 ? totalBytes : null;
      const percent = normalizedTotal
        ? Math.min(100, Math.max(0, (loadedBytes / normalizedTotal) * 100))
        : 0;

      setDownloadProgress({
        loadedBytes,
        totalBytes: normalizedTotal,
        percent,
      });
    };

    const createMesh = async () => {
      try {
        const fileBytes = await fetchFileWithProgress(
          splatUrl,
          downloadAbortController.signal,
          updateProgress,
        );

        if (disposed) {
          return;
        }

        const meshOptions: ExtendedSplatMeshOptions = {
          fileBytes,
          fileName: getFileNameFromUrl(splatUrl),
          splatAlphaRemovalThreshold,
          constructSplats: (splats) => {
            const correction = pickOrientationQuaternion(
              splats as PackedSplats,
              orientationPreset,
            );
            reorientPackedSplats(splats as PackedSplats, correction);
          },
          onLoad: () => {
            if (disposed) {
              return;
            }

            setDownloadProgress((prev) => ({
              loadedBytes: prev.totalBytes ?? prev.loadedBytes,
              totalBytes: prev.totalBytes,
              percent: 100,
            }));
            setIsLoading(false);
            renderer.domElement.style.opacity = "1";
            onLoad?.();
          },
          onError: failLoad,
        };

        splatMesh = new SplatMesh(
          meshOptions as unknown as ConstructorParameters<typeof SplatMesh>[0],
        );
        scene.add(splatMesh);

        splatMesh.initialized.catch(() => {
          failLoad();
        });
      } catch (loadError) {
        if (disposed) {
          return;
        }

        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        failLoad();
      }
    };

    createMesh();

    let lastFrameTimeMs = performance.now();
    let elapsedTimeSeconds = 0;

    const handleResize = () => {
      if (disposed) {
        return;
      }

      const width = container.clientWidth;
      const heightPx = container.clientHeight;

      camera.aspect = width / heightPx;
      camera.updateProjectionMatrix();
      renderer.setSize(width, heightPx);
    };

    const animate = () => {
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

      const useKeyboard =
        controlMode === "keyboardOnly" || (controlMode === "hybrid" && keyboardEnabled);

      // Movement logic (WASD), relative to camera forward/right vectors.
      if (useKeyboard) {
        const forwardInput = (pressedCodes.has("KeyW") ? 1 : 0) - (pressedCodes.has("KeyS") ? 1 : 0);
        const strafeInput = (pressedCodes.has("KeyD") ? 1 : 0) - (pressedCodes.has("KeyA") ? 1 : 0);
        const sprinting = pressedCodes.has("ShiftLeft") || pressedCodes.has("ShiftRight");

        camera.getWorldDirection(moveForward).normalize();
        moveRight.crossVectors(moveForward, camera.up).normalize();

        desiredVelocity
          .set(0, 0, 0)
          .addScaledVector(moveForward, forwardInput)
          .addScaledVector(moveRight, strafeInput);

        if (desiredVelocity.lengthSq() > 1e-8) {
          desiredVelocity
            .normalize()
            .multiplyScalar(movementSpeed * (sprinting ? sprintMultiplier : 1));
        }

        if (inertia) {
          const movementLerp = 1 - Math.exp(-10 * deltaTime);
          linearVelocity.lerp(desiredVelocity, movementLerp);
        } else {
          linearVelocity.copy(desiredVelocity);
        }

        frameDisplacement.copy(linearVelocity).multiplyScalar(deltaTime);
        if (frameDisplacement.lengthSq() > 1e-10) {
          camera.position.add(frameDisplacement);
          controls.target.add(frameDisplacement);
        }

        // Rotation logic (arrow keys) with pitch clamp to prevent flips.
        const yawInput = (pressedCodes.has("ArrowRight") ? 1 : 0) - (pressedCodes.has("ArrowLeft") ? 1 : 0);
        const pitchInput = (pressedCodes.has("ArrowUp") ? 1 : 0) - (pressedCodes.has("ArrowDown") ? 1 : 0);

        desiredAngular.set(yawInput * lookSpeed, pitchInput * lookSpeed);
        if (inertia) {
          const rotationLerp = 1 - Math.exp(-14 * deltaTime);
          angularVelocity.lerp(desiredAngular, rotationLerp);
        } else {
          angularVelocity.copy(desiredAngular);
        }

        const yawStep = angularVelocity.x * deltaTime;
        const pitchStep = angularVelocity.y * deltaTime;
        if (Math.abs(yawStep) > 1e-6 || Math.abs(pitchStep) > 1e-6) {
          const lookDistance = Math.max(0.25, camera.position.distanceTo(controls.target));

          lookDirection.copy(controls.target).sub(camera.position).normalize();

          if (Math.abs(yawStep) > 1e-6) {
            lookDirection.applyAxisAngle(worldUp, -yawStep);
          }

          if (Math.abs(pitchStep) > 1e-6) {
            pitchAxis.crossVectors(lookDirection, worldUp).normalize();
            if (pitchAxis.lengthSq() > 1e-8) {
              lookDirection.applyAxisAngle(pitchAxis, pitchStep);
            }
          }

          if (Math.abs(lookDirection.y) > maxPitchY) {
            const clampedY = Math.sign(lookDirection.y) * maxPitchY;
            const horizontalLength = Math.hypot(lookDirection.x, lookDirection.z);
            const targetHorizontal = Math.sqrt(1 - clampedY * clampedY);

            if (horizontalLength > 1e-8) {
              lookDirection.x = (lookDirection.x / horizontalLength) * targetHorizontal;
              lookDirection.z = (lookDirection.z / horizontalLength) * targetHorizontal;
            } else {
              lookDirection.x = 0;
              lookDirection.z = -targetHorizontal;
            }

            lookDirection.y = clampedY;
          }

          controls.target.copy(camera.position).addScaledVector(lookDirection.normalize(), lookDistance);
        }
      }

      controls.update();
      sparkRenderer.time = time;
      sparkRenderer.deltaTime = deltaTime;
      sparkRenderer.update({
        scene,
        viewToWorld: camera.matrixWorld,
      });
      renderer.render(scene, camera);

      animationFrameId = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    animate();

    return () => {
      disposed = true;
      downloadAbortController.abort();
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);

      if (splatMesh) {
        scene.remove(splatMesh);
      }
      scene.remove(sparkRenderer);

      controls.dispose();
      if (splatMesh) {
        splatMesh.dispose();
      }

      const disposableMesh = splatMesh as (SplatMesh & {
        geometry?: THREE.BufferGeometry;
        material?: THREE.Material | THREE.Material[];
      }) | null;

      disposableMesh?.geometry?.dispose();
      if (Array.isArray(disposableMesh?.material)) {
        for (const material of disposableMesh.material) {
          material.dispose();
        }
      } else {
        disposableMesh?.material?.dispose();
      }

      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    splatUrl,
    splatAlphaRemovalThreshold,
    onLoad,
    orientationPreset,
    keyboardControls,
    controlMode,
    movementSpeed,
    sprintMultiplier,
    lookSpeed,
    inertia,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: String(height) + "px",
        overflow: "hidden",
        borderRadius: "12px",
        background: "#0f0f0f",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            zIndex: 10,
            background: "rgba(15, 15, 15, 0.6)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9999px",
                border: "3px solid rgba(255, 255, 255, 0.22)",
                borderTopColor: "#f3f4f6",
                animation: "gaussian-spin 0.9s linear infinite",
              }}
            />
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading 3D Tour...</p>

            <div
              style={{
                width: "260px",
                height: "8px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.12)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: String(downloadProgress.percent) + "%",
                  height: "100%",
                  borderRadius: "9999px",
                  background: "linear-gradient(90deg, #22d3ee, #38bdf8)",
                  transition: "width 100ms linear",
                }}
              />
            </div>

            <p style={{ color: "#94a3b8", fontSize: "12px" }}>
              {Math.floor(downloadProgress.percent)}%{" "}
              {downloadProgress.totalBytes
                ? "(" +
                  formatBytes(downloadProgress.loadedBytes) +
                  " / " +
                  formatBytes(downloadProgress.totalBytes) +
                  ")"
                : "(" + formatBytes(downloadProgress.loadedBytes) + ")"}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "grid",
            placeItems: "center",
            padding: "16px",
            color: "#ef4444",
            textAlign: "center",
            fontWeight: 600,
            background: "rgba(15, 15, 15, 0.75)",
          }}
        >
          Failed to load 3D scene. Please try again.
        </div>
      )}

      <style jsx>{"@keyframes gaussian-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
