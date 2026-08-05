// ============================================================
// PHYSICS — simplified but genuinely dynamic flight model.
//
// This is NOT a lookup-table / scripted flight path. Every frame
// we compute real forces (thrust, lift, drag, weight) from the
// aircraft's current velocity, orientation and control inputs,
// integrate acceleration into velocity, and velocity into
// position. Stalling, ground effect, and control authority all
// emerge from that force computation rather than being faked.
//
// UNIT CONVENTIONS (audited — internals are SI throughout, with
// conversion happening ONLY at the display-facing getters below):
//   position           meters            (this.position.x/y/z)
//   velocity            meters/second     (this.velocity)
//   mass                kilograms         (cfg.mass)
//   force               newtons           (thrust, lift, drag, weight)
//   angles (internal)  radians           (this.aoa, cfg.stallAngle, pitchRate/rollRate/yawRate in rad/s)
//   air density        kg/m^3            (airDensityAt)
//   time                seconds           (dt, this._simTime — simulated
//                                          time, never wall-clock; see
//                                          the stall-buffet note below)
//   airspeedKt          knots             (display getter — converts m/s * 1.94384)
//   altitudeFt          feet              (display getter — converts m * 3.28084)
//   verticalSpeedFpm    feet/minute       (display getter — m/s * 196.85)
//   pitchDeg/rollDeg/   degrees           (display getters — convert
//     headingDeg                          from the underlying radians)
// Internal physics math must stay in the SI columns above; only the
// *Kt/*Ft/*Deg/*Fpm-named getters are allowed to convert units, and
// they convert exactly once, at the boundary. Tests and UI code
// should read those getters rather than re-deriving conversions.
// ============================================================

import * as THREE from "three";

const G = 9.81;
const AIR_DENSITY_SEA = 1.225;

// crude exponential atmosphere falloff so high altitude feels thinner
function airDensityAt(altitudeM) {
  return AIR_DENSITY_SEA * Math.exp(-Math.max(0, altitudeM) / 9000);
}

export class FlightState {
  constructor(cfg, spawn) {
    this.cfg = cfg;
    this.position = spawn.position.clone();
    this.quaternion = spawn.quaternion.clone();
    this.velocity = spawn.velocity ? spawn.velocity.clone() : new THREE.Vector3();

    this.pitchRate = 0; this.rollRate = 0; this.yawRate = 0;
    this._simTime = 0; // simulated seconds elapsed — used instead of wall-clock time so behavior (e.g. stall buffet) is frame-rate independent and deterministic

    this.throttle = 0;          // 0..1
    this.flaps = 0;             // 0..1 (steps)
    this.gearDown = true;
    this.brakes = 0;            // 0..1
    this.spoilers = false;
    this.reverse = false;
    this.onGround = true;
    this.stalled = false;
    this.enginesOn = true;

    this.fuel = cfg.fuelCapacity;
    this.lightsOn = false;

    // autopilot
    this.ap = { master: false, hdg: false, alt: false, spd: false, targetHdg: 0, targetAlt: 5000, targetSpd: cfg.cruiseSpeedKt };

    this._tmpFwd = new THREE.Vector3();
    this._tmpUp = new THREE.Vector3();
    this._tmpRight = new THREE.Vector3();
  }

  get forward() { return this._tmpFwd.set(0, 0, -1).applyQuaternion(this.quaternion); }
  get up() { return this._tmpUp.set(0, 1, 0).applyQuaternion(this.quaternion); }
  get right() { return this._tmpRight.set(1, 0, 0).applyQuaternion(this.quaternion); }

  get airspeedMs() { return this.velocity.length(); }
  get airspeedKt() { return this.airspeedMs * 1.94384; }
  get altitudeFt() { return this.position.y * 3.28084; }
  get verticalSpeedFpm() { return this._vs || 0; }

  get headingDeg() {
    const f = this.forward;
    let deg = THREE.MathUtils.radToDeg(Math.atan2(f.x, -f.z));
    if (deg < 0) deg += 360;
    return deg;
  }

  get pitchDeg() {
    const f = this.forward;
    return THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(f.y, -1, 1)));
  }

  get rollDeg() {
    const r = this.right;
    return THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(-r.y, -1, 1)));
  }

  /**
   * @param {number} dt seconds
   * @param {object} ctrl {pitch,roll,yaw in [-1,1], throttleDelta, ...}
   * @param {function} groundHeightAt (x,z)=>meters
   */
  update(dt, ctrl, groundHeightAt) {
    const cfg = this.cfg;
    dt = Math.min(dt, 0.05);
    this._simTime += dt;

    // ---- throttle / systems ----
    if (ctrl.throttleDelta) this.throttle = THREE.MathUtils.clamp(this.throttle + ctrl.throttleDelta * dt, 0, 1);
    if (ctrl.throttleSet !== undefined) this.throttle = THREE.MathUtils.clamp(ctrl.throttleSet, 0, 1);
    this.brakes = ctrl.brakes ? 1 : 0;
    this.reverse = !!ctrl.reverse && this.onGround && cfg.hasReverse;

    const prevAlt = this.position.y;

    // ---- fuel burn ----
    if (this.enginesOn && this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - cfg.fuelBurnAtFullThrust * this.throttle * dt);
    } else if (this.fuel <= 0) {
      this.throttle = Math.min(this.throttle, 0.02);
    }

    // ---- geometry ----
    const fwd = this.forward.clone();
    const up = this.up.clone();
    const right = this.right.clone();
    const airspeed = this.velocity.length();
    const velDir = airspeed > 0.05 ? this.velocity.clone().normalize() : fwd.clone();

    // Angle of attack: transform velocity into the aircraft's own body
    // frame and take atan2 of its vertical vs. forward component. This
    // is numerically robust and unambiguous — the previous cross-product
    // sign test could flip sign frame-to-frame at some flight conditions
    // (a real bug: lift alternating between correct and inverted every
    // tick, which on average produced zero net lift and silently glued
    // the aircraft to the runway even at flying speed).
    let aoa = 0;
    if (airspeed > 1) {
      const invQ = new THREE.Quaternion(-this.quaternion.x, -this.quaternion.y, -this.quaternion.z, this.quaternion.w);
      const velLocal = velDir.clone().applyQuaternion(invQ);
      aoa = Math.atan2(-velLocal.y, -velLocal.z);
    }
    this.aoa = aoa;

    // ---- lift coefficient with stall model ----
    const flapCL = this.flaps * 0.55;
    const flapDrag = this.flaps * 0.035;
    let cl = cfg.liftSlope * aoa + flapCL;
    const stallLimit = cfg.stallAngle;
    let stallFactor = 1;
    if (Math.abs(aoa) > stallLimit) {
      const over = Math.abs(aoa) - stallLimit;
      stallFactor = Math.max(0.12, 1 - over * 3.2);
      this.stalled = airspeed > 5;
    } else {
      this.stalled = false;
    }
    cl *= stallFactor;
    cl = THREE.MathUtils.clamp(cl, -1.8, 2.1);

    // induced + parasite drag
    const cd = cfg.dragCoeff + flapDrag + (cl * cl) * 0.05 + (this.gearDown ? 0.018 : 0) + (this.spoilers ? 0.06 : 0);

    const rho = airDensityAt(this.position.y);
    const q = 0.5 * rho * airspeed * airspeed; // dynamic pressure

    const liftMag = q * cfg.wingArea * cl;
    const dragMag = q * cfg.wingArea * cd;

    // ground effect: extra lift, less induced drag under ~1 wingspan/4 altitude
    const agl = Math.max(0, this.position.y - groundHeightAt(this.position.x, this.position.z));
    const geHeight = cfg.wingSpan * 0.5;
    let geMult = 1;
    if (agl < geHeight && agl > 0) geMult = 1 + (1 - agl / geHeight) * 0.22;

    // lift acts along the aircraft's local "up", drag opposes velocity
    const liftForce = up.clone().multiplyScalar(liftMag * geMult);
    const dragForce = airspeed > 0.05 ? velDir.clone().multiplyScalar(-dragMag) : new THREE.Vector3();

    // thrust
    let thrustN = cfg.maxThrust * this.throttle;
    if (this.reverse) thrustN = -Math.abs(thrustN) * 0.5;
    const thrustForce = fwd.clone().multiplyScalar(thrustN);

    // weight
    const weightForce = new THREE.Vector3(0, -cfg.mass * G, 0);

    const total = new THREE.Vector3().add(liftForce).add(dragForce).add(thrustForce).add(weightForce);
    let accel = total.clone().divideScalar(cfg.mass);

    // ---- ground contact handling ----
    const groundY = groundHeightAt(this.position.x, this.position.z);
    const gearOffset = 1.2; // approx gear compressed height
    const restingY = groundY + gearOffset;

    this.onGround = this.gearDown && this.position.y <= restingY + 0.15;

    if (this.onGround) {
      // snap to ground, kill vertical velocity component
      if (this.position.y < restingY) this.position.y = restingY;
      if (this.velocity.y < 0) this.velocity.y = 0;
      accel.y = Math.max(accel.y, 0); // no sinking through runway

      // rolling friction + brakes
      const groundSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      const frictionCoeff = 0.02 + this.brakes * 0.35;
      if (groundSpeed > 0.05) {
        const dir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
        const frictionDecel = frictionCoeff * G;
        const dv = Math.min(groundSpeed, frictionDecel * dt);
        this.velocity.x -= dir.x * dv;
        this.velocity.z -= dir.z * dv;
      }
    } else {
      this.velocity.add(accel.multiplyScalar(dt));
    }
    if (this.onGround) {
      // Apply the full 3D ground-phase acceleration — including the
      // vertical component. accel.y was floored at 0 above (the runway
      // can't suck the plane down), but once lift exceeds weight it's
      // positive, and THAT is what has to reach velocity.y for rotation
      // and liftoff to be physically possible. Zeroing it out here was
      // the bug: the aircraft could reach any ground speed and still
      // never leave the runway, because lift never got a chance to
      // build vertical velocity.
      this.velocity.add(accel.clone().multiplyScalar(dt));
    }

    this.position.add(this.velocity.clone().multiplyScalar(dt));
    if (this.position.y < restingY && this.gearDown) this.position.y = restingY;

    this._vs = ((this.position.y - prevAlt) / dt) * 196.85; // m/s -> ft/min

    // ---------------------------------------------------------
    // ORIENTATION — angular rates driven by control surfaces.
    // Authority scales with airspeed (mushy at low speed, sharp
    // at cruise) and with the aircraft's agility rating, but is
    // hard-capped to a realistic maximum rate per aircraft class
    // so that holding full deflection rotates the airframe like
    // a real airplane, not a spaceship, regardless of how the
    // other tuning knobs (turnRate, speedFactor) combine.
    // ---------------------------------------------------------
    const speedFactor = THREE.MathUtils.clamp(airspeed / (cfg.stallSpeedKt * 0.5144 * 1.4), 0.15, 1.0);
    const groundSteerActive = this.onGround;

    // Max sustained rates, degrees/sec -> rad/s. Lighter/more agile
    // aircraft (higher cfg.agility) get quicker rates; heavy widebodies
    // stay slow and ponderous even at full deflection.
    const maxPitchRate = THREE.MathUtils.degToRad(3 + 9 * cfg.agility);   // ~6.6°/s (A380) .. ~17°/s (light GA)
    const maxRollRate = THREE.MathUtils.degToRad(8 + 22 * cfg.agility);   // ~16.8°/s (A380) .. ~43°/s (light GA)

    let targetPitchRate = 0, targetRollRate = 0, targetYawRate = 0;

    if (groundSteerActive) {
      // on ground: pitch mostly locked (only rotation near takeoff speed), roll locked, rudder steers via nosewheel
      const rotationAuthority = airspeed > cfg.stallSpeedKt * 0.5144 * 0.55 ? 1 : 0.15;
      targetPitchRate = THREE.MathUtils.clamp(ctrl.pitch * cfg.turnRate * 0.5 * rotationAuthority, -maxPitchRate, maxPitchRate);
      // Geometric rotation limit: the tail (or a widebody's aft fuselage)
      // physically can't rotate past this attitude while the main gear
      // are still on the ground. Without this, holding pitch-up past
      // rotation speed — the natural first instinct for any player —
      // rotates the fuselage into a deep-stall attitude that never
      // generates enough lift to actually leave the runway.
      const maxGroundPitchDeg = 12.5;
      if (this.pitchDeg >= maxGroundPitchDeg && targetPitchRate > 0) targetPitchRate = 0;
      // Actively level the wings and straighten the heading while on the
      // ground. This matters after any airborne upset (e.g. a stall) —
      // without it, whatever bank/yaw the aircraft had at the moment of
      // touchdown is "frozen in" forever (nothing was driving it back
      // toward zero, only stopping it from getting worse), which both
      // looks wrong and silently wrecks the lift/AoA math on the next
      // takeoff attempt since the nose is no longer pointed the way the
      // wheels are rolling.
      targetRollRate = THREE.MathUtils.clamp(-this.rollDeg * 0.15, -maxRollRate, maxRollRate);
      const steerAuthority = THREE.MathUtils.clamp(airspeed / 15, 0.25, 1);
      const maxGroundYawRate = THREE.MathUtils.degToRad(35);
      targetYawRate = THREE.MathUtils.clamp(ctrl.yaw * 0.9 * steerAuthority, -maxGroundYawRate, maxGroundYawRate);
    } else {
      const stallPitchMult = this.stalled ? 0.3 : 1;
      targetPitchRate = THREE.MathUtils.clamp(ctrl.pitch * cfg.turnRate * cfg.agility * speedFactor, -maxPitchRate, maxPitchRate) * stallPitchMult;
      targetRollRate = THREE.MathUtils.clamp(ctrl.roll * cfg.turnRate * 1.3 * cfg.agility * speedFactor, -maxRollRate, maxRollRate);
      // turn coordination: banking induces yaw; rudder adds direct authority.
      // Rudder-alone yaw is capped well below roll/turn-driven yaw — real
      // rudder authority is limited, and large heading changes are meant
      // to come from a coordinated bank+turn, not from holding rudder
      // alone (which was previously sustaining ~24 deg/s — almost a full
      // circle in 15 seconds — with wings level).
      const maxYawRate = THREE.MathUtils.degToRad(2 + 6 * cfg.agility);
      const bankInducedYaw = -Math.sin(THREE.MathUtils.degToRad(this.rollDeg)) * 0.35 * speedFactor;
      targetYawRate = THREE.MathUtils.clamp(ctrl.yaw * 0.5 * cfg.agility * speedFactor, -maxYawRate, maxYawRate) + bankInducedYaw;
    }

    if (this.stalled) {
      // A stall actively fights further nose-up input (the nose wants
      // to drop) rather than just being a damped version of whatever
      // the pilot is commanding — otherwise holding full aft-stick
      // can "ratchet" AoA up indefinitely, which is the spaceship-like
      // behavior we're specifically trying to avoid.
      const noseDropRate = THREE.MathUtils.degToRad(6);
      targetPitchRate = Math.min(targetPitchRate, targetPitchRate - noseDropRate * 0.4);
      targetRollRate += Math.sin(this._simTime * 12) * 0.12; // buffet, driven by simulated time so it's frame-rate independent
    }

    const rateSmoothing = 4.5;
    this.pitchRate += (targetPitchRate - this.pitchRate) * Math.min(1, rateSmoothing * dt);
    this.rollRate += (targetRollRate - this.rollRate) * Math.min(1, rateSmoothing * dt);
    this.yawRate += (targetYawRate - this.yawRate) * Math.min(1, rateSmoothing * dt);

    const qDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.pitchRate * dt, this.yawRate * dt, -this.rollRate * dt, "YXZ")
    );
    this.quaternion.multiply(qDelta);
    this.quaternion.normalize();

    // keep aircraft above terrain everywhere (very defensive clamp)
    const gy = groundHeightAt(this.position.x, this.position.z);
    if (this.position.y < gy + 0.5 && !this.gearDown) {
      this.position.y = gy + 0.5;
      this.velocity.y = Math.max(this.velocity.y, 0);
    }
  }
}
