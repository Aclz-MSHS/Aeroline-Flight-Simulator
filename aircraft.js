// ============================================================
// AIRCRAFT — configuration data + procedural mesh construction
//
// Every aircraft is fully defined by a plain config object below.
// Nothing about the physics engine is hard-coded to a specific
// airplane: add a new entry to AIRCRAFT_LIST and it is immediately
// flyable with its own weight, thrust, drag, and handling.
//
// Models are procedurally built from primitives (no external
// assets, no copyrighted geometry) — silhouettes are ORIGINAL and
// only loosely evoke the named real-world category for flavor.
// ============================================================

import * as THREE from "three";

export const AIRCRAFT_LIST = [
  {
    id: "ga-single",
    name: "Falcata SR-1",
    category: "General Aviation",
    desc: "Light single-engine piston trainer.",
    cruiseSpeedKt: 110,
    maxAltFt: 14000,
    passengers: 4,
    rangeNm: 500,
    difficulty: "Easy",
    // physical / aero
    mass: 1100,               // kg
    wingArea: 16,              // m^2
    wingSpan: 10,
    length: 8,
    maxThrust: 6500,           // N (piston + prop, simplified as thrust)
    dragCoeff: 0.045,
    liftSlope: 5.8,            // per-radian CL slope
    stallAngle: THREE.MathUtils.degToRad(16),
    maxSpeedKt: 160,
    stallSpeedKt: 48,
    fuelCapacity: 150,         // liters
    fuelBurnAtFullThrust: 0.9, // L/s
    turnRate: 1.6,             // rad/s authority at full deflection
    agility: 1.6,
    hasReverse: false,
    hasFlaps: true,
    propeller: true,
    gearRetractable: false,
    color: 0xe8e2d5,
    accent: 0xff5c3c,
  },
  {
    id: "regional-turboprop",
    name: "Windward ATP-42",
    category: "Regional Turboprop",
    desc: "Twin-turboprop regional airliner.",
    cruiseSpeedKt: 270,
    maxAltFt: 25000,
    passengers: 48,
    rangeNm: 900,
    difficulty: "Easy",
    mass: 18000,
    wingArea: 55,
    wingSpan: 27,
    length: 23,
    maxThrust: 95000,
    dragCoeff: 0.032,
    liftSlope: 5.6,
    stallAngle: THREE.MathUtils.degToRad(15),
    maxSpeedKt: 300,
    stallSpeedKt: 90,
    fuelCapacity: 5000,
    fuelBurnAtFullThrust: 4.2,
    turnRate: 0.9,
    agility: 1.1,
    hasReverse: true,
    hasFlaps: true,
    propeller: true,
    gearRetractable: true,
    color: 0xd8dee6,
    accent: 0x2a6fdb,
  },
  {
    id: "narrow-320",
    name: "Airbus A320-200",
    category: "Airbus",
    desc: "Narrow-body twinjet airliner.",
    cruiseSpeedKt: 450,
    maxAltFt: 39000,
    passengers: 180,
    rangeNm: 3300,
    difficulty: "Medium",
    mass: 64000,
    wingArea: 123,
    wingSpan: 34,
    length: 37,
    maxThrust: 240000,
    dragCoeff: 0.026,
    liftSlope: 5.4,
    stallAngle: THREE.MathUtils.degToRad(14),
    maxSpeedKt: 490,
    stallSpeedKt: 128,
    fuelCapacity: 24000,
    fuelBurnAtFullThrust: 18,
    turnRate: 0.55,
    agility: 0.85,
    hasReverse: true,
    hasFlaps: true,
    propeller: false,
    gearRetractable: true,
    color: 0xf1f4f7,
    accent: 0x1c4fa8,
  },
  {
    id: "narrow-737",
    name: "Halcyon H737",
    category: "Boeing-inspired",
    desc: "Narrow-body twinjet — 737-class workhorse.",
    cruiseSpeedKt: 460,
    maxAltFt: 41000,
    passengers: 189,
    rangeNm: 3500,
    difficulty: "Medium",
    mass: 68000,
    wingArea: 125,
    wingSpan: 35.8,
    length: 39.5,
    maxThrust: 250000,
    dragCoeff: 0.027,
    liftSlope: 5.4,
    stallAngle: THREE.MathUtils.degToRad(14),
    maxSpeedKt: 495,
    stallSpeedKt: 130,
    fuelCapacity: 26000,
    fuelBurnAtFullThrust: 19,
    turnRate: 0.55,
    agility: 0.9,
    hasReverse: true,
    hasFlaps: true,
    propeller: false,
    gearRetractable: true,
    color: 0xeef1f5,
    accent: 0x148f5c,
  },
  {
    id: "wide-777",
    name: "Continental C777",
    category: "Boeing-inspired",
    desc: "Long-haul wide-body twinjet — 777-class.",
    cruiseSpeedKt: 490,
    maxAltFt: 43000,
    passengers: 396,
    rangeNm: 7300,
    difficulty: "Hard",
    mass: 230000,
    wingArea: 428,
    wingSpan: 61,
    length: 64,
    maxThrust: 820000,
    dragCoeff: 0.022,
    liftSlope: 5.2,
    stallAngle: THREE.MathUtils.degToRad(13),
    maxSpeedKt: 510,
    stallSpeedKt: 150,
    fuelCapacity: 145000,
    fuelBurnAtFullThrust: 55,
    turnRate: 0.32,
    agility: 0.55,
    hasReverse: true,
    hasFlaps: true,
    propeller: false,
    gearRetractable: true,
    color: 0xf4f6f9,
    accent: 0xb3822f,
  },
  {
    id: "super-380",
    name: "Titanus T380",
    category: "Airbus-inspired",
    desc: "Full double-deck super-jumbo — A380-class.",
    cruiseSpeedKt: 485,
    maxAltFt: 43000,
    passengers: 555,
    rangeNm: 8000,
    difficulty: "Hard",
    mass: 360000,
    wingArea: 845,
    wingSpan: 80,
    length: 73,
    maxThrust: 1200000,
    dragCoeff: 0.021,
    liftSlope: 5.0,
    stallAngle: THREE.MathUtils.degToRad(12),
    maxSpeedKt: 505,
    stallSpeedKt: 160,
    fuelCapacity: 320000,
    fuelBurnAtFullThrust: 80,
    turnRate: 0.22,
    agility: 0.4,
    hasReverse: true,
    hasFlaps: true,
    propeller: false,
    gearRetractable: true,
    color: 0xf7f8fb,
    accent: 0xd6402a,
  },
];

export function getAircraftConfig(id) {
  return AIRCRAFT_LIST.find(a => a.id === id) || AIRCRAFT_LIST[0];
}

// ------------------------------------------------------------
// Procedural mesh builder — original geometric silhouette
// scaled from the aircraft's length / wingspan so every plane
// reads as visually distinct without bespoke modeling.
// ------------------------------------------------------------
// ------------------------------------------------------------
// Procedural livery texture — cheatline + window band, painted
// once per aircraft config and wrapped around the fuselage
// capsule so planes read as "dressed" rather than flat plastic.
// ------------------------------------------------------------
function makeFuselageTexture(cfg) {
  const w = 512, h = 1024;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");

  const base = new THREE.Color(cfg.color);
  const accent = new THREE.Color(cfg.accent);

  // subtle vertical shading so the fuselage doesn't read as flat-shaded plastic
  const shade = g.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, `#${base.clone().offsetHSL(0, 0, 0.05).getHexString()}`);
  shade.addColorStop(0.5, `#${base.getHexString()}`);
  shade.addColorStop(1, `#${base.clone().offsetHSL(0, 0, -0.06).getHexString()}`);
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);

  // cheatline (wraps the full circumference at mid-fuselage — like a real livery stripe)
  const lineY = h * 0.56, lineH = h * 0.05;
  g.fillStyle = `#${accent.getHexString()}`;
  g.fillRect(0, lineY, w, lineH);
  g.fillStyle = "rgba(0,0,0,0.15)";
  g.fillRect(0, lineY + lineH, w, 3);

  // window band (only for airliner-scale aircraft — GA/turboprop keep it minimal)
  if (cfg.mass > 8000) {
    const winY = h * 0.40;
    const winW = w * 0.018, winH = h * 0.028;
    const count = Math.round(cfg.length * 1.4);
    g.fillStyle = "rgba(15,22,28,0.85)";
    for (let i = 0; i < count; i++) {
      const x = (i / count) * w + w * 0.01;
      g.beginPath();
      g.roundRect ? g.roundRect(x, winY, winW, winH, 3) : g.rect(x, winY, winW, winH);
      g.fill();
    }
  }

  // faint panel lines for scale/realism
  g.strokeStyle = "rgba(0,0,0,0.06)";
  g.lineWidth = 1.5;
  for (let x = 0; x < w; x += w / 18) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

export function buildAircraftMesh(cfg) {
  const group = new THREE.Group();
  const fuselageTex = makeFuselageTexture(cfg);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    map: fuselageTex, color: 0xffffff, metalness: 0.25, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.25,
  });
  const accentMat = new THREE.MeshStandardMaterial({ color: cfg.accent, metalness: 0.25, roughness: 0.45 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x161a1f, metalness: 0.15, roughness: 0.6 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1a2a33, metalness: 0.9, roughness: 0.05, emissive: 0x0a1216, clearcoat: 1 });

  const L = cfg.length, S = cfg.wingSpan;
  const fuseR = Math.max(0.9, L * 0.045);

  // fuselage
  const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(fuseR, L * 0.72, 8, 16), bodyMat);
  fuse.rotation.z = Math.PI / 2;
  fuse.castShadow = true;
  group.add(fuse);

  // nose — a smoothly blended ellipsoid rather than a hard cone, so the
  // fuselage-to-nose transition reads as one continuous rounded shape
  const nose = new THREE.Mesh(new THREE.SphereGeometry(fuseR * 0.98, 14, 10), bodyMat);
  nose.scale.set(1.9, 1, 1);
  nose.position.x = L * 0.36;
  group.add(nose);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(fuseR * 0.5, 10, 8), darkMat);
  noseTip.scale.set(1.6, 0.9, 0.9);
  noseTip.position.x = L * 0.445;
  group.add(noseTip);

  // cockpit glass
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(fuseR * 0.8, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), glassMat);
  cockpit.scale.set(1.4, 0.75, 0.95);
  cockpit.position.set(L * 0.34, fuseR * 0.35, 0);
  group.add(cockpit);

  // main wings (swept trapezoid via shape extrude)
  const halfSpan = S / 2 - fuseR * 0.6;
  const rootChord = L * 0.16;
  const tipChord = rootChord * 0.4;
  const sweep = L * 0.14;
  const wingShape = new THREE.Shape();
  wingShape.moveTo(-rootChord * 0.4, 0);
  wingShape.lineTo(rootChord * 0.6, 0);
  wingShape.lineTo(tipChord * 0.5 + sweep, halfSpan);
  wingShape.lineTo(-tipChord * 0.5 + sweep, halfSpan);
  wingShape.lineTo(-rootChord * 0.4, 0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: fuseR * 0.22, bevelEnabled: false });
  wingGeo.translate(0, 0, -fuseR * 0.11);

  const wingR = new THREE.Mesh(wingGeo, accentMat);
  wingR.rotation.x = Math.PI / 2;
  wingR.position.set(-L * 0.02, -fuseR * 0.15, 0);
  wingR.castShadow = true;
  group.add(wingR);

  const wingL = wingR.clone();
  wingL.scale.z = -1;
  group.add(wingL);

  // engines (pods) under wings — count depends on size class
  const engineCount = cfg.mass > 150000 ? 2 : (cfg.mass > 30000 ? 2 : (cfg.propeller ? 2 : 1));
  const engineR = fuseR * (cfg.propeller ? 0.28 : 0.42);
  const engineLen = L * 0.14;
  for (let i = 0; i < engineCount; i++) {
    const side = engineCount === 1 ? 0 : (i === 0 ? 1 : -1);
    const spanPos = engineCount === 1 ? 0 : halfSpan * 0.42;
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(engineR, engineR * 0.85, engineLen, 12), darkMat);
    eng.rotation.z = Math.PI / 2;
    eng.position.set(-L * 0.02, cfg.propeller ? fuseR * 0.1 : -fuseR * 0.55, side * spanPos);
    eng.castShadow = true;
    group.add(eng);
    if (cfg.propeller) {
      const prop = new THREE.Mesh(new THREE.BoxGeometry(0.08, engineR * 3.4, 0.35), darkMat);
      prop.position.set(engineLen / 2, 0, 0);
      prop.name = "propeller";
      eng.add(prop);
    }
  }

  // tail: vertical stabilizer
  const vShape = new THREE.Shape();
  const vH = L * 0.16, vRoot = L * 0.12, vTip = vRoot * 0.35;
  vShape.moveTo(-vRoot * 0.3, 0);
  vShape.lineTo(vRoot * 0.7, 0);
  vShape.lineTo(vTip * 0.5, vH);
  vShape.lineTo(-vTip * 0.5, vH);
  vShape.lineTo(-vRoot * 0.3, 0);
  const vGeo = new THREE.ExtrudeGeometry(vShape, { depth: fuseR * 0.18, bevelEnabled: false });
  vGeo.translate(0, 0, -fuseR * 0.09);
  const vStab = new THREE.Mesh(vGeo, accentMat);
  vStab.rotation.z = Math.PI;
  vStab.position.set(-L * 0.42, fuseR * 0.3, 0);
  vStab.castShadow = true;
  group.add(vStab);

  // horizontal stabilizer
  const hHalf = S * 0.16;
  const hShape = new THREE.Shape();
  hShape.moveTo(-rootChord * 0.3, 0);
  hShape.lineTo(rootChord * 0.4, 0);
  hShape.lineTo(tipChord * 0.3, hHalf);
  hShape.lineTo(-tipChord * 0.3, hHalf);
  hShape.lineTo(-rootChord * 0.3, 0);
  const hGeo = new THREE.ExtrudeGeometry(hShape, { depth: fuseR * 0.14, bevelEnabled: false });
  hGeo.translate(0, 0, -fuseR * 0.07);
  const hStabR = new THREE.Mesh(hGeo, bodyMat);
  hStabR.rotation.x = Math.PI / 2;
  hStabR.position.set(-L * 0.4, fuseR * 0.05, 0);
  group.add(hStabR);
  const hStabL = hStabR.clone();
  hStabL.scale.z = -1;
  group.add(hStabL);

  // landing gear (simple struts + wheels)
  const gearGroup = new THREE.Group();
  gearGroup.name = "gear";
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
  function makeGearLeg(x, z) {
    const leg = new THREE.Group();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(fuseR * 0.06, fuseR * 0.06, fuseR * 1.1, 6), darkMat);
    strut.position.y = -fuseR * 0.55;
    leg.add(strut);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(fuseR * 0.22, fuseR * 0.22, fuseR * 0.18, 12), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.y = -fuseR * 1.05;
    leg.add(wheel);
    leg.position.set(x, -fuseR * 0.35, z);
    return leg;
  }
  gearGroup.add(makeGearLeg(L * 0.32, 0));               // nose
  gearGroup.add(makeGearLeg(-L * 0.02, halfSpan * 0.22)); // main right
  gearGroup.add(makeGearLeg(-L * 0.02, -halfSpan * 0.22));// main left
  group.add(gearGroup);

  // lights (small emissive spheres, toggled via material emissiveIntensity)
  const lightsGroup = new THREE.Group();
  lightsGroup.name = "lights";
  function makeLight(color, x, y, z, size = 0.18) {
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0 });
    const s = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 6), m);
    s.position.set(x, y, z);
    lightsGroup.add(s);
    return s;
  }
  const navR = makeLight(0xff2c2c, 0, 0, halfSpan + fuseR * 0.6); navR.name = "nav_r";
  const navL = makeLight(0x2cff5c, 0, 0, -(halfSpan + fuseR * 0.6)); navL.name = "nav_l";
  const beacon = makeLight(0xff9c2c, -L * 0.05, fuseR * 0.9, 0); beacon.name = "beacon";
  const strobeR = makeLight(0xffffff, 0, 0.1, halfSpan * 0.98); strobeR.name = "strobe_r";
  const strobeL = makeLight(0xffffff, 0, 0.1, -halfSpan * 0.98); strobeL.name = "strobe_l";
  group.add(lightsGroup);

  // landing lights (spotlight-ish, forward-facing point lights)
  const landingLight = new THREE.PointLight(0xfff4d6, 0, 60, 2);
  landingLight.position.set(L * 0.3, -fuseR * 0.3, 0);
  landingLight.name = "landingLight";
  group.add(landingLight);

  group.userData.halfSpan = halfSpan;
  group.userData.fuseR = fuseR;
  group.userData.length = L;
  group.traverse(o => { if (o.isMesh) o.castShadow = true; });

  // The airframe above is built nose-along-local+X for construction
  // convenience. Physics treats local -Z as forward, so rotate the
  // finished assembly once to align the visual nose with the flight
  // direction — every named child (gear/lights/propeller) rotates
  // along with it, so lookups by name still work.
  const aligned = new THREE.Group();
  group.rotation.y = Math.PI / 2;
  aligned.add(group);
  aligned.userData = group.userData;
  aligned.getObjectByName = (name) => group.getObjectByName(name);
  return aligned;
}
