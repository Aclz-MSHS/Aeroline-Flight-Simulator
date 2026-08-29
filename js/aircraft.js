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
    wingSpan: 35.8,
    length: 37.6,
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

// Single source of truth for the aircraft's fuselage radius, and for
// how far below the aircraft's origin the landing gear actually
// contacts the ground. physics.js and airport.js both import
// getGearContactOffset() instead of hardcoding their own guessed
// constant — a mismatch between "what height physics assumes is the
// ground" and "what height the mesh's wheels are actually built at"
// is what caused the aircraft to visually spawn underground.
//
// The contact point is the wheel's BOTTOM (the actual contact patch),
// not its center — using the center would still bury each wheel by
// its own radius. Both numbers below are derived from the exact same
// formula makeGearLeg() uses to build the gear mesh (see below), so if
// the aircraft model's proportions ever change, this stays correct
// automatically instead of drifting out of sync.
export function getFuselageRadius(cfg) {
  // Ratio calibrated so a 37.6m-length A320-class config produces the
  // real A320-200's ~3.95m fuselage diameter (fuseR*2), rather than an
  // arbitrary scale factor.
  return Math.max(0.9, cfg.length * 0.0525);
}
export function getGearContactOffset(cfg) {
  const fuseR = getFuselageRadius(cfg);
  const wheelCenterDrop = fuseR * 1.4; // leg at -fuseR*0.35, wheel center a further -fuseR*1.05 below that
  const wheelRadius = fuseR * 0.22;    // matches makeGearLeg()'s wheelR
  return wheelCenterDrop + wheelRadius;
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

  // Bold two-tone livery: an accent-colored lower-fuselage "belly band"
  // sweeping from the tail forward, plus a thicker cheatline — the
  // previous version was just a thin 5%-height stripe, which read as
  // close to a blank white aircraft from any distance.
  const cheatY = h * 0.54, cheatH = h * 0.09;
  g.fillStyle = `#${accent.getHexString()}`;
  g.fillRect(0, cheatY, w, cheatH);
  g.fillStyle = "rgba(0,0,0,0.18)";
  g.fillRect(0, cheatY + cheatH, w, 3);
  // belly band — accent color filling from the cheatline down to the
  // bottom of the texture (the underside of the fuselage)
  g.fillStyle = `#${accent.clone().offsetHSL(0, 0, -0.08).getHexString()}`;
  g.fillRect(0, cheatY + cheatH + 3, w, h - (cheatY + cheatH + 3));
  // thin bright pinstripe accent above the main cheatline for contrast
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.fillRect(0, cheatY - 6, w, 3);

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
    // thin frame line just above the windows, a common airliner cue
    // separating the window belt from the upper fuselage
    g.fillStyle = "rgba(0,0,0,0.08)";
    g.fillRect(0, winY - 6, w, 2);
  }

  // faint panel lines for scale/realism
  g.strokeStyle = "rgba(0,0,0,0.06)";
  g.lineWidth = 1.5;
  for (let x = 0; x < w; x += w / 18) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }

  // "AEROLINE" wordmark on the forward fuselage, above the cheatline
  if (cfg.mass > 8000) {
    g.save();
    g.translate(w / 2, h * 0.30);
    g.fillStyle = `#${accent.getHexString()}`;
    g.font = "bold " + Math.round(h * 0.042) + "px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.letterSpacing = `${Math.round(h * 0.007)}px`;
    g.fillText("AEROLINE", 0, 0);
    g.restore();
    // thin accent underline beneath the wordmark
    g.fillStyle = `#${accent.getHexString()}`;
    g.fillRect(w / 2 - w * 0.11, h * 0.325, w * 0.22, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Small emblem texture for the vertical stabilizer — a simple circular
// mark plus wordmark, so the tail reads as a livery rather than a flat
// color panel.
function makeTailTexture(cfg) {
  const w = 256, h = 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  const accent = new THREE.Color(cfg.accent);
  g.fillStyle = `#${accent.getHexString()}`;
  g.fillRect(0, 0, w, h);
  // emblem: a simple chevron/wing mark
  g.save();
  g.translate(w / 2, h * 0.42);
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.beginPath();
  g.moveTo(0, -34);
  g.lineTo(30, 20);
  g.lineTo(10, 20);
  g.lineTo(0, -4);
  g.lineTo(-10, 20);
  g.lineTo(-30, 20);
  g.closePath();
  g.fill();
  g.restore();
  g.save();
  g.translate(w / 2, h * 0.72);
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.font = "bold 22px sans-serif";
  g.textAlign = "center";
  g.fillText("AEROLINE", 0, 0);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// Builds one half of a tapered lifting surface (wing or horizontal
// stabilizer) as its own independently-defined polygon — span is
// parameterized by `side` (+1 right, -1 left) directly in the shape's
// coordinates, rather than built once and mirrored with a negative
// scale. Negative-scale mirroring is a classic Three.js pitfall: it
// flips the mesh's winding/normals, so the mirrored copy ends up with
// inside-out lighting (this was the "inverted wings" bug — the right
// wing rendered correctly, the left wing did not). Defining each side
// as its own simple polygon lets Three.js compute correct outward
// normals for both sides every time, with no manual normal-flipping.
function buildLiftingSurfacePanel(rootChord, tipChord, sweepLEdeg, halfSpan, thickness, side, mat) {
  // Sweep is derived from a real leading-edge sweep ANGLE (the A320's
  // is ~27.5deg) rather than an arbitrary offset fraction of length —
  // sweepOffset = halfSpan * tan(angle) is the actual geometric
  // relationship between span and how far aft the tip leading edge
  // sits relative to the root.
  const sweepOffset = halfSpan * Math.tan(THREE.MathUtils.degToRad(sweepLEdeg));
  const teRootX = -rootChord * 0.38;
  const teTipX = -tipChord * 0.38 + sweepOffset;
  const notchSpanFrac = 0.12;
  const notchX = THREE.MathUtils.lerp(teRootX, teTipX, notchSpanFrac) - rootChord * 0.15; // bulge aft, suggesting a wing-body fairing / flap-track break
  const shape = new THREE.Shape();
  shape.moveTo(teRootX, 0);                                          // trailing edge, root
  shape.lineTo(rootChord * 0.62, 0);                                 // leading edge, root
  shape.lineTo(tipChord * 0.62 + sweepOffset, halfSpan * side);       // leading edge, tip
  shape.lineTo(teTipX, halfSpan * side);                              // trailing edge, tip
  shape.lineTo(notchX, halfSpan * side * notchSpanFrac);              // trailing-edge fairing notch, near root
  shape.lineTo(teRootX, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.translate(0, 0, -thickness / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  return mesh;
}

// Wraps a lifting-surface panel in a pivot so dihedral can be applied
// as a clean rotation about the root, independent of the panel's own
// "lay it flat" rotation. Verified numerically (see dev notes): for a
// panel built with span * side, pivot.rotation.x = -dihedral * side
// tilts the tip upward on BOTH sides.
function mountWithDihedral(panelMesh, side, dihedralRad, rootPos) {
  const pivot = new THREE.Group();
  pivot.position.copy(rootPos);
  pivot.rotation.x = -dihedralRad * side;
  pivot.add(panelMesh);
  return pivot;
}

function buildWingletSegment(chordBase, chordTip, height, sweepOffset, side, mat) {
  const shape = new THREE.Shape();
  shape.moveTo(-chordBase * 0.35, 0);
  shape.lineTo(chordBase * 0.4, 0);
  shape.lineTo(chordTip * 0.4 + sweepOffset, height);
  shape.lineTo(-chordTip * 0.35 + sweepOffset, height);
  shape.lineTo(-chordBase * 0.35, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: chordBase * 0.05, bevelEnabled: false });
  geo.translate(0, 0, -chordBase * 0.025);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.castShadow = true;
  return mesh;
}

// A real A320 sharklet is a curved, swept blend from the wingtip into a
// near-vertical fin — not a single flat fin at a fixed angle. Two
// tapered, swept segments at increasing cant angle approximate that
// curve cheaply (a proper spline would cost far more geometry for a
// browser sim that needs to stay lightweight).
function buildWinglet(halfSpan, chord, height, side, mat) {
  const group = new THREE.Group();
  const lowerH = height * 0.35, upperH = height * 0.65;
  const midChord = chord * 0.7, tipChord = chord * 0.4;

  const lower = buildWingletSegment(chord, midChord, lowerH, chord * 0.15, side, mat);
  lower.rotation.y = side > 0 ? THREE.MathUtils.degToRad(10) : THREE.MathUtils.degToRad(-10);
  group.add(lower);

  const upper = buildWingletSegment(midChord, tipChord, upperH, chord * 0.32, side, mat);
  upper.rotation.y = side > 0 ? THREE.MathUtils.degToRad(32) : THREE.MathUtils.degToRad(-32);
  // position the upper segment starting from where the lower segment's
  // tip actually ends, following the lower segment's own cant angle
  const lowerTipLocal = new THREE.Vector3(chord * 0.15, lowerH, 0);
  const qLower = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, lower.rotation.y, 0, "XYZ"));
  lowerTipLocal.applyQuaternion(qLower);
  upper.position.set(lowerTipLocal.x, lowerTipLocal.y, 0);
  group.add(upper);

  group.position.set(0, 0, halfSpan * side);
  group.castShadow = true;
  return group;
}

export function buildAircraftMesh(cfg) {
  const group = new THREE.Group();
  const fuselageTex = makeFuselageTexture(cfg);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    map: fuselageTex, color: 0xffffff, metalness: 0.25, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.25,
  });
  const accentMat = new THREE.MeshStandardMaterial({ color: cfg.accent, metalness: 0.25, roughness: 0.45 });
  const tailMat = new THREE.MeshStandardMaterial({ map: makeTailTexture(cfg), metalness: 0.2, roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x161a1f, metalness: 0.15, roughness: 0.6 });
  const engineCowlMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ec, metalness: 0.5, roughness: 0.3 });
  const fanBladeMat = new THREE.MeshStandardMaterial({ color: 0x1c2226, metalness: 0.75, roughness: 0.35 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1a2a33, metalness: 0.9, roughness: 0.05, emissive: 0x0a1216, clearcoat: 1 });

  const L = cfg.length, S = cfg.wingSpan;
  const fuseR = getFuselageRadius(cfg);

  // ---------------------------------------------------------------
  // FUSELAGE — a tapered lathe profile (rounded nose, constant-diameter
  // cabin section, tapered tail cone) instead of a uniform capsule.
  // Profile is (radius, axial position along the nose-tail axis); the
  // lathe revolves around its local Y, so the whole mesh is rotated
  // -90deg about Z afterward to align that axis with the model's local
  // +X "nose" convention (verified numerically before writing this).
  // ---------------------------------------------------------------
  const halfLen = L * 0.5;
  const profile = [
    [0.02, -halfLen * 0.98],   // tail tip
    [0.55, -halfLen * 0.85],
    [0.94, -halfLen * 0.62],   // tail cone shoulder
    [1.00, -halfLen * 0.10],   // constant-section start
    [1.00, halfLen * 0.34],    // constant-section end (nose shoulder)
    [0.82, halfLen * 0.44],
    [0.5, halfLen * 0.50],
    [0.14, halfLen * 0.545],
    [0.02, halfLen * 0.555],   // nose tip
  ].map(([r, x]) => new THREE.Vector2(Math.max(0.001, r * fuseR), x));
  const fuseGeo = new THREE.LatheGeometry(profile, 28);
  const fuse = new THREE.Mesh(fuseGeo, bodyMat);
  fuse.rotation.z = -Math.PI / 2;
  fuse.castShadow = true;
  fuse.receiveShadow = true;
  group.add(fuse);

  // cockpit windshield — positioned and sized against the ACTUAL nose
  // surface (computed from the same profile points the fuselage lathe
  // uses), not a fixed offset guessed independently of the fuselage
  // geometry. The previous version was positioned at x=L*0.46, which
  // for this profile is 6.9m in front of the nose tip (x=halfLen*0.555)
  // — floating in empty space, disconnected from the fuselage entirely.
  const cockpitX = halfLen * 0.375; // just aft of the shoulder (halfLen*0.34), into the taper
  // interpolate local fuselage radius at cockpitX from the same profile points
  const localNoseRadius = fuseR * THREE.MathUtils.lerp(1.0, 0.82, (cockpitX - halfLen * 0.34) / (halfLen * 0.44 - halfLen * 0.34));
  const cockpitGroup = new THREE.Group();
  cockpitGroup.position.set(cockpitX, localNoseRadius * 0.12, 0);
  const wsW = localNoseRadius * 1.05, wsH = localNoseRadius * 0.62;
  const wsGeo = new THREE.BoxGeometry(wsW * 0.55, wsH, wsW * 0.06);
  const mullionGeo = new THREE.BoxGeometry(wsW * 0.06, wsH * 1.02, wsW * 0.07);
  [[-1, 24], [1, 24], [-1, 58], [1, 58]].forEach(([side, yawDeg], i) => {
    const spread = localNoseRadius * (i < 2 ? 0.42 : 0.82);
    const panel = new THREE.Mesh(wsGeo, glassMat);
    panel.position.set(-wsW * (i < 2 ? 0.05 : 0.32), localNoseRadius * 0.08, side * spread);
    panel.rotation.y = THREE.MathUtils.degToRad(yawDeg) * side;
    panel.rotation.x = THREE.MathUtils.degToRad(-22); // raked back like a real airliner windshield
    cockpitGroup.add(panel);
    // dark mullion frame at the inner edge of each pane, for visible
    // panel separation rather than one continuous dark blob
    const mullion = new THREE.Mesh(mullionGeo, darkMat);
    mullion.position.set(-wsW * (i < 2 ? 0.05 : 0.32) + wsW * 0.02, localNoseRadius * 0.08, side * (spread - localNoseRadius * 0.1));
    mullion.rotation.copy(panel.rotation);
    cockpitGroup.add(mullion);
  });
  group.add(cockpitGroup);

  // small forward passenger-door outline suggestion (flat panel) — cheap
  // visual break in the fuselage texture near the front, real doors are
  // otherwise carried by the texture's window band
  const doorGeo = new THREE.PlaneGeometry(fuseR * 0.5, fuseR * 1.1);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide });
  [1, -1].forEach(side => {
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.rotation.y = Math.PI / 2;
    door.position.set(halfLen * 0.28, fuseR * 0.02, side * fuseR * 0.995);
    group.add(door);
    // aft door, mirrored
    const aftDoor = new THREE.Mesh(doorGeo, doorMat);
    aftDoor.rotation.y = Math.PI / 2;
    aftDoor.position.set(-L * 0.12, fuseR * 0.02, side * fuseR * 0.995);
    group.add(aftDoor);
  });
  // cargo door on the lower right fuselage side, aft of the wing —
  // larger, squarer panel, positioned below the window line
  if (cfg.mass > 8000) {
    const cargoDoorGeo = new THREE.PlaneGeometry(fuseR * 0.9, fuseR * 0.6);
    const cargoDoor = new THREE.Mesh(cargoDoorGeo, doorMat);
    cargoDoor.rotation.y = Math.PI / 2;
    cargoDoor.position.set(-L * 0.06, -fuseR * 0.35, fuseR * 0.995);
    group.add(cargoDoor);
  }

  // ---------------------------------------------------------------
  // WINGS — real dihedral, correct normals on both sides (see
  // buildLiftingSurfacePanel), tapered thickness via the extrude
  // depth, and winglets for airliner-class aircraft.
  // ---------------------------------------------------------------
  const halfSpan = S / 2 - fuseR * 0.6;
  const rootChord = L * 0.16;
  const tipChord = rootChord * 0.28; // taper ratio ~0.28, close to the real A320's ~0.24
  const wingSweepDeg = 27.5;         // real A320 leading-edge sweep
  const wingThickness = fuseR * 0.22;
  const wingRootPos = new THREE.Vector3(-L * 0.02, -fuseR * 0.18, 0);
  const dihedralRad = THREE.MathUtils.degToRad(5);

  const wingR = buildLiftingSurfacePanel(rootChord, tipChord, wingSweepDeg, halfSpan, wingThickness, 1, accentMat);
  group.add(mountWithDihedral(wingR, 1, dihedralRad, wingRootPos));
  const wingL = buildLiftingSurfacePanel(rootChord, tipChord, wingSweepDeg, halfSpan, wingThickness, -1, accentMat);
  group.add(mountWithDihedral(wingL, -1, dihedralRad, wingRootPos));

  // Wing-fuselage fairing — a smooth blended wedge where the wing root
  // meets the belly, instead of the wing appearing to simply poke
  // straight out of the fuselage with a hard, unnatural seam.
  const fairingGeo = new THREE.SphereGeometry(fuseR * 0.55, 10, 8);
  [1, -1].forEach(side => {
    const fairing = new THREE.Mesh(fairingGeo, bodyMat);
    fairing.scale.set(2.6, 0.6, 1.1);
    fairing.position.set(wingRootPos.x, wingRootPos.y + fuseR * 0.1, side * fuseR * 0.75);
    fairing.castShadow = true;
    group.add(fairing);
  });

  const hasWinglets = cfg.mass > 25000 && !cfg.propeller;
  if (hasWinglets) {
    const wingletHeight = fuseR * 1.1;
    const wingletPivotR = mountWithDihedral(
      buildWinglet(halfSpan, tipChord * 1.4, wingletHeight, 1, accentMat), 1, dihedralRad, wingRootPos
    );
    const wingletPivotL = mountWithDihedral(
      buildWinglet(halfSpan, tipChord * 1.4, wingletHeight, -1, accentMat), -1, dihedralRad, wingRootPos
    );
    group.add(wingletPivotR, wingletPivotL);
  }

  // ---------------------------------------------------------------
  // ENGINES — two-stage nacelle (larger fan cowl forward, slimmer aft
  // section), a dark inlet lip, and a pylon connecting the nacelle to
  // the wing, instead of a single floating cylinder.
  // ---------------------------------------------------------------
  const engineCount = cfg.mass > 150000 ? 2 : (cfg.mass > 30000 ? 2 : (cfg.propeller ? 2 : 1));
  const fanR = fuseR * (cfg.propeller ? 0.26 : 0.46);
  const coreR = fanR * 0.72;
  const nacelleLen = L * (cfg.propeller ? 0.05 : 0.13);
  for (let i = 0; i < engineCount; i++) {
    const side = engineCount === 1 ? 0 : (i === 0 ? 1 : -1);
    const spanPos = engineCount === 1 ? 0 : halfSpan * 0.42;
    const engineX = -L * 0.06;
    const engineY = cfg.propeller ? fuseR * 0.1 : -fuseR * 0.62;
    const engineGroup = new THREE.Group();
    engineGroup.position.set(engineX, engineY, side * spanPos);

    if (cfg.propeller) {
      const nac = new THREE.Mesh(new THREE.CylinderGeometry(fanR, fanR * 0.85, nacelleLen, 12), darkMat);
      nac.rotation.z = Math.PI / 2;
      engineGroup.add(nac);
      const prop = new THREE.Mesh(new THREE.BoxGeometry(0.08, fanR * 3.4, 0.35), darkMat);
      prop.position.set(nacelleLen / 2, 0, 0);
      prop.name = "propeller";
      engineGroup.add(prop);
    } else {
      // fan cowl (forward, larger diameter)
      const fanCowl = new THREE.Mesh(new THREE.CylinderGeometry(fanR, fanR * 0.94, nacelleLen * 0.55, 16), engineCowlMat);
      fanCowl.rotation.z = Math.PI / 2;
      fanCowl.position.x = nacelleLen * 0.18;
      engineGroup.add(fanCowl);
      // core cowl (aft, slimmer)
      const coreCowl = new THREE.Mesh(new THREE.CylinderGeometry(fanR * 0.9, coreR, nacelleLen * 0.5, 16), engineCowlMat);
      coreCowl.rotation.z = Math.PI / 2;
      coreCowl.position.x = -nacelleLen * 0.32;
      engineGroup.add(coreCowl);
      // dark inlet lip
      const inlet = new THREE.Mesh(new THREE.TorusGeometry(fanR * 0.98, fanR * 0.1, 8, 16), darkMat);
      inlet.rotation.y = Math.PI / 2;
      inlet.position.x = nacelleLen * 0.46;
      engineGroup.add(inlet);
      // dark intake interior backing (so the inlet doesn't read as an
      // empty hollow tube when viewed from the front/side)
      const intakeBack = new THREE.Mesh(new THREE.CircleGeometry(fanR * 0.92, 20), darkMat);
      intakeBack.rotation.y = Math.PI / 2;
      intakeBack.position.x = nacelleLen * 0.32;
      engineGroup.add(intakeBack);
      // fan disk + spinner — the single most recognizable turbofan cue;
      // without it the nacelle just reads as an empty tube
      const fanDisk = new THREE.Mesh(new THREE.CylinderGeometry(fanR * 0.88, fanR * 0.88, fanR * 0.05, 24), fanBladeMat);
      fanDisk.rotation.z = Math.PI / 2;
      fanDisk.position.x = nacelleLen * 0.4;
      fanDisk.name = "fanDisk";
      engineGroup.add(fanDisk);
      const spinner = new THREE.Mesh(new THREE.ConeGeometry(fanR * 0.22, fanR * 0.5, 12), engineCowlMat);
      spinner.rotation.z = -Math.PI / 2;
      spinner.position.x = nacelleLen * 0.46;
      engineGroup.add(spinner);
      // pylon connecting nacelle to wing
      const pylonGeo = new THREE.BoxGeometry(nacelleLen * 0.5, fuseR * 0.55, fuseR * 0.12);
      const pylon = new THREE.Mesh(pylonGeo, bodyMat);
      pylon.position.set(0, fanR * 0.9, 0);
      engineGroup.add(pylon);
    }
    engineGroup.traverse(o => { if (o.isMesh) o.castShadow = true; });
    group.add(engineGroup);
  }

  // ---------------------------------------------------------------
  // TAIL
  // ---------------------------------------------------------------
  const vH = L * 0.213, vRoot = L * 0.12, vTip = vRoot * 0.35;
  const vShape = new THREE.Shape();
  vShape.moveTo(-vRoot * 0.3, 0);
  vShape.lineTo(vRoot * 0.7, 0);
  vShape.lineTo(vTip * 0.5, vH);
  vShape.lineTo(-vTip * 0.5, vH);
  vShape.lineTo(-vRoot * 0.3, 0);
  const vGeo = new THREE.ExtrudeGeometry(vShape, { depth: fuseR * 0.18, bevelEnabled: false });
  vGeo.translate(0, 0, -fuseR * 0.09);
  const vStab = new THREE.Mesh(vGeo, tailMat);
  vStab.rotation.z = Math.PI;
  vStab.position.set(-L * 0.42, fuseR * 0.3, 0);
  vStab.castShadow = true;
  group.add(vStab);

  const hHalf = S * 0.16;
  const hRootPos = new THREE.Vector3(-L * 0.4, fuseR * 0.05, 0);
  const hDihedral = THREE.MathUtils.degToRad(3);
  const hStabR = buildLiftingSurfacePanel(rootChord * 0.6, tipChord * 0.75, 33, hHalf, fuseR * 0.14, 1, bodyMat);
  group.add(mountWithDihedral(hStabR, 1, hDihedral, hRootPos));
  const hStabL = buildLiftingSurfacePanel(rootChord * 0.6, tipChord * 0.75, 33, hHalf, fuseR * 0.14, -1, bodyMat);
  group.add(mountWithDihedral(hStabL, -1, hDihedral, hRootPos));

  // ---------------------------------------------------------------
  // LANDING GEAR — twin wheels per leg (nose + both mains), matching
  // real narrow-body gear rather than a single wheel per strut.
  // ---------------------------------------------------------------
  const gearGroup = new THREE.Group();
  gearGroup.name = "gear";
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.9 });
  function makeGearLeg(x, z, twin) {
    const leg = new THREE.Group();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(fuseR * 0.06, fuseR * 0.06, fuseR * 1.1, 6), darkMat);
    strut.position.y = -fuseR * 0.55;
    leg.add(strut);
    const wheelR = fuseR * 0.22, wheelW = fuseR * 0.16;
    const offsets = twin ? [-wheelW * 0.55, wheelW * 0.55] : [0];
    offsets.forEach(zOff => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 12), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(0, -fuseR * 1.05, zOff);
      leg.add(wheel);
    });
    leg.position.set(x, -fuseR * 0.35, z);
    return leg;
  }
  gearGroup.add(makeGearLeg(halfLen * 0.30, 0, true));               // nose (twin)
  gearGroup.add(makeGearLeg(-L * 0.02, halfSpan * 0.22, true)); // main right (twin)
  gearGroup.add(makeGearLeg(-L * 0.02, -halfSpan * 0.22, true));// main left (twin)
  group.add(gearGroup);

  // ---------------------------------------------------------------
  // LIGHTS
  // ---------------------------------------------------------------
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
