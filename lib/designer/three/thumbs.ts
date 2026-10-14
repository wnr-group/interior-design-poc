import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Product } from "../catalog";
import { buildModel, disposeModel } from "./models";

/**
 * Catalogue previews rendered from the same procedural models as the room,
 * using one shared offscreen renderer. Requests are queued and rendered a
 * few per frame so scrolling the catalogue never stalls the page.
 */

const W = 320;
const H = 240;

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
const cache = new Map<string, string>();
const pending = new Map<string, { product: Product; finish: string; variant: number; resolve: ((url: string) => void)[] }>();
let scheduled = false;

function setup() {
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor("#f3f2ef");
  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight("#ffffff", "#b8ab98", 1.1));
  const key = new THREE.DirectionalLight("#fff6ea", 2);
  key.position.set(3, 5, 4);
  scene.add(key);
  camera = new THREE.PerspectiveCamera(30, W / H, 0.01, 100);
}

const keyOf = (p: Product, finish: string, variant: number) => `${p.id}|${finish}|${variant}`;

function renderOne(product: Product, finish: string, variant: number): string {
  if (!renderer) setup();
  const size = product.sizes[variant] ?? product.sizes[0];
  const model = buildModel({ model: product.model, w: size.w, d: size.d, h: size.h, finish, roomHeight: 260, seed: 3 });
  if (product.ceiling) {
    // Show just the shade, not 80 cm of cord.
    model.position.y = -Math.max(1.6, 2.6 - 0.8 - size.h / 100);
  }
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  if (product.ceiling) box.max.y = Math.min(box.max.y, size.h / 100 + 0.2);
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const dist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.82;
  const dir = new THREE.Vector3(0.62, product.flat ? 1.6 : 0.5, 1).normalize();
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.lookAt(center);
  renderer!.render(scene, camera);
  const url = renderer!.domElement.toDataURL("image/webp", 0.85);
  scene.remove(model);
  disposeModel(model);
  return url;
}

function pump() {
  scheduled = false;
  const start = performance.now();
  for (const [key, job] of pending) {
    pending.delete(key);
    let url = "";
    try {
      url = renderOne(job.product, job.finish, job.variant);
    } catch {
      // No WebGL: callers fall back to a flat illustration.
    }
    cache.set(key, url);
    job.resolve.forEach((r) => r(url));
    if (performance.now() - start > 12) break;
  }
  if (pending.size && !scheduled) {
    scheduled = true;
    requestAnimationFrame(pump);
  }
}

/** Data URL of a product preview ("" if WebGL is unavailable). */
export function productThumb(product: Product, finish: string, variant = 0): Promise<string> {
  const key = keyOf(product, finish, variant);
  const hit = cache.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const job = pending.get(key);
    if (job) job.resolve.push(resolve);
    else pending.set(key, { product, finish, variant, resolve: [resolve] });
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(pump);
    }
  });
}

export function cachedThumb(product: Product, finish: string, variant = 0): string | undefined {
  return cache.get(keyOf(product, finish, variant));
}
