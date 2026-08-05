// ============================================================
// HUD — pushes flight-state numbers into the DOM instruments.
// Kept deliberately framework-free: direct textContent writes
// are cheap and there's no reason to re-render a virtual DOM
// 60 times a second for a dozen numbers.
// ============================================================

const el = (id) => document.getElementById(id);

let toastTimer = null;
export function showToast(msg) {
  const t = el("msg-toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

export function updateTelemetry(flight, ctrl) {
  const set = (id, val) => { const n = el(id); if (n) n.textContent = val; };
  set("tm-ias", flight.airspeedKt.toFixed(0));
  set("tm-alt", flight.altitudeFt.toFixed(0));
  set("tm-vs", (flight.verticalSpeedFpm >= 0 ? "+" : "") + flight.verticalSpeedFpm.toFixed(0));
  set("tm-pitch", flight.pitchDeg.toFixed(1));
  set("tm-bank", flight.rollDeg.toFixed(1));
  set("tm-aoa", (flight.aoa * 180 / Math.PI).toFixed(1));
  set("tm-hdg", flight.headingDeg.toFixed(0));
  set("tm-throttle", (flight.throttle * 100).toFixed(0));
  set("tm-elevator", (ctrl.pitch ?? 0).toFixed(2));
  set("tm-aileron", (ctrl.roll ?? 0).toFixed(2));
  set("tm-rudder", (ctrl.yaw ?? 0).toFixed(2));
  set("tm-flaps", (flight.flaps * 100).toFixed(0));
  set("tm-gear", flight.gearDown ? "DOWN" : "UP");
  set("tm-state", flight.onGround ? "GROUND" : "AIRBORNE");
}

export function updateHUD(flight, cfg, extra) {
  el("val-speed").textContent = Math.round(flight.airspeedKt);
  el("val-alt").textContent = Math.round(flight.altitudeFt);
  el("val-vs").textContent = (flight.verticalSpeedFpm >= 0 ? "+" : "") + Math.round(flight.verticalSpeedFpm);
  el("val-agl").textContent = Math.round(Math.max(0, extra.agl * 3.28084));
  el("compass-val").textContent = String(Math.round(flight.headingDeg)).padStart(3, "0") + "°";

  el("st-thr").textContent = Math.round(flight.throttle * 100) + "%";
  el("st-gear").textContent = flight.gearDown ? "DOWN" : "UP";
  el("st-gear").className = "val" + (flight.gearDown ? "" : " off");
  el("st-flaps").textContent = Math.round(flight.flaps * 100) + "%";
  el("st-spoilers").textContent = flight.spoilers ? "ON" : "OFF";
  el("st-spoilers").className = "val" + (flight.spoilers ? " warn" : " off");
  el("st-brakes").textContent = flight.brakes > 0.05 ? "ON" : "OFF";
  el("st-brakes").className = "val" + (flight.brakes > 0.05 ? " warn" : " off");
  el("st-ap").textContent = flight.ap.master ? "ON" : "OFF";
  el("st-ap").className = "val" + (flight.ap.master ? "" : " off");
  el("st-stall").textContent = flight.stalled ? "STALL" : "OK";
  el("st-stall").className = "val" + (flight.stalled ? " on-red" : " off");
  if (extra.nearest) el("st-nearest").textContent = `${extra.nearest.code} ${extra.nearest.distNm.toFixed(1)}NM ${String(Math.round(extra.nearest.bearing)).padStart(3,"0")}°`;

  el("hud-acname").textContent = cfg.name;
  el("hud-fuel").textContent = Math.round((flight.fuel / cfg.fuelCapacity) * 100) + "%";
  el("hud-clock").textContent = extra.clockStr;

  const warn = el("warnings");
  const warnings = [];
  if (flight.stalled) warnings.push("STALL");
  if (flight.fuel / cfg.fuelCapacity < 0.08) warnings.push("LOW FUEL");
  if (extra.agl < 150 && !flight.gearDown && flight.airspeedKt < cfg.stallSpeedKt * 2.2) warnings.push("GEAR UP — PULL UP");
  if (flight.airspeedKt > cfg.maxSpeedKt) warnings.push("OVERSPEED");
  warn.textContent = warnings.join("   ·   ");

  // attitude indicator
  const pitch = flight.pitchDeg, roll = flight.rollDeg;
  const sg = el("attitude-sg");
  const pxPerDeg = 3.4;
  sg.style.transform = `translateY(${pitch * pxPerDeg}px) rotate(${roll}deg)`;
}
