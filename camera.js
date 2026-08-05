// ============================================================
// CAMERA — multiple viewpoints with smooth follow + zoom.
// ============================================================
import * as THREE from "three";

const MODES = ["chase", "cockpit", "wing", "free", "ground"];

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.modeIndex = 0;
    this.zoom = 1;
    this.freeYaw = 0;
    this.freePitch = 0.25;
    this.freeDist = 40;
    this._dragging = false;
    this._lastX = 0; this._lastY = 0;

    this._chaseSmoothPos = new THREE.Vector3();
    this._chaseSmoothLook = new THREE.Vector3();
    this._initialized = false;

    domElement.addEventListener("pointerdown", (e) => {
      if (this.mode !== "free") return;
      this._dragging = true; this._lastX = e.clientX; this._lastY = e.clientY;
    });
    window.addEventListener("pointerup", () => this._dragging = false);
    window.addEventListener("pointermove", (e) => {
      if (!this._dragging || this.mode !== "free") return;
      this.freeYaw -= (e.clientX - this._lastX) * 0.005;
      this.freePitch = THREE.MathUtils.clamp(this.freePitch - (e.clientY - this._lastY) * 0.005, -1.2, 1.3);
      this._lastX = e.clientX; this._lastY = e.clientY;
    });
    domElement.addEventListener("wheel", (e) => {
      this.freeDist = THREE.MathUtils.clamp(this.freeDist + e.deltaY * 0.05, 10, 400);
      this.zoom = THREE.MathUtils.clamp(this.zoom - e.deltaY * 0.0005, 0.5, 2.5);
    }, { passive: true });
  }

  get mode() { return MODES[this.modeIndex]; }
  cycle() { this.modeIndex = (this.modeIndex + 1) % MODES.length; }
  setMode(name) { const i = MODES.indexOf(name); if (i >= 0) this.modeIndex = i; }

  update(dt, aircraftGroup, flight) {
    const pos = flight.position;
    const fwd = flight.forward;
    const up = flight.up;
    const right = flight.right;
    const span = aircraftGroup.userData.halfSpan || 15;
    const len = aircraftGroup.userData.length || 30;

    let targetPos = new THREE.Vector3();
    let targetLook = new THREE.Vector3();
    this.camera.fov = 55 / this.zoom;

    switch (this.mode) {
      case "cockpit": {
        targetPos.copy(pos).addScaledVector(fwd, len * 0.32).addScaledVector(up, len * 0.05);
        targetLook.copy(targetPos).addScaledVector(fwd, 100);
        this.camera.position.copy(targetPos);
        this.camera.up.copy(up);
        this.camera.lookAt(targetLook);
        break;
      }
      case "wing": {
        targetPos.copy(pos).addScaledVector(right, span * 1.15).addScaledVector(up, len * 0.06);
        targetLook.copy(pos);
        this.camera.position.copy(targetPos);
        this.camera.up.copy(up);
        this.camera.lookAt(targetLook);
        break;
      }
      case "ground": {
        targetPos.copy(pos).addScaledVector(fwd, -len * 1.4);
        targetPos.y = Math.max(targetPos.y, (flight._groundY || 0) + 3);
        targetLook.copy(pos);
        if (!this._initialized) this._chaseSmoothPos.copy(targetPos);
        this._chaseSmoothPos.lerp(targetPos, Math.min(1, dt * 5));
        this.camera.position.copy(this._chaseSmoothPos);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(targetLook);
        break;
      }
      case "free": {
        const offset = new THREE.Vector3(
          Math.sin(this.freeYaw) * Math.cos(this.freePitch),
          Math.sin(this.freePitch),
          Math.cos(this.freeYaw) * Math.cos(this.freePitch)
        ).multiplyScalar(this.freeDist);
        targetPos.copy(pos).add(offset);
        this.camera.position.copy(targetPos);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(pos);
        break;
      }
      case "chase":
      default: {
        const dist = Math.max(30, len * 2.2) / Math.max(0.6, this.zoom);
        targetPos.copy(pos).addScaledVector(fwd, -dist).addScaledVector(up, dist * 0.28);
        targetLook.copy(pos).addScaledVector(fwd, len);
        if (!this._initialized) { this._chaseSmoothPos.copy(targetPos); this._chaseSmoothLook.copy(targetLook); }
        this._chaseSmoothPos.lerp(targetPos, Math.min(1, dt * 4));
        this._chaseSmoothLook.lerp(targetLook, Math.min(1, dt * 6));
        this.camera.position.copy(this._chaseSmoothPos);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this._chaseSmoothLook);
        break;
      }
    }
    this.camera.updateProjectionMatrix();
    this._initialized = true;
  }
}
