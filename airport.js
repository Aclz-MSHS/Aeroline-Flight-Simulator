// ============================================================
// AIRPORTS — data-driven list + procedural runway/terminal meshes.
// Coordinates are local world-space meters (origin = main hub),
// NOT real geographic coordinates. Names are inspired by major
// hubs but these are original, fictionalized implementations.
// ============================================================

import * as THREE from "three";

export const AIRPORTS = [
  { code: "SGX", name: "Singapore – Changi Original", x: 0, z: 0, elevFt: 20,
    runways: [{ id: "02/20", heading: 20, length: 4000, width: 60 }, { id: "07/25", heading: 70, length: 3400, width: 55 }] },
  { code: "LNW", name: "London – Westgate", x: 6200, z: -3100, elevFt: 80,
    runways: [{ id: "09/27", heading: 90, length: 3600, width: 55 }] },
  { code: "NYK", name: "New York – Harborview", x: -7400, z: 2600, elevFt: 15,
    runways: [{ id: "04/22", heading: 40, length: 3800, width: 60 }, { id: "13/31", heading: 130, length: 3000, width: 50 }] },
  { code: "TKY", name: "Tokyo – Bayside", x: 5100, z: 5200, elevFt: 30,
    runways: [{ id: "16/34", heading: 160, length: 3300, width: 55 }] },
  { code: "DBX", name: "Dubai – Sandstar", x: -4600, z: -6200, elevFt: 100,
    runways: [{ id: "12/30", heading: 120, length: 4200, width: 60 }] },
  { code: "SYX", name: "Sydney – Southcross", x: 8600, z: -5200, elevFt: 40,
    runways: [{ id: "06/24", heading: 60, length: 3300, width: 50 }] },
  { code: "HKX", name: "Hong Kong – Islegate", x: -2600, z: 7200, elevFt: 25,
    runways: [{ id: "07/25", heading: 70, length: 3800, width: 55 }] },
  { code: "PRS", name: "Paris – Rivermont", x: 3400, z: -8200, elevFt: 300,
    runways: [{ id: "08/26", heading: 80, length: 3500, width: 55 }] },
  { code: "LAX2", name: "Los Angeles – Pacific Point", x: -8600, z: -3600, elevFt: 60,
    runways: [{ id: "24L/06R", heading: 240, length: 3700, width: 55 }] },
  { code: "FRW", name: "Frankfurt – Ostwald", x: 1200, z: 3400, elevFt: 350,
    runways: [{ id: "18/36", heading: 180, length: 3600, width: 55 }] },
  { code: "MTN", name: "Cascade Mountain Strip", x: 9200, z: 3200, elevFt: 2800,
    runways: [{ id: "11/29", heading: 110, length: 1600, width: 35 }] },
  { code: "ISL", name: "Coral Isle Field", x: -9600, z: 7600, elevFt: 10,
    runways: [{ id: "05/23", heading: 50, length: 1400, width: 30 }] },
  { code: "PLN", name: "Plains Regional", x: 2200, z: 8600, elevFt: 900,
    runways: [{ id: "14/32", heading: 140, length: 2200, width: 45 }] },
  { code: "GLC", name: "Glacier Point Aerodrome", x: -3200, z: -9200, elevFt: 3200,
    runways: [{ id: "01/19", heading: 10, length: 1500, width: 30 }] },
];

function makeRunwayTexture(idText) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#232527"; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#e7e9ec"; g.lineWidth = 8;
  // centerline dashes
  for (let y = 40; y < c.height - 40; y += 70) {
    g.beginPath(); g.moveTo(c.width / 2, y); g.lineTo(c.width / 2, y + 40); g.stroke();
  }
  // threshold stripes at both ends
  g.fillStyle = "#e7e9ec";
  for (let end = 0; end < 2; end++) {
    const base = end === 0 ? 16 : c.height - 16 - 90;
    for (let i = 0; i < 6; i++) {
      g.fillRect(24 + i * 34, base, 18, 90);
    }
  }
  // runway numbers
  g.save();
  g.fillStyle = "#e7e9ec";
  g.font = "bold 64px sans-serif";
  g.textAlign = "center";
  g.translate(c.width / 2, 150);
  g.fillText(idText, 0, 0);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function buildAirportMeshes(airport, heightAt) {
  const group = new THREE.Group();
  group.name = `airport_${airport.code}`;
  const baseY = heightAt(airport.x, airport.z);

  // apron / terminal pad
  const apronGeo = new THREE.CircleGeometry(260, 24);
  apronGeo.rotateX(-Math.PI / 2);
  const apron = new THREE.Mesh(apronGeo, new THREE.MeshStandardMaterial({ color: 0x33363b, roughness: 1 }));
  apron.position.set(airport.x, baseY + 0.05, airport.z);
  apron.receiveShadow = true;
  group.add(apron);

  // terminal building
  const term = new THREE.Mesh(
    new THREE.BoxGeometry(160, 22, 46),
    new THREE.MeshStandardMaterial({ color: 0xdfe6ec, roughness: 0.6, metalness: 0.1 })
  );
  term.position.set(airport.x + 220, baseY + 11, airport.z);
  term.castShadow = true; term.receiveShadow = true;
  group.add(term);
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 8, 60, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9d2da, roughness: 0.6 })
  );
  tower.position.set(airport.x + 160, baseY + 30, airport.z + 70);
  tower.castShadow = true;
  group.add(tower);

  const runwayLightGroup = new THREE.Group();
  runwayLightGroup.name = "runwayLights";

  airport.runways.forEach((rw, idx) => {
    const headingRad = THREE.MathUtils.degToRad(rw.heading);
    const dir = new THREE.Vector3(Math.sin(headingRad), 0, -Math.cos(headingRad));
    const [num1, num2] = rw.id.split("/");
    const tex = makeRunwayTexture(num1.replace(/[LRC]/, ""));
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
    const geo = new THREE.PlaneGeometry(rw.width, rw.length);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -headingRad;
    // offset runway a bit from apron center along a spread axis so multiple runways don't overlap
    const lateral = new THREE.Vector3(dir.z, 0, -dir.x).multiplyScalar(idx * 220);
    mesh.position.set(airport.x + lateral.x, baseY + 0.08, airport.z + lateral.z);
    mesh.receiveShadow = true;
    group.add(mesh);

    // runway edge lights
    const half = rw.length / 2;
    const halfW = rw.width / 2 + 2;
    const perp = new THREE.Vector3(dir.z, 0, -dir.x);
    for (let d = -half; d <= half; d += 60) {
      const centerPt = new THREE.Vector3(airport.x + lateral.x, baseY + 0.6, airport.z + lateral.z).addScaledVector(dir, d);
      [-1, 1].forEach(side => {
        const p = centerPt.clone().addScaledVector(perp, halfW * side);
        const light = new THREE.Mesh(new THREE.SphereGeometry(1.1, 5, 5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2c0, emissiveIntensity: 0 }));
        light.position.copy(p);
        runwayLightGroup.add(light);
      });
    }

    rw._worldStart = new THREE.Vector3(airport.x + lateral.x, baseY, airport.z + lateral.z).addScaledVector(dir, -half + 40);
    rw._worldEnd = new THREE.Vector3(airport.x + lateral.x, baseY, airport.z + lateral.z).addScaledVector(dir, half - 40);
    rw._headingRad = headingRad;
    rw._baseY = baseY;
  });

  group.add(runwayLightGroup);
  group.userData.runwayLightGroup = runwayLightGroup;
  group.userData.baseY = baseY;
  return group;
}

export function getSpawnTransform(airport, runwayId, groundHeightAt) {
  const rw = airport.runways.find(r => r.id === runwayId) || airport.runways[0];
  const headingRad = rw._headingRad !== undefined ? rw._headingRad : THREE.MathUtils.degToRad(rw.heading);
  const start = rw._worldStart || new THREE.Vector3(airport.x, 0, airport.z);
  const y = groundHeightAt(start.x, start.z) + 1.6;
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -headingRad, 0));
  return {
    position: new THREE.Vector3(start.x, y, start.z),
    quaternion: quat,
    heading: rw.heading,
  };
}
