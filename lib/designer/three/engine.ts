import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { getProduct } from "../catalog";
import { elevationOf, itemDims } from "../geometry";
import type { Design } from "../types";
import { buildModel, disposeModel } from "./models";
import { buildRoom, type RoomBuild } from "./room3d";

export type EngineHandlers = {
  select: (uid: string | null) => void;
  dragStart: (uid: string) => void;
  /** New centre for the dragged item, in cm (not yet clamped). */
  drag: (uid: string, x: number, z: number) => void;
  dragEnd: () => void;
};

const BRAND = new THREE.Color("#b4502c");
const WARN = new THREE.Color("#d08a00");
const BG = "#e7e5e0";

const hashSeed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 1000;
};

/** Pendants hang 80 cm below the ceiling; their selection box spans from shade to ceiling. */
const pendantBottom = (roomH: number, h: number) => Math.max(1.6, roomH - 0.8 - h);

/**
 * Imperative three.js scene for the room designer. React owns the design;
 * the engine mirrors it into meshes (rebuilding only what changed), renders
 * on demand and reports picks and drags back through handlers.
 */
export class DesignerEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  private controls: OrbitControls;
  private envTarget: THREE.WebGLRenderTarget;
  private sun = new THREE.DirectionalLight("#fff4e4", 2.2);
  private itemsRoot = new THREE.Group();
  private selection = new THREE.Group();
  private room: RoomBuild | null = null;
  private roomKey = "";
  private items = new Map<string, { group: THREE.Group; key: string }>();
  private design: Design | null = null;
  private selected: string | null = null;
  private selectionKey = "";
  private label: HTMLElement | null = null;
  private frame = 0;
  private disposed = false;
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private drag: { uid: string; pointerId: number; sx: number; sy: number; started: boolean; ox: number; oz: number } | null = null;
  private downEmpty: { x: number; y: number } | null = null;
  private anim: { p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; start: number; dur: number } | null = null;
  private resizeObserver: ResizeObserver;
  private hoverQueued = false;

  constructor(private container: HTMLElement, private handlers: EngineHandlers) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(BG);
    const canvas = this.renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    // Our pointer handlers are registered before OrbitControls', so a press
    // on furniture can switch the controls off before they start orbiting.
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 22;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.screenSpacePanning = false;
    this.controls.addEventListener("change", this.invalidate);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.42;

    this.scene.add(new THREE.HemisphereLight("#fffaf2", "#b9ad9c", 0.9));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.radius = 4;
    this.scene.add(this.sun, this.sun.target, this.itemsRoot, this.selection);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  /** Mirror the design into the scene. Cheap when nothing structural changed. */
  update(design: Design, selected: string | null, clashing: boolean) {
    const firstRoom = !this.room;
    const roomKey = JSON.stringify(design.room);
    if (roomKey !== this.roomKey) {
      const sizeChanged = !this.design || ["width", "length", "height"].some((k) => this.design!.room[k as "width"] !== design.room[k as "width"]);
      this.room?.dispose();
      if (this.room) this.scene.remove(this.room.group);
      this.room = buildRoom(design.room);
      this.scene.add(this.room.group);
      this.roomKey = roomKey;
      this.fitLights(design);
      if (firstRoom) this.resetView(false, design);
      else if (sizeChanged) this.resetView(true, design);
    }
    this.design = design;

    const seen = new Set<string>();
    for (const item of design.items) {
      const product = getProduct(item.productId);
      if (!product) continue;
      seen.add(item.uid);
      const dims = itemDims(item, product);
      const key = [item.productId, item.variant, item.finish, dims.w, dims.d, product.ceiling ? design.room.height : ""].join("|");
      let entry = this.items.get(item.uid);
      if (!entry || entry.key !== key) {
        if (entry) {
          this.itemsRoot.remove(entry.group);
          disposeModel(entry.group);
        }
        const group = buildModel({ model: product.model, ...dims, finish: item.finish, roomHeight: design.room.height, seed: hashSeed(item.uid) });
        group.userData.uid = item.uid;
        entry = { group, key };
        this.items.set(item.uid, entry);
        this.itemsRoot.add(group);
      }
      entry.group.position.set(item.x / 100, elevationOf(item, design.items) / 100, item.z / 100);
      entry.group.rotation.y = (item.rotation * Math.PI) / 180;
    }
    for (const [uid, entry] of this.items) {
      if (!seen.has(uid)) {
        this.itemsRoot.remove(entry.group);
        disposeModel(entry.group);
        this.items.delete(uid);
      }
    }

    this.selected = design.items.some((i) => i.uid === selected) ? selected : null;
    this.updateSelection(clashing);
    this.invalidate();
  }

  /** Element positioned over the selected item each frame (dimension tag). */
  setLabel(el: HTMLElement | null) {
    this.label = el;
    this.invalidate();
  }

  zoom(direction: 1 | -1) {
    if (direction > 0) this.controls.dollyIn(1.25);
    else this.controls.dollyOut(1.25);
    this.controls.update();
    this.invalidate();
  }

  /** Default three-quarter view from the south-east, fitted to the room. */
  resetView(animate = true, design = this.design) {
    if (!design) return;
    const W = design.room.width / 100;
    const L = design.room.length / 100;
    // Aim partway up the walls so their tops stay in frame.
    const target = new THREE.Vector3(W / 2, (design.room.height / 100) * 0.38, L / 2);
    // Fit the room's bounding sphere inside the narrower field of view.
    const radius = Math.hypot(W, L, design.room.height / 100) / 2;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (this.camera.aspect || 1));
    const dist = (radius / Math.sin(Math.min(vfov, hfov) / 2)) * (this.camera.aspect < 1 ? 1 : 0.92);
    const polar = THREE.MathUtils.degToRad(54);
    const azimuth = THREE.MathUtils.degToRad(32);
    const pos = new THREE.Vector3(
      target.x + dist * Math.sin(polar) * Math.sin(azimuth),
      target.y + dist * Math.cos(polar),
      target.z + dist * Math.sin(polar) * Math.cos(azimuth),
    );
    if (!animate) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      this.invalidate();
      return;
    }
    this.anim = { p0: this.camera.position.clone(), p1: pos, t0: this.controls.target.clone(), t1: target, start: performance.now(), dur: 450 };
    this.invalidate();
  }

  /** Room-space floor point (cm) under a client coordinate, or null if off the floor plane. */
  floorPointAt(clientX: number, clientY: number): { x: number; z: number } | null {
    const p = this.floorHit(clientX, clientY);
    return p ? { x: p.x * 100, z: p.z * 100 } : null;
  }

  /** PNG of the current view without selection helpers; optionally downscaled to a JPEG. */
  capture(maxWidth?: number): string {
    const selVisible = this.selection.visible;
    const labelVis = this.label?.style.visibility;
    this.selection.visible = false;
    if (this.label) this.label.style.visibility = "hidden";
    this.renderer.render(this.scene, this.camera);
    const src = this.renderer.domElement;
    let url: string;
    if (maxWidth && src.width > maxWidth) {
      const c = document.createElement("canvas");
      c.width = maxWidth;
      c.height = Math.round((src.height / src.width) * maxWidth);
      c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
      url = c.toDataURL("image/jpeg", 0.82);
    } else {
      url = src.toDataURL("image/png");
    }
    this.selection.visible = selVisible;
    if (this.label && labelVis !== undefined) this.label.style.visibility = labelVis;
    this.invalidate();
    return url;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.controls.dispose();
    for (const { group } of this.items.values()) disposeModel(group);
    this.items.clear();
    this.clearSelection();
    this.room?.dispose();
    this.envTarget.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  // ---------------------------------------------------------------- internals

  private invalidate = () => {
    if (!this.frame && !this.disposed) this.frame = requestAnimationFrame(this.render);
  };

  private render = (now: number) => {
    this.frame = 0;
    if (this.anim) {
      const k = Math.min(1, (now - this.anim.start) / this.anim.dur);
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(this.anim.p0, this.anim.p1, e);
      this.controls.target.lerpVectors(this.anim.t0, this.anim.t1, e);
      if (k >= 1) this.anim = null;
    }
    const moving = this.controls.update();
    this.updateCutaway();
    this.renderer.render(this.scene, this.camera);
    this.positionLabel();
    if (moving || this.anim) this.invalidate();
  };

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  private fitLights(design: Design) {
    const W = design.room.width / 100;
    const L = design.room.length / 100;
    const c = new THREE.Vector3(W / 2, 0, L / 2);
    this.sun.position.set(c.x + 3.5, 7, c.z + 4.5);
    this.sun.target.position.copy(c);
    const r = Math.max(W, L) / 2 + 1.5;
    const cam = this.sun.shadow.camera;
    cam.left = -r;
    cam.right = r;
    cam.top = r;
    cam.bottom = -r;
    cam.near = 0.5;
    cam.far = 30;
    cam.updateProjectionMatrix();
  }

  /** Hide the walls between the camera and the room, leaving a low stub so the outline stays readable. */
  private updateCutaway() {
    if (!this.room) return;
    const cam = this.camera.position;
    for (const wall of this.room.walls) {
      const inside = cam.clone().sub(wall.center).dot(wall.normal) > 0;
      wall.full.visible = inside;
      wall.stub.visible = !inside;
    }
  }

  private clearSelection() {
    for (const child of [...this.selection.children]) {
      this.selection.remove(child);
      child.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) (m.material as THREE.Material).dispose();
      });
    }
  }

  private updateSelection(clashing: boolean) {
    const item = this.design?.items.find((i) => i.uid === this.selected);
    if (!item || !this.design) {
      if (this.selectionKey) this.clearSelection();
      this.selectionKey = "";
      this.selection.visible = false;
      return;
    }
    const product = getProduct(item.productId);
    const dims = itemDims(item, product);
    const roomH = this.design.room.height / 100;
    const w = dims.w / 100;
    const d = dims.d / 100;
    const h = dims.h / 100;
    const ceiling = !!product?.ceiling;
    const y0 = ceiling ? pendantBottom(roomH, h) : 0;
    const y1 = ceiling ? roomH : Math.max(h, 0.02);
    const key = [item.uid, w, d, y0, y1, clashing].join("|");
    if (key !== this.selectionKey) {
      this.clearSelection();
      const color = clashing ? WARN : BRAND;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.02, y1 - y0 + 0.01, d + 0.02)),
        new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 }),
      );
      edges.position.y = (y0 + y1) / 2;
      edges.renderOrder = 10;
      const footGeo = new THREE.PlaneGeometry(w + 0.06, d + 0.06);
      footGeo.rotateX(-Math.PI / 2);
      // The footprint sits just above the floor (and rugs) so the piece itself hides it.
      const foot = new THREE.Mesh(footGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      foot.position.y = ceiling ? 0.016 : 0.013;
      this.selection.add(edges, foot);
      this.selectionKey = key;
    }
    const elevation = elevationOf(item, this.design.items) / 100;
    this.selection.position.set(item.x / 100, ceiling ? 0 : elevation, item.z / 100);
    this.selection.rotation.y = (item.rotation * Math.PI) / 180;
    this.selection.visible = true;
  }

  private positionLabel() {
    const el = this.label;
    if (!el) return;
    const item = this.design?.items.find((i) => i.uid === this.selected);
    if (!item || !this.design) {
      el.style.visibility = "hidden";
      return;
    }
    const product = getProduct(item.productId);
    const top = product?.ceiling
      ? this.design.room.height / 100
      : (elevationOf(item, this.design.items) + itemDims(item, product).h) / 100;
    const p = new THREE.Vector3(item.x / 100, top + 0.08, item.z / 100).project(this.camera);
    if (p.z > 1) {
      el.style.visibility = "hidden";
      return;
    }
    const { clientWidth: w, clientHeight: h } = this.container;
    const half = el.offsetWidth / 2 + 8;
    const x = Math.min(w - half, Math.max(half, ((p.x + 1) / 2) * w));
    const y = Math.min(h - 8, Math.max(40, ((1 - p.y) / 2) * h));
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    el.style.visibility = "visible";
  }

  private setNdc(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
  }

  private floorHit(clientX: number, clientY: number) {
    this.setNdc(clientX, clientY);
    return this.raycaster.ray.intersectPlane(this.floorPlane, new THREE.Vector3());
  }

  private pickItem(clientX: number, clientY: number): string | null {
    this.setNdc(clientX, clientY);
    const hits = this.raycaster.intersectObjects(this.itemsRoot.children, true);
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object;
      while (o && o.userData.uid === undefined) o = o.parent;
      if (o) return o.userData.uid as string;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || this.drag) return;
    this.anim = null;
    const uid = this.pickItem(e.clientX, e.clientY);
    if (!uid) {
      this.downEmpty = { x: e.clientX, y: e.clientY };
      return;
    }
    const entry = this.items.get(uid);
    const floor = this.floorHit(e.clientX, e.clientY);
    this.handlers.select(uid);
    if (!entry || !floor) return;
    this.controls.enabled = false;
    this.renderer.domElement.setPointerCapture(e.pointerId);
    this.drag = {
      uid,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      started: false,
      ox: entry.group.position.x - floor.x,
      oz: entry.group.position.z - floor.z,
    };
  };

  private onPointerMove = (e: PointerEvent) => {
    const drag = this.drag;
    if (drag && e.pointerId === drag.pointerId) {
      if (!drag.started) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
        drag.started = true;
        this.handlers.dragStart(drag.uid);
        this.renderer.domElement.style.cursor = "grabbing";
      }
      const floor = this.floorHit(e.clientX, e.clientY);
      if (floor) this.handlers.drag(drag.uid, (floor.x + drag.ox) * 100, (floor.z + drag.oz) * 100);
      return;
    }
    if (e.buttons || e.pointerType !== "mouse" || this.hoverQueued) return;
    // Hover feedback, at most once per frame.
    this.hoverQueued = true;
    const { clientX, clientY } = e;
    requestAnimationFrame(() => {
      this.hoverQueued = false;
      if (this.disposed || this.drag) return;
      this.renderer.domElement.style.cursor = this.pickItem(clientX, clientY) ? "grab" : "";
    });
  };

  private onPointerUp = (e: PointerEvent) => {
    const drag = this.drag;
    if (drag && e.pointerId === drag.pointerId) {
      if (drag.started) this.handlers.dragEnd();
      this.drag = null;
      this.controls.enabled = true;
      this.renderer.domElement.style.cursor = "grab";
      if (this.renderer.domElement.hasPointerCapture(e.pointerId)) this.renderer.domElement.releasePointerCapture(e.pointerId);
      return;
    }
    if (this.downEmpty && Math.hypot(e.clientX - this.downEmpty.x, e.clientY - this.downEmpty.y) < 5) this.handlers.select(null);
    this.downEmpty = null;
  };
}
