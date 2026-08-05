# AEROLINE — Browser Flight Simulator

A fully playable, original 3D flight simulator that runs in a desktop browser.
Built with **Three.js**, vanilla JavaScript modules, HTML/CSS, and the WebAudio
and Gamepad APIs. No build step, no external assets — everything (terrain,
clouds, runway markings, aircraft models, engine sound) is generated in code.

This is a **vertical slice**: one fully flyable world, six flying aircraft,
14 airports, working joystick/throttle/rudder, day-night cycle, weather,
autopilot, and four game modes. The architecture (see "Adding content"
below) is built so it expands without touching the physics engine.

## 1. Running it locally

**Entry point:** `index.html` (open it through a local server — see below,
not by double-clicking the file).

Because the app uses native ES module imports (`<script type="module">`) and
an import map, browsers require it to be served over `http://`, not opened
directly as a `file://` URL. From this folder (`flightsim/`), run:

```bash
python3 -m http.server 8000
```

Then open **`http://localhost:8000`** in a modern desktop browser (Chrome,
Edge, or Firefox — WebGL2 required). Three.js itself is loaded from a CDN
(unpkg) via the import map in `index.html`, so an internet connection is
needed on first load — this is unchanged from earlier builds; the renderer
has not been redesigned to work around any sandboxed/offline environment.

If you'd rather use Node instead of Python: `npx serve .` also works, on
whatever port it prints.

### What you should see

1. A loading screen (AEROLINE branding, animated plane glyph, staged
   progress bar) while the world builds.
2. The main menu, aircraft-selection grid defaulting to the **Airbus
   A320-200**, with a demo aircraft circling the main airport in the
   background.
3. Click **START FLIGHT** to spawn on the runway.

### Controls at a glance

| Action | Keyboard | On-screen |
|---|---|---|
| Pitch (nose down / up) | W / S | Joystick (vertical) |
| Bank (roll left / right) | A / D | Joystick (horizontal) |
| Rudder | Q / E | Rudder slider |
| Throttle | Shift (up) / Ctrl (down) | Throttle lever (drag) |
| Gear | G | GEAR button |
| Flaps | F (cycles) | FLAP+/FLAP- buttons |
| Brakes | B (hold) | BRK button |
| Reverse thrust | R (hold, on ground) | REV button |
| Camera cycle | V | CAM button |
| Map | M | MAP button |
| Pause | P | PAUSE button |
| **Developer telemetry** | **T** | **DEV button** (top right) |

The telemetry panel (T) shows IAS, altitude, vertical speed, pitch, bank,
AoA, heading, throttle, raw elevator/aileron/rudder input, flap position,
gear state, and ground/airborne state — all read live from the same
`FlightState` object driving the aircraft, so it's a direct window into
the physics rather than a separate display.

A physical gamepad/joystick, if connected, feeds the same control frame
as the keyboard and on-screen controls (see `js/input.js` — there is only
one control path, not a separate implementation per input device).

## 2. Project structure

```
flightsim/
├── index.html          # page shell, menu markup, HUD markup, import map
├── css/
│   └── style.css        # all UI styling (menu, HUD, controls, panels)
└── js/
    ├── main.js           # boot, menu wiring, game loop, input→control mapping, autopilot, map
    ├── aircraft.js        # aircraft configs (data) + procedural mesh builder
    ├── physics.js          # FlightState class — the actual flight dynamics
    ├── input.js             # keyboard / on-screen joystick+throttle+rudder / gamepad
    ├── world.js              # terrain, sky, day-night, clouds, weather, forests/city
    ├── airport.js              # airport data + runway/terminal mesh builder
    ├── camera.js                # cockpit / chase / wing / free / ground camera rig
    ├── audio.js                  # WebAudio-synthesized engine/wind/warning sounds
    └── hud.js                     # DOM instrument readouts
```

## 3. How the flight physics works

`physics.js` exports `FlightState`, which holds the aircraft's position,
velocity, orientation quaternion, and systems state (throttle, flaps, gear,
fuel, autopilot). Every simulation tick (`update(dt, controls, groundHeightAt)`)
it:

1. Computes true airspeed and **angle of attack** (angle between the nose and
   the velocity vector).
2. Derives a lift coefficient from AoA × the aircraft's lift-curve slope,
   plus a flap contribution — and **collapses it if AoA exceeds the stall
   angle**, which is what produces stall behavior (mushy controls, buffet,
   altitude loss) rather than a scripted animation.
3. Computes dynamic pressure from air density (which itself falls off with
   altitude) and true airspeed, then Lift = q·S·CL and Drag = q·S·CD.
4. Sums thrust (along the nose), lift (along local "up"), drag (opposing
   velocity) and weight (world -Y), divides by mass for acceleration, and
   integrates into velocity and position.
5. Applies **ground-effect** lift bonus near the runway, **ground contact**
   handling (rolling friction, brakes, no sinking through terrain), and
   **runway steering** (nosewheel authority at low speed, rudder authority
   at higher speed) when the aircraft is on the ground.
6. Turns control-stick input into angular *rates* (not direct rotation),
   scaled by airspeed and the aircraft's `agility` rating, and integrates
   those into the orientation quaternion — so a widebody genuinely rolls
   and pitches more slowly than a light single, and every aircraft feels
   mushy at low speed and crisp at cruise speed.

Nothing here is a lookup table of scripted flight paths — every aircraft
you add gets real force-based flight for free just by supplying different
mass/wing-area/thrust/drag numbers.

## 4. How the joystick / throttle / rudder work

`input.js` owns three touch-and-mouse-friendly widgets built with Pointer
Events (so the same code handles mouse *and* touchscreen):

- **Joystick** (`#joystick-zone`): a draggable puck constrained to a circle.
  Its normalized `x`/`y` map directly to roll/pitch in `main.js`.
- **Rudder** (`#rudder-zone`): a draggable puck constrained to a horizontal
  track, mapped to yaw.
- **Throttle** (`#throttle-zone`): a vertical lever whose position sets
  `throttle.value` (0–1) directly.

Keyboard input (`W/S/A/D`, arrow keys, `Q/E`, `Shift/Ctrl`) produces the same
normalized `{pitch, roll, yaw, throttleDelta}` shape, and if a Gamepad API
device is connected, its axes override both — so all three input sources
feed one unified control frame per frame, and `FlightState.update()` never
needs to know where the input came from.

Gamepad axis mapping (`input.pollGamepad()`): axis 0 = roll, axis 1 = pitch,
axis 2 = yaw, axis 3 = throttle (if present). Most USB flight sticks and
Xbox/PlayStation-style pads expose at least the first three.

## 5. Adding a new aircraft

Add one object to the `AIRCRAFT_LIST` array in `js/aircraft.js`:

```js
{
  id: "my-jet", name: "My Jet 100", category: "Regional",
  desc: "...", cruiseSpeedKt: 400, maxAltFt: 37000, passengers: 90, rangeNm: 2000,
  difficulty: "Medium",
  mass: 40000, wingArea: 90, wingSpan: 28, length: 30,
  maxThrust: 160000, dragCoeff: 0.03, liftSlope: 5.5,
  stallAngle: THREE.MathUtils.degToRad(14),
  maxSpeedKt: 430, stallSpeedKt: 115,
  fuelCapacity: 15000, fuelBurnAtFullThrust: 12,
  turnRate: 0.7, agility: 1.0,
  hasReverse: true, hasFlaps: true, propeller: false, gearRetractable: true,
  color: 0xffffff, accent: 0x224488,
}
```

No changes to `physics.js` are needed — the mesh builder in `aircraft.js`
scales an original procedural airframe from `length`/`wingSpan`, and the
physics model reads mass/wingArea/thrust/drag straight from the config.

## 6. Adding a new airport

Add one object to `AIRPORTS` in `js/airport.js`, with local world-space
`x`/`z` coordinates (meters from the map origin) and one or more runways:

```js
{ code: "XYZ", name: "My City – Fictional Field", x: 4000, z: -1000, elevFt: 50,
  runways: [{ id: "09/27", heading: 90, length: 3200, width: 55 }] }
```

`buildAirportMeshes()` procedurally lays down the apron, terminal, runway
surface (with generated centerline/threshold-marking texture), and edge
lights — no per-airport modeling required.

## 7. Performance notes

- Forests and city blocks are drawn with `THREE.InstancedMesh` (one draw
  call for thousands of trees/buildings) rather than individual meshes.
- Terrain is a single displaced plane (`PlaneGeometry` + noise-based height
  + per-vertex biome coloring), not per-tile streaming — simple, and fast
  enough for a ~24 km world at the current vertex density.
- Clouds are camera-facing sprites with a single shared canvas texture.
- The day/night sky uses Three.js's built-in physically-based `Sky` shader
  (one object, no baked HDRI to download).
- Distant detail is intentionally coarse (low-poly procedural airframes,
  simple box/cone scenery) so the frame stays smooth on ordinary laptops;
  a graphics-quality setting stub is included in `main.js` for you to wire
  up shadow-map resolution / draw distance if you extend the sim further.

## 8. What's implemented vs. what's a natural next step

Implemented and working: 3D procedural world with day/night + weather,
6 flyable aircraft with distinct handling, full joystick/throttle/rudder
(mouse, touch, keyboard, gamepad), 5 camera modes, 14 airports with
runways/taxiway aprons/terminals/lighting, take-off and landing ground
physics, stall modeling, a functional 3-axis autopilot (HDG/ALT/SPD hold),
an interactive 2D map, and four game modes (Free Flight, Takeoff, Landing
Challenge, Training).

Natural next steps if you keep building: animated control surfaces
(ailerons/elevator/rudder deflection on the mesh itself), a full cockpit
instrument 3D model for the first-person view, a real flight-plan router
with waypoints, and streaming/tiled terrain for a larger world.



# AEROLINE Windows Launcher

## Start AEROLINE

You do **not** need Python.

1. Keep the `flightsim` folder and the two launcher files together.
2. Double-click `Launch_AEROLINE.bat`.
3. A black window will appear.
4. Your browser should automatically open to:
   `http://127.0.0.1:8000/`
5. Keep the black window open while playing.
6. Close it with `Ctrl+C` when you are finished.

If the browser does not open automatically, manually enter:
`http://127.0.0.1:8000/`

This launcher uses Windows PowerShell and a local TCP server. It does not require Python, Node.js, npm, or a separate web-server installation.

## Important

The current AEROLINE project still loads Three.js from its configured external CDN. Therefore, your computer needs normal internet access for the current renderer to initialize.

This package does not change the AEROLINE physics or aircraft code.
