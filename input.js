// ============================================================
// INPUT — keyboard, on-screen touch/mouse controls, Gamepad API.
// Produces a single normalized control frame every tick:
//   { pitch, roll, yaw in [-1,1], throttleDelta, throttleSet,
//     brakes, reverse, gear/flaps/spoilers/lights/camera/map/pause toggles }
// ============================================================

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.events = []; // one-shot key-down events consumed each frame

    this.joystick = { x: 0, y: 0, dragging: false };
    this.rudder = { x: 0, dragging: false };
    this.throttle = { value: 0, dragging: false };

    this.bindKeyboard();
    this.bindJoystick();
    this.bindRudder();
    this.bindThrottle();
    this.bindButtons();

    this.gamepadIndex = null;
    window.addEventListener("gamepadconnected", (e) => { this.gamepadIndex = e.gamepad.index; this._toast(`Gamepad connected: ${e.gamepad.id}`); });
    window.addEventListener("gamepaddisconnected", () => { this.gamepadIndex = null; });

    this.onAction = null; // callback(actionName) set by main.js
  }

  _toast(msg) { if (this.onToast) this.onToast(msg); }

  bindKeyboard() {
    const isTypingTarget = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    window.addEventListener("keydown", (e) => {
      if (isTypingTarget()) return; // don't fly the plane while typing into a field
      if (e.repeat) return;
      this.keys.add(e.code);
      this.events.push(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    document.addEventListener("focusin", (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") this.keys.clear();
    });
  }

  // ---------------- on-screen joystick (pitch/roll) ----------------
  bindJoystick() {
    const zone = document.getElementById("joystick-zone");
    const stick = document.getElementById("joystick-stick");
    if (!zone) return;
    const radius = 60;
    const center = () => {
      const r = zone.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };
    const move = (clientX, clientY) => {
      const { cx, cy } = center();
      let dx = clientX - cx, dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) { dx = (dx / dist) * radius; dy = (dy / dist) * radius; }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joystick.x = dx / radius;   // roll
      this.joystick.y = dy / radius;   // pitch (down = positive = nose up pull... handled in main)
    };
    const reset = () => {
      this.joystick.dragging = false;
      stick.style.transform = `translate(0px,0px)`;
      this.joystick.x = 0; this.joystick.y = 0;
    };
    const start = (e) => { this.joystick.dragging = true; e.preventDefault(); };

    stick.addEventListener("pointerdown", (e) => { start(e); stick.setPointerCapture(e.pointerId); });
    stick.addEventListener("pointermove", (e) => { if (this.joystick.dragging) move(e.clientX, e.clientY); });
    stick.addEventListener("pointerup", reset);
    stick.addEventListener("pointercancel", reset);
    zone.addEventListener("pointerdown", (e) => { start(e); move(e.clientX, e.clientY); stick.setPointerCapture(e.pointerId); });
  }

  // ---------------- rudder slider ----------------
  bindRudder() {
    const zone = document.getElementById("rudder-zone");
    const handle = document.getElementById("rudder-handle");
    if (!zone) return;
    const halfW = 70;
    const update = (clientX) => {
      const r = zone.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      let dx = clientX - cx;
      dx = Math.max(-halfW, Math.min(halfW, dx));
      handle.style.left = `calc(50% + ${dx}px)`;
      this.rudder.x = dx / halfW;
    };
    const reset = () => {
      this.rudder.dragging = false;
      handle.style.left = "50%";
      this.rudder.x = 0;
    };
    handle.addEventListener("pointerdown", (e) => { this.rudder.dragging = true; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener("pointermove", (e) => { if (this.rudder.dragging) update(e.clientX); });
    handle.addEventListener("pointerup", reset);
    handle.addEventListener("pointercancel", reset);
    zone.addEventListener("pointerdown", (e) => { this.rudder.dragging = true; update(e.clientX); });
  }

  // ---------------- throttle lever ----------------
  bindThrottle() {
    const track = document.getElementById("throttle-track");
    const handle = document.getElementById("throttle-handle");
    const fill = document.getElementById("throttle-fill");
    if (!track) return;
    const setFromClientY = (clientY) => {
      const r = track.getBoundingClientRect();
      let t = 1 - (clientY - r.top) / r.height;
      t = Math.max(0, Math.min(1, t));
      this.throttle.value = t;
      handle.style.bottom = `${t * (r.height - 26)}px`;
      fill.style.height = `${t * 100}%`;
    };
    handle.addEventListener("pointerdown", (e) => { this.throttle.dragging = true; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener("pointermove", (e) => { if (this.throttle.dragging) setFromClientY(e.clientY); });
    handle.addEventListener("pointerup", () => this.throttle.dragging = false);
    track.addEventListener("pointerdown", (e) => { this.throttle.dragging = true; setFromClientY(e.clientY); });
    this._setThrottleUI = setFromClientY;
  }

  syncThrottleUI(value) {
    const track = document.getElementById("throttle-track");
    const handle = document.getElementById("throttle-handle");
    const fill = document.getElementById("throttle-fill");
    if (!track) return;
    const h = track.getBoundingClientRect().height || 220;
    handle.style.bottom = `${value * (h - 26)}px`;
    fill.style.height = `${value * 100}%`;
    this.throttle.value = value;
  }

  bindButtons() {
    const map = {
      "btn-gear": "gear", "btn-flaps-up": "flapsUp", "btn-flaps-down": "flapsDown",
      "btn-spoilers": "spoilers", "btn-lights": "lights", "btn-camera": "camera",
      "btn-ap": "apToggle", "btn-map": "map", "btn-pause": "pause", "btn-telemetry": "telemetry",
    };
    for (const [id, action] of Object.entries(map)) {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", () => this.onAction && this.onAction(action));
    }
    // hold buttons
    const holdMap = { "btn-brakes": "brakesHold", "btn-reverse": "reverseHold" };
    for (const [id, prop] of Object.entries(holdMap)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener("pointerdown", () => this[prop] = true);
      el.addEventListener("pointerup", () => this[prop] = false);
      el.addEventListener("pointerleave", () => this[prop] = false);
    }
  }

  pollGamepad() {
    if (this.gamepadIndex === null) return null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads[this.gamepadIndex];
    if (!gp) return null;
    return {
      roll: gp.axes[0] || 0,
      pitch: gp.axes[1] || 0,
      yaw: gp.axes[2] || 0,
      throttleAxis: gp.axes[3] !== undefined ? gp.axes[3] : null,
      buttons: gp.buttons.map(b => b.pressed),
    };
  }

  // Consume one-shot key events (e.g. G for gear) — called once per frame.
  drainEvents() {
    const evs = this.events;
    this.events = [];
    return evs;
  }

  isDown(code) { return this.keys.has(code); }
}
