import * as THREE from "three";
import { AIRCRAFT_LIST, getAircraftConfig, buildAircraftMesh } from "./aircraft.js";
import { FlightState } from "./physics.js";
import { InputManager } from "./input.js";
import { World } from "./world.js";
import { AIRPORTS, buildAirportMeshes, getSpawnTransform } from "./airport.js";
import { CameraRig } from "./camera.js";
import { AudioSystem } from "./audio.js";
import { updateHUD, showToast, updateTelemetry } from "./hud.js";

// ============================================================
// GAME STATE
// ============================================================
const state = {
  aircraftId: AIRCRAFT_LIST[2].id,
  departureCode: AIRPORTS[0].code,
  runwayId: AIRPORTS[0].runways[0].id,
  weather: "clear",
  timeOfDay: "day",
  mode: "free",
  realism: "realistic",
  paused: false,
  running: false,
};

const TIME_MAP = { dawn: 6, day: 12, dusk: 18.5, night: 22 };

// ============================================================
// THREE.JS BASE SETUP
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById("render-target").appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 40000);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let world, cameraRig;
const input = new InputManager();
const audio = new AudioSystem();

let aircraftGroup = null;
let flight = null;
let cfg = null;
let airportGroup = null;
let elapsedClock = 12; // hours, advances slowly during flight

let graphicsQuality = "high";

// ============================================================
// BOOTSTRAP WORLD (built once; menu overlays it)
// ============================================================
function initWorld() {
  world = new World(scene, renderer);
  cameraRig = new CameraRig(camera, renderer.domElement);
  camera.position.set(0, 400, 800);
}

// ============================================================
// MENU UI
// ============================================================
function populateMenu() {
  const grid = document.getElementById("aircraft-grid");
  grid.innerHTML = "";
  AIRCRAFT_LIST.forEach(ac => {
    const card = document.createElement("div");
    card.className = "aircraft-card" + (ac.id === state.aircraftId ? " selected" : "");
    card.innerHTML = `
      <div class="name">${ac.name}</div>
      <div class="cat">${ac.category}</div>
      <div class="stats">
        Cruise ${ac.cruiseSpeedKt}kt · ${ac.difficulty}<br>
        Ceil ${Math.round(ac.maxAltFt/1000)}k ft · Pax ${ac.passengers}<br>
        Range ${ac.rangeNm}nm
      </div>`;
    card.addEventListener("click", () => {
      state.aircraftId = ac.id;
      [...grid.children].forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    });
    grid.appendChild(card);
  });

  const depSel = document.getElementById("sel-departure");
  depSel.innerHTML = AIRPORTS.map(a => `<option value="${a.code}">${a.code} — ${a.name}</option>`).join("");
  depSel.value = state.departureCode;
  depSel.addEventListener("change", () => { state.departureCode = depSel.value; populateRunways(); });
  populateRunways();

  document.getElementById("sel-weather").addEventListener("change", (e) => state.weather = e.target.value);
  document.getElementById("sel-time").addEventListener("change", (e) => state.timeOfDay = e.target.value);

  document.querySelectorAll("#mode-tabs .mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#mode-tabs .mode-tab").forEach(t => t.classList.remove("selected"));
      tab.classList.add("selected");
      state.mode = tab.dataset.mode;
    });
  });
  document.querySelectorAll("#realism-tabs .mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#realism-tabs .mode-tab").forEach(t => t.classList.remove("selected"));
      tab.classList.add("selected");
      state.realism = tab.dataset.realism;
    });
  });

  document.getElementById("btn-start").addEventListener("click", startFlight);
  document.getElementById("btn-controls").addEventListener("click", () => document.getElementById("controls-panel").classList.add("open"));
  document.getElementById("btn-close-controls").addEventListener("click", () => document.getElementById("controls-panel").classList.remove("open"));
}

function populateRunways() {
  const airport = AIRPORTS.find(a => a.code === state.departureCode);
  const rwSel = document.getElementById("sel-runway");
  rwSel.innerHTML = airport.runways.map(r => `<option value="${r.id}">${r.id}</option>`).join("");
  state.runwayId = airport.runways[0].id;
  rwSel.addEventListener("change", () => state.runwayId = rwSel.value);
}

// ============================================================
// FLIGHT SETUP
// ============================================================
function clearAircraft() {
  if (aircraftGroup) { scene.remove(aircraftGroup); aircraftGroup = null; }
}

function spawnAirport() {
  if (airportGroup) scene.remove(airportGroup);
  const airport = AIRPORTS.find(a => a.code === state.departureCode);
  airportGroup = new THREE.Group();
  AIRPORTS.forEach(ap => airportGroup.add(buildAirportMeshes(ap, (x, z) => world.heightAt(x, z))));
  scene.add(airportGroup);
  return airport;
}

function startFlight() {
  cfg = getAircraftConfig(state.aircraftId);
  clearAircraft();
  if (menuDemoAircraft) menuDemoAircraft.visible = false;
  aircraftGroup = buildAircraftMesh(cfg);
  scene.add(aircraftGroup);

  const airport = spawnAirport();
  world.setWeather(state.weather);
  elapsedClock = TIME_MAP[state.timeOfDay];
  world.setTimeOfDay(elapsedClock);

  let spawn;
  if (state.mode === "landing") {
    // spawn ~6.5km out on final approach, at ~1800ft AGL, aligned with runway heading
    const rw = airport.runways.find(r => r.id === state.runwayId) || airport.runways[0];
    const headingRad = THREE.MathUtils.degToRad(rw.heading);
    const dir = new THREE.Vector3(Math.sin(headingRad), 0, -Math.cos(headingRad));
    const thresholdY = world.heightAt(airport.x, airport.z);
    const backPos = new THREE.Vector3(airport.x, 0, airport.z).addScaledVector(dir, -6500);
    spawn = {
      position: new THREE.Vector3(backPos.x, thresholdY + 550, backPos.z),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -headingRad, 0)),
      velocity: dir.clone().multiplyScalar(cfg.stallSpeedKt * 0.5144 * 1.5),
    };
  } else {
    const t = getSpawnTransform(airport, state.runwayId, (x, z) => world.heightAt(x, z));
    spawn = { position: t.position, quaternion: t.quaternion, velocity: new THREE.Vector3() };
  }

  flight = new FlightState(cfg, spawn);
  flight.gearDown = true;
  if (state.mode === "landing") { flight.flaps = 0.6; flight.throttle = 0.35; }
  if (state.mode === "takeoff" || state.mode === "training" || state.mode === "free") { flight.throttle = 0.0; }

  input.syncThrottleUI(flight.throttle);

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("hud").classList.remove("hidden");
  state.running = true;
  state.paused = false;

  audio.init();

  if (state.mode === "training") runTrainingScript();
  if (state.mode === "takeoff") showToast("Advance throttle to full and rotate at ~" + Math.round(cfg.stallSpeedKt * 1.2) + "kt");
  if (state.mode === "landing") showToast("On final approach — reduce speed, extend gear, land on the runway");

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function runTrainingScript() {
  const steps = [
    "TRAINING: Advance the throttle lever to begin taxiing.",
    "Use the rudder to steer while taxiing to the runway centerline.",
    "At the runway, apply full throttle and pull back gently at rotation speed.",
    "Once climbing steadily, retract the landing gear.",
    "Level off, then practice gentle turns using roll + rudder together.",
    "When ready, reduce power, extend gear and flaps, and line up for landing.",
  ];
  let i = 0;
  const next = () => { if (i < steps.length) { showToast(steps[i]); i++; setTimeout(next, 9000); } };
  next();
}

// ============================================================
// INPUT -> CONTROL FRAME
// ============================================================
function buildControlFrame(dt) {
  const k = (c) => input.isDown(c);
  let pitch = 0, roll = 0, yaw = 0;

  // keyboard — W/S pitch the nose down/up, A/D bank left/right
  if (k("KeyS") || k("ArrowDown")) pitch += 1;   // S = pitch up (climb)
  if (k("KeyW") || k("ArrowUp")) pitch -= 1;     // W = pitch down (dive)
  if (k("KeyD") || k("ArrowRight")) roll += 1;   // D = bank right
  if (k("KeyA") || k("ArrowLeft")) roll -= 1;    // A = bank left
  if (k("KeyE")) yaw += 1;
  if (k("KeyQ")) yaw -= 1;

  // on-screen joystick / rudder (override keyboard if actively dragging)
  if (input.joystick.dragging) { pitch = input.joystick.y; roll = input.joystick.x; }
  if (input.rudder.dragging) yaw = input.rudder.x;

  // gamepad
  const gp = input.pollGamepad();
  if (gp) {
    if (Math.abs(gp.pitch) > 0.08) pitch = gp.pitch;
    if (Math.abs(gp.roll) > 0.08) roll = gp.roll;
    if (Math.abs(gp.yaw) > 0.08) yaw = gp.yaw;
    if (gp.throttleAxis !== null) input.throttle.value = THREE.MathUtils.clamp((1 - gp.throttleAxis) / 2, 0, 1);
  }

  pitch = THREE.MathUtils.clamp(pitch, -1, 1);
  roll = THREE.MathUtils.clamp(roll, -1, 1);
  yaw = THREE.MathUtils.clamp(yaw, -1, 1);

  // throttle: keyboard Shift/Ctrl gives continuous delta; the on-screen
  // slider or a gamepad throttle axis sets an absolute value — but ONLY
  // while actively in use. Previously this fell back to input.throttle.value
  // whenever Shift/Ctrl wasn't held, which silently snapped throttle back
  // to the slider's last (stale, often 0) position the instant a keyboard
  // throttle key was released — keyboard throttle only "worked" while the
  // key was physically held down.
  let throttleDelta = 0;
  if (k("ShiftLeft") || k("ShiftRight")) throttleDelta = 0.5;
  if (k("ControlLeft") || k("ControlRight")) throttleDelta = -0.5;

  let throttleSet = undefined;
  if (gp && gp.throttleAxis !== null) throttleSet = input.throttle.value;
  else if (input.throttle.dragging) throttleSet = input.throttle.value;

  const brakes = k("KeyB") || !!input.brakesHold;
  const reverse = k("KeyR") || !!input.reverseHold;

  return {
    pitch, roll, yaw, throttleDelta, throttleSet,
    brakes, reverse,
  };
}

// ============================================================
// AUTOPILOT
// ============================================================
function applyAutopilot(ctrl, dt) {
  if (!flight.ap.master) return ctrl;
  const ap = flight.ap;

  // heading hold -> roll command
  let roll = 0;
  if (ap.hdg) {
    let err = ap.targetHdg - flight.headingDeg;
    while (err > 180) err -= 360; while (err < -180) err += 360;
    roll = THREE.MathUtils.clamp(err * 0.045, -0.6, 0.6);
  }

  // altitude hold -> pitch command via vertical-speed target
  let pitch = 0;
  if (ap.alt) {
    const errFt = ap.targetAlt - flight.altitudeFt;
    const desiredVS = THREE.MathUtils.clamp(errFt * 3.5, -1200, 1200);
    const vsErr = desiredVS - flight.verticalSpeedFpm;
    pitch = THREE.MathUtils.clamp(vsErr * 0.0009, -0.5, 0.5);
  }

  // speed hold -> throttle command
  let throttleSet = ctrl.throttleSet;
  if (ap.spd) {
    const err = ap.targetSpd - flight.airspeedKt;
    throttleSet = THREE.MathUtils.clamp(flight.throttle + err * 0.004, 0, 1);
  }

  return { ...ctrl, pitch, roll, yaw: 0, throttleSet };
}

// ============================================================
// ACTIONS (buttons + one-shot keys)
// ============================================================
function toggleFlaps(dir) {
  flight.flaps = THREE.MathUtils.clamp(flight.flaps + dir * 0.25, 0, 1);
  audio.flapSound();
  document.getElementById("btn-flaps-up").classList.toggle("active", flight.flaps > 0);
}
function toggleGear() {
  if (!cfg.gearRetractable) { showToast("Fixed gear — cannot retract"); return; }
  flight.gearDown = !flight.gearDown;
  audio.gearSound();
  document.getElementById("btn-gear").classList.toggle("active", flight.gearDown);
}
function toggleSpoilers() {
  flight.spoilers = !flight.spoilers;
  document.getElementById("btn-spoilers").classList.toggle("active", flight.spoilers);
  audio.clickSound();
}
function toggleLights() {
  flight.lightsOn = !flight.lightsOn;
  document.getElementById("btn-lights").classList.toggle("active", flight.lightsOn);
  audio.clickSound();
}
function handleAction(action) {
  switch (action) {
    case "gear": toggleGear(); break;
    case "flapsUp": toggleFlaps(-1); break;
    case "flapsDown": toggleFlaps(1); break;
    case "spoilers": toggleSpoilers(); break;
    case "lights": toggleLights(); break;
    case "camera": cameraRig.cycle(); break;
    case "map": toggleMap(); break;
    case "pause": togglePause(); break;
    case "apToggle": toggleApPanel(); break;
    case "telemetry": toggleTelemetry(); break;
  }
}
input.onAction = handleAction;
input.onToast = showToast;

let telemetryOpen = false;
function toggleTelemetry() {
  telemetryOpen = !telemetryOpen;
  document.getElementById("telemetry-panel").classList.toggle("open", telemetryOpen);
}

function handleOneShotKeys() {
  for (const code of input.drainEvents()) {
    if (code === "KeyG") toggleGear();
    if (code === "KeyF") toggleFlaps(1);
    if (code === "Slash") toggleSpoilers();
    if (code === "KeyL") toggleLights();
    if (code === "KeyV") cameraRig.cycle();
    if (code === "KeyM") toggleMap();
    if (code === "KeyP") togglePause();
    if (code === "KeyT") toggleTelemetry();
  }
}

// ============================================================
// AUTOPILOT PANEL WIRING
// ============================================================
function toggleApPanel() { document.getElementById("ap-panel").classList.toggle("open"); }
document.getElementById("ap-master").addEventListener("click", (e) => {
  flight.ap.master = !flight.ap.master;
  if (flight.ap.master) flight.ap.targetAlt = flight.altitudeFt; // capture current
  e.target.classList.toggle("on", flight.ap.master);
  e.target.textContent = flight.ap.master ? "ON" : "OFF";
});
document.getElementById("ap-hdg").addEventListener("click", (e) => {
  flight.ap.hdg = !flight.ap.hdg;
  if (flight.ap.hdg) flight.ap.targetHdg = flight.headingDeg;
  e.target.classList.toggle("on", flight.ap.hdg);
  e.target.textContent = flight.ap.hdg ? "ON" : "OFF";
});
document.getElementById("ap-alt").addEventListener("click", (e) => {
  flight.ap.alt = !flight.ap.alt;
  flight.ap.targetAlt = parseFloat(document.getElementById("ap-alt-val").value) || flight.altitudeFt;
  e.target.classList.toggle("on", flight.ap.alt);
  e.target.textContent = flight.ap.alt ? "ON" : "OFF";
});
document.getElementById("ap-spd").addEventListener("click", (e) => {
  flight.ap.spd = !flight.ap.spd;
  flight.ap.targetSpd = parseFloat(document.getElementById("ap-spd-val").value) || flight.airspeedKt;
  e.target.classList.toggle("on", flight.ap.spd);
  e.target.textContent = flight.ap.spd ? "ON" : "OFF";
});

// ============================================================
// PAUSE / MAP
// ============================================================
function togglePause() {
  state.paused = !state.paused;
  document.getElementById("pause-panel").classList.toggle("open", state.paused);
}
document.getElementById("btn-resume").addEventListener("click", togglePause);
document.getElementById("btn-quit").addEventListener("click", () => window.location.reload());
document.getElementById("btn-restart").addEventListener("click", () => { togglePause(); startFlight(); });

let mapOpen = false;
function toggleMap() {
  mapOpen = !mapOpen;
  document.getElementById("map-panel").classList.toggle("open", mapOpen);
  if (mapOpen) drawMap();
}
document.getElementById("map-close").addEventListener("click", toggleMap);

function drawMap() {
  const canvas = document.getElementById("map-canvas");
  const panel = document.getElementById("map-panel");
  canvas.width = panel.clientWidth; canvas.height = panel.clientHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#070b12"; ctx.fillRect(0, 0, canvas.width, canvas.height);

  const worldSpan = world.size;
  const scale = Math.min(canvas.width, canvas.height) / worldSpan * 0.95;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const toScreen = (x, z) => [cx + x * scale, cy + z * scale];

  // airports
  AIRPORTS.forEach(ap => {
    const [sx, sy] = toScreen(ap.x, ap.z);
    ctx.fillStyle = "#3fe8d0";
    ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#9fd8d0"; ctx.font = "11px monospace";
    ctx.fillText(ap.code, sx + 7, sy + 3);
  });

  // aircraft
  const [ax, ay] = toScreen(flight.position.x, flight.position.z);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(THREE.MathUtils.degToRad(flight.headingDeg));
  ctx.fillStyle = "#ffb347";
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ============================================================
// MAIN LOOP
// ============================================================
let lastTime = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (!state.running) return;

  handleOneShotKeys();
  if (state.paused) return;

  let ctrl = buildControlFrame(dt);
  ctrl = applyAutopilot(ctrl, dt);

  flight.update(dt, ctrl, (x, z) => world.heightAt(x, z));
  if (!input.throttle.dragging) input.syncThrottleUI(flight.throttle);

  aircraftGroup.position.copy(flight.position);
  aircraftGroup.quaternion.copy(flight.quaternion);
  updateAircraftVisuals();

  elapsedClock = (elapsedClock + dt * 0.02) % 24; // slow real-time day progression
  world.setTimeOfDay(elapsedClock);
  world.update(dt, camera.position);

  cameraRig.update(dt, aircraftGroup, flight);

  const agl = Math.max(0, flight.position.y - world.heightAt(flight.position.x, flight.position.z));
  flight._groundY = world.heightAt(flight.position.x, flight.position.z);

  updateHUD(flight, cfg, {
    agl,
    clockStr: `${String(Math.floor(elapsedClock)).padStart(2, "0")}:${String(Math.floor((elapsedClock % 1) * 60)).padStart(2, "0")}`,
    nearest: nearestAirport(flight.position),
  });
  if (telemetryOpen) updateTelemetry(flight, ctrl);

  audio.update(dt, { throttle: flight.throttle, airspeedKt: flight.airspeedKt, onGround: flight.onGround, stalled: flight.stalled, propeller: cfg.propeller });

  if (mapOpen) drawMap();

  renderer.render(scene, camera);
}

function nearestAirport(pos) {
  let best = null, bestD = Infinity;
  for (const ap of AIRPORTS) {
    const d = Math.hypot(pos.x - ap.x, pos.z - ap.z);
    if (d < bestD) { bestD = d; best = ap; }
  }
  if (!best) return null;
  const bearing = (THREE.MathUtils.radToDeg(Math.atan2(best.x - pos.x, -(best.z - pos.z))) + 360) % 360;
  return { code: best.code, distNm: bestD / 1852, bearing };
}

function updateAircraftVisuals() {
  const gear = aircraftGroup.getObjectByName("gear");
  if (gear) gear.visible = flight.gearDown;
  const lights = aircraftGroup.getObjectByName("lights");
  if (lights) {
    const on = flight.lightsOn || world.nightFactor > 0.5;
    lights.traverse(o => { if (o.isMesh) o.material.emissiveIntensity = on ? 1.4 : 0; });
  }
  const landingLight = aircraftGroup.getObjectByName("landingLight");
  if (landingLight) landingLight.intensity = flight.lightsOn ? 3 : 0;

  // spin propellers proportional to throttle
  aircraftGroup.traverse(o => {
    if (o.name === "propeller") o.rotation.x += (0.2 + flight.throttle * 1.8);
  });

  // control-surface animation: ailerons/elevator via slight wing tilt is skipped for simplicity —
  // ambient prop/gear animation above is sufficient for the vertical-slice visual read.
}

// ============================================================
// BOOT
// ============================================================
function boot() {
  initWorld();
  populateMenu();
  const fill = document.getElementById("loading-fill");
  const text = document.getElementById("loading-text");
  world.build((frac, label) => {
    fill.style.width = `${Math.round(frac * 100)}%`;
    if (label) text.textContent = label.toUpperCase();
  }).then(() => {
    world.setTimeOfDay(12);
    world.setWeather("clear");
    spawnAirport();
    spawnMenuDemoAircraft();
    document.getElementById("loading-screen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loading-screen").style.display = "none";
      document.getElementById("main-menu").style.display = "flex";
      animateMenuBackground();
    }, 350);
  });
}

let menuDemoAircraft = null;
function spawnMenuDemoAircraft() {
  const demoCfg = getAircraftConfig(state.aircraftId);
  menuDemoAircraft = buildAircraftMesh(demoCfg);
  scene.add(menuDemoAircraft);
}

function animateMenuBackground() {
  // gentle idle render behind the menu — camera orbits the main hub while
  // a demo aircraft flies a lazy circuit, so the menu doesn't feel static.
  let t = 0;
  const orbitR = 1350, orbitAlt = 480, planeR = 900, planeAlt = 260;
  function tick() {
    if (document.getElementById("main-menu").style.display === "none") return;
    t += 0.0016;
    camera.position.set(Math.sin(t) * orbitR, orbitAlt + Math.sin(t * 0.7) * 60, Math.cos(t) * orbitR);
    camera.lookAt(0, 60, 0);

    if (menuDemoAircraft) {
      const a = t * 3.1 + Math.PI * 0.5;
      const gy = world.heightAt(Math.cos(a) * planeR, Math.sin(a) * planeR);
      menuDemoAircraft.position.set(Math.cos(a) * planeR, gy + planeAlt, Math.sin(a) * planeR);
      const tangent = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      const lookTarget = menuDemoAircraft.position.clone().add(tangent);
      const m = new THREE.Matrix4().lookAt(menuDemoAircraft.position, lookTarget, new THREE.Vector3(0, 1, 0));
      menuDemoAircraft.quaternion.setFromRotationMatrix(m);
      menuDemoAircraft.traverse(o => { if (o.name === "propeller") o.rotation.x += 0.5; });
    }

    world.update(0.016, camera.position);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

boot();
