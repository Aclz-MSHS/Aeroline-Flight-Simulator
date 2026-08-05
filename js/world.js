// ============================================================
// WORLD — procedural terrain, sky/day-night, clouds, weather,
// and scattered scenery (forests / city blocks) built with
// InstancedMesh so thousands of props cost one draw call each.
// ============================================================

import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

// ---------- tiny deterministic value-noise (no external deps) ----------
function makeNoise2D(seed = 1337) {
  const perm = new Uint8Array(512);
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y, v = h < 2 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }
  return function noise2D(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const aa = perm[X + perm[Y]], ab = perm[X + perm[Y + 1]];
    const ba = perm[X + 1 + perm[Y]], bb = perm[X + 1 + perm[Y + 1]];
    return lerp(
      lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
      lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
      v
    );
  };
}

function fbm(noise, x, y, octaves = 5, lac = 2.05, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain; freq *= lac;
  }
  return sum / norm;
}

export class World {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.noise = makeNoise2D(42);
    this.size = 24000;             // world span in meters
    this.segments = 220;
    this.timeOfDayHours = 12;      // 0..24
    this.weather = "clear";
    this._cloudMeshes = [];
    this._cityLights = [];

    this.fog = new THREE.FogExp2(0x9fc4dd, 0.000045);
    scene.fog = this.fog;
  }

  // Builds the world in discrete stages, yielding a frame between each
  // so the loading screen can actually paint intermediate progress
  // instead of freezing on one long synchronous call.
  async build(onProgress) {
    const stages = [
      ["Sculpting terrain…", () => this._buildTerrain()],
      ["Filling the oceans…", () => this._buildOcean()],
      ["Raising the sky…", () => this._buildSky()],
      ["Painting clouds…", () => this._buildClouds()],
      ["Growing forests & cities…", () => this._buildScenery()],
      ["Calibrating atmosphere…", () => this._buildEnvironment()],
    ];
    for (let i = 0; i < stages.length; i++) {
      const [label, fn] = stages[i];
      onProgress && onProgress((i) / stages.length, label);
      await new Promise((r) => requestAnimationFrame(r));
      fn();
      await new Promise((r) => requestAnimationFrame(r));
    }
    onProgress && onProgress(1, "Ready for departure");
  }

  _buildEnvironment() {
    // A single static PMREM pass from the sky gives metal/glass surfaces
    // (aircraft fuselage, cockpit glass, ocean) believable soft reflections
    // without the cost of re-generating it every frame.
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.add(this.sky.clone());
      const rt = pmrem.fromScene(envScene, 0.04);
      this.scene.environment = rt.texture;
      pmrem.dispose();
    } catch (e) {
      // Non-fatal — sim runs fine without an environment map.
      console.warn("Environment map generation skipped:", e);
    }
  }

  // -------------------------------------------------------------
  heightAt(x, z) {
    // ocean ring far from spawn, rolling hills near center, mountains at edges
    const r = Math.hypot(x, z);
    const macro = fbm(this.noise, x * 0.00035, z * 0.00035, 5) * 1;
    const detail = fbm(this.noise, x * 0.0022, z * 0.0022, 4) * 0.25;
    let h = (macro * 0.75 + detail) * 480;
    // river valley: carve a winding trough
    const river = Math.abs(fbm(this.noise, x * 0.0006 + 50, 0, 3));
    if (river < 0.035) h -= (0.035 - river) * 900;
    // flatten a landing plain near the main airport (origin)
    const flat = THREE.MathUtils.smoothstep(r, 1400, 5200);
    h = THREE.MathUtils.lerp(0, h, flat);
    return Math.max(h, r > 9000 ? -30 : h); // ocean floor beyond world edge
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // continuous biome gradient stops (elevation in meters -> color)
    const stops = [
      { h: -40, c: new THREE.Color(0x0c2338) },  // deep water
      { h: -2,  c: new THREE.Color(0x1c4f66) },  // shallow water
      { h: 3,   c: new THREE.Color(0xcdbf8c) },  // beach/sand
      { h: 30,  c: new THREE.Color(0x3c6b34) },  // lowland green
      { h: 160, c: new THREE.Color(0x4d7a3a) },  // hill green
      { h: 320, c: new THREE.Color(0x6c6248) },  // upland scrub
      { h: 480, c: new THREE.Color(0x8c8478) },  // rock
      { h: 620, c: new THREE.Color(0xd8dbdd) },  // snow cap
    ];
    const sampleBiome = (h) => {
      if (h <= stops[0].h) return stops[0].c;
      for (let i = 1; i < stops.length; i++) {
        if (h <= stops[i].h) {
          const t = (h - stops[i - 1].h) / (stops[i].h - stops[i - 1].h);
          return stops[i - 1].c.clone().lerp(stops[i].c, THREE.MathUtils.clamp(t, 0, 1));
        }
      }
      return stops[stops.length - 1].c;
    };

    const tmpCol = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = this.heightAt(x, z);
      pos.setY(i, h);
      tmpCol.copy(sampleBiome(h));
      // subtle natural mottling so large flat color bands don't read as flat-shaded
      const variation = fbm(this.noise, x * 0.01 + 900, z * 0.01 + 900, 2) * 0.05;
      tmpCol.offsetHSL(0, 0, variation);
      colors[i * 3] = tmpCol.r; colors[i * 3 + 1] = tmpCol.g; colors[i * 3 + 2] = tmpCol.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0.02 });
    this.terrain = new THREE.Mesh(geo, mat);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  _buildOcean() {
    const geo = new THREE.PlaneGeometry(this.size * 1.6, this.size * 1.6, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x1c5c86, transparent: true, opacity: 0.88, roughness: 0.12, metalness: 0.05,
      clearcoat: 0.6, clearcoatRoughness: 0.25, reflectivity: 0.5,
    });
    this.ocean = new THREE.Mesh(geo, mat);
    this.ocean.position.y = 0;
    this.scene.add(this.ocean);
  }

  _buildSky() {
    this.sky = new Sky();
    this.sky.scale.setScalar(45000);
    this.scene.add(this.sky);
    const u = this.sky.material.uniforms;
    u.turbidity.value = 3.2;
    u.rayleigh.value = 1.8;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.8;

    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -1200;
    this.sunLight.shadow.camera.right = 1200;
    this.sunLight.shadow.camera.top = 1200;
    this.sunLight.shadow.camera.bottom = -1200;
    this.sunLight.shadow.camera.far = 6000;
    this.sunLight.shadow.bias = -0.0007;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.hemiLight = new THREE.HemisphereLight(0xbcd6ea, 0x2a2a1c, 0.55);
    this.scene.add(this.hemiLight);

    this.sunVec = new THREE.Vector3();
    this.setTimeOfDay(12); // sensible default so the env-map bake (next stage) sees a real sun
  }

  _buildClouds() {
    // procedurally painted puff texture
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.5)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);

    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 });
    this.cloudGroup = new THREE.Group();
    const count = 260;
    for (let i = 0; i < count; i++) {
      const s = new THREE.Sprite(mat.clone());
      const a = Math.random() * Math.PI * 2;
      const r = 800 + Math.random() * 9000;
      s.position.set(Math.cos(a) * r, 900 + Math.random() * 900, Math.sin(a) * r);
      const sc = 300 + Math.random() * 700;
      s.scale.set(sc, sc * 0.55, 1);
      s.material.opacity = 0.55 + Math.random() * 0.35;
      this.cloudGroup.add(s);
      this._cloudMeshes.push(s);
    }
    this.scene.add(this.cloudGroup);

    // low fog layer for weather
    const fogGeo = new THREE.PlaneGeometry(this.size, this.size);
    fogGeo.rotateX(-Math.PI / 2);
    this.groundFog = new THREE.Mesh(fogGeo, new THREE.MeshBasicMaterial({ color: 0xd7dee2, transparent: true, opacity: 0 }));
    this.groundFog.position.y = 120;
    this.scene.add(this.groundFog);
  }

  _buildScenery() {
    // ----- forests (instanced cones) -----
    const treeGeo = new THREE.ConeGeometry(6, 22, 6);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x1f4a24, roughness: 1 });
    const TREE_COUNT = 4000;
    this.trees = new THREE.InstancedMesh(treeGeo, treeMat, TREE_COUNT);
    this.trees.castShadow = true;
    const dummy = new THREE.Object3D();
    let placed = 0, attempts = 0;
    while (placed < TREE_COUNT && attempts < TREE_COUNT * 6) {
      attempts++;
      const x = (Math.random() - 0.5) * this.size * 0.8;
      const z = (Math.random() - 0.5) * this.size * 0.8;
      const h = this.heightAt(x, z);
      const forestNoise = fbm(this.noise, x * 0.0009 + 500, z * 0.0009, 3);
      if (h > 15 && h < 380 && forestNoise > 0.12 && Math.hypot(x, z) > 1800) {
        dummy.position.set(x, h + 10, z);
        const s = 0.7 + Math.random() * 0.9;
        dummy.scale.set(s, s * (0.8 + Math.random() * 0.6), s);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();
        this.trees.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
    }
    this.trees.count = placed;
    this.scene.add(this.trees);

    // ----- city blocks (instanced boxes) near a couple of hubs -----
    const bldGeo = new THREE.BoxGeometry(1, 1, 1);
    const bldMat = new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.8, metalness: 0.1 });
    const BLD_COUNT = 900;
    this.buildings = new THREE.InstancedMesh(bldGeo, bldMat, BLD_COUNT);
    this.buildings.castShadow = true; this.buildings.receiveShadow = true;
    const hubs = [{ x: 2600, z: 1400 }, { x: -3400, z: -2200 }, { x: 500, z: -4200 }];
    let bp = 0;
    const cityLightPositions = [];
    for (const hub of hubs) {
      for (let i = 0; i < BLD_COUNT / hubs.length; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * 900;
        const x = hub.x + Math.cos(ang) * rad;
        const z = hub.z + Math.sin(ang) * rad;
        const h = this.heightAt(x, z);
        if (h < 5 || h > 200) continue;
        const height = 12 + Math.random() * (rad < 300 ? 140 : 45);
        dummy.position.set(x, h + height / 2, z);
        dummy.scale.set(14 + Math.random() * 10, height, 14 + Math.random() * 10);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();
        this.buildings.setMatrixAt(bp, dummy.matrix);
        bp++;
        if (Math.random() < 0.4) cityLightPositions.push(new THREE.Vector3(x, h + height + 1, z));
      }
    }
    this.buildings.count = bp;
    this.scene.add(this.buildings);

    // city lights (visible at night) as an instanced emissive sprite field
    const lightTex = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 16;
      const g = c.getContext("2d");
      g.fillStyle = "#ffdca0"; g.beginPath(); g.arc(8, 8, 7, 0, 7); g.fill();
      return new THREE.CanvasTexture(c);
    })();
    const lightMat = new THREE.SpriteMaterial({ map: lightTex, transparent: true, opacity: 0, depthWrite: false });
    this.cityLightGroup = new THREE.Group();
    for (const p of cityLightPositions) {
      const s = new THREE.Sprite(lightMat.clone());
      s.position.copy(p);
      s.scale.set(6, 6, 1);
      this.cityLightGroup.add(s);
    }
    this.scene.add(this.cityLightGroup);
  }

  // ---------------- day/night + weather updates ----------------
  setTimeOfDay(hours) {
    this.timeOfDayHours = hours;
    const t = hours / 24;
    const elevation = Math.sin((t - 0.25) * Math.PI * 2) * 90; // -90..90
    const azimuth = 180 + t * 360;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sunVec.setFromSphericalCoords(1, phi, theta);
    this.sky.material.uniforms.sunPosition.value.copy(this.sunVec);

    const dayFactor = THREE.MathUtils.clamp((elevation + 6) / 20, 0, 1);
    this.sunLight.position.copy(this.sunVec).multiplyScalar(3000);
    this.sunLight.target.position.set(0, 0, 0);
    this.sunLight.intensity = THREE.MathUtils.lerp(0.05, 2.4, dayFactor);
    const warmth = THREE.MathUtils.clamp(1 - Math.abs(elevation) / 25, 0, 1);
    this.sunLight.color.setHSL(0.11 - warmth * 0.05, 0.6, THREE.MathUtils.lerp(0.55, 0.92, dayFactor));
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.08, 0.6, dayFactor);

    const nightColor = new THREE.Color(0x040711);
    const dayColor = new THREE.Color(0x9fc4dd);
    this.fog.color.copy(nightColor).lerp(dayColor, dayFactor);
    if (this.scene.background !== undefined) this.scene.background = null;

    const cityOpacity = THREE.MathUtils.clamp(1 - dayFactor * 1.4, 0, 0.95);
    if (this.cityLightGroup) this.cityLightGroup.children.forEach(s => s.material.opacity = cityOpacity);

    this.nightFactor = 1 - dayFactor;
    this.dayFactor = dayFactor;
  }

  setWeather(kind) {
    this.weather = kind;
    const presets = {
      clear:    { cloudOpacity: 0.0, fogDensity: 0.000045, groundFog: 0 },
      partly:   { cloudOpacity: 0.6, fogDensity: 0.00006,  groundFog: 0 },
      overcast: { cloudOpacity: 1.0, fogDensity: 0.00009,  groundFog: 0.05 },
      rain:     { cloudOpacity: 1.0, fogDensity: 0.00014,  groundFog: 0.12 },
      storm:    { cloudOpacity: 1.0, fogDensity: 0.0002,   groundFog: 0.2 },
      fog:      { cloudOpacity: 0.4, fogDensity: 0.00045,  groundFog: 0.55 },
    };
    this.preset = presets[kind] || presets.clear;
    this.groundFog.material.opacity = this.preset.groundFog;
  }

  update(dt, camPos) {
    this.fog.density = this.preset ? this.preset.fogDensity : 0.00005;
    const cloudTarget = this.preset ? this.preset.cloudOpacity : 0;
    this.cloudGroup.children.forEach((s, i) => {
      const base = 0.55 + (i % 5) * 0.06;
      s.material.opacity = THREE.MathUtils.lerp(s.material.opacity, base * (0.3 + cloudTarget), dt * 0.5);
      s.position.x += dt * 2.0;
      if (s.position.x > this.size / 2) s.position.x = -this.size / 2;
    });
    this.groundFog.position.x = camPos.x;
    this.groundFog.position.z = camPos.z;
  }
}
