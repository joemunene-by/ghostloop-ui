/**
 * Gamepad input mapper.
 *
 * Translates raw gamepad events (either from the Tauri shell's
 * `gamepad` event channel or the browser-native Gamepad API) into
 * ghostloop Intent dispatches.
 *
 * The mapping is profile-aware so the same Xbox / PS / 8BitDo /
 * generic-HID controller drives a drone, a mobile base, an arm, or
 * a quadruped naturally. The OS doesn't care if the controller is
 * wired USB or paired over Bluetooth: as long as the platform sees
 * it as a HID gamepad, the events arrive on the same channel.
 */

export type GamepadEvent = {
  pad_id: number
  pad_name: string
  kind: "axis" | "button_press" | "button_release"
  code: string
  /** Axis: -1..1. Button: 1 on press, 0 on release. */
  value: number
}

export type IntentDispatch = {
  name: string
  args: Record<string, unknown>
}

/**
 * Robot-class -> stick/button mapping.
 *
 * Per-class semantics are kept deliberately minimal so a non-coder
 * picks "I have a drone" and gets sensible defaults rather than a
 * config file to edit. Power users can override by hot-loading their
 * own mapper.
 */
export type RobotClass =
  | "drone"
  | "mobile_base"
  | "quadruped"
  | "arm"
  | "humanoid"
  | "auto"

const STICK_DEADZONE = 0.12
const TRIGGER_DEADZONE = 0.08

type Mapper = (state: PadState) => IntentDispatch | null

/**
 * Continuous stick / trigger state for the active pad. We translate
 * stick deltas into one Intent per UI frame (typically 60 Hz) rather
 * than one Intent per axis event, because a real flight stick emits
 * hundreds of axis events per second and we don't want to flood the
 * safety pipeline.
 */
export type PadState = {
  leftX: number
  leftY: number
  rightX: number
  rightY: number
  leftTrigger: number
  rightTrigger: number
  /** Buttons currently held. Names are gilrs / W3C-Gamepad-API compatible. */
  buttons: Set<string>
}

export function blankState(): PadState {
  return {
    leftX: 0,
    leftY: 0,
    rightX: 0,
    rightY: 0,
    leftTrigger: 0,
    rightTrigger: 0,
    buttons: new Set(),
  }
}

/**
 * Apply an incoming raw event to the persistent pad state. Returns
 * the same state object (mutated) so callers can chain a per-frame
 * mapper invocation.
 */
export function applyEvent(state: PadState, ev: GamepadEvent): PadState {
  if (ev.kind === "axis") {
    switch (ev.code) {
      case "LeftStickX":
        state.leftX = deadzone(ev.value, STICK_DEADZONE)
        break
      case "LeftStickY":
        state.leftY = deadzone(ev.value, STICK_DEADZONE)
        break
      case "RightStickX":
        state.rightX = deadzone(ev.value, STICK_DEADZONE)
        break
      case "RightStickY":
        state.rightY = deadzone(ev.value, STICK_DEADZONE)
        break
      case "LeftZ":
      case "LeftTrigger":
        state.leftTrigger = deadzone(ev.value, TRIGGER_DEADZONE)
        break
      case "RightZ":
      case "RightTrigger":
        state.rightTrigger = deadzone(ev.value, TRIGGER_DEADZONE)
        break
    }
  } else if (ev.kind === "button_press") {
    state.buttons.add(ev.code)
  } else if (ev.kind === "button_release") {
    state.buttons.delete(ev.code)
  }
  return state
}

function deadzone(v: number, dz: number): number {
  return Math.abs(v) < dz ? 0 : v
}

/**
 * Drone mapper:
 *   left stick Y    -> throttle (vertical climb rate, -1..1)
 *   left stick X    -> yaw rate (rotate around vertical axis)
 *   right stick Y   -> pitch (forward / backward)
 *   right stick X   -> roll (strafe left / right)
 *   A (South)       -> takeoff
 *   B (East)        -> land
 *   Y (North)       -> emergency stop
 *   triggers        -> fine altitude adjust (right = up, left = down)
 */
const droneMapper: Mapper = (s) => {
  if (s.buttons.has("South")) return { name: "takeoff", args: { altitude: 1.5 } }
  if (s.buttons.has("East")) return { name: "land", args: {} }
  if (s.buttons.has("North")) return { name: "emergency_stop", args: {} }
  const fineDz = s.rightTrigger - s.leftTrigger // -1..1
  const vz = clamp(s.leftY + fineDz * 0.3, -1, 1)
  const yaw = s.leftX
  const pitch = s.rightY
  const roll = s.rightX
  if (
    Math.abs(vz) < 0.05 &&
    Math.abs(yaw) < 0.05 &&
    Math.abs(pitch) < 0.05 &&
    Math.abs(roll) < 0.05
  ) {
    return null
  }
  return {
    name: "fly_to_relative",
    args: { vz, yaw_rate: yaw, pitch, roll },
  }
}

/** Mobile base mapper: tank-drive on the left stick, primitives on buttons. */
const mobileMapper: Mapper = (s) => {
  if (s.buttons.has("South")) return { name: "stop", args: {} }
  if (s.buttons.has("East")) return { name: "rotate", args: { dtheta: 1.57 } }
  const linear = -s.leftY // pushing forward => positive linear_x
  const angular = -s.leftX
  if (Math.abs(linear) < 0.05 && Math.abs(angular) < 0.05) return null
  return {
    name: "drive",
    args: { linear_x: linear, angular_z: angular },
  }
}

/** Quadruped mapper. Like mobile but with stand/sit/lie shortcuts. */
const quadrupedMapper: Mapper = (s) => {
  if (s.buttons.has("South")) return { name: "sit", args: {} }
  if (s.buttons.has("East")) return { name: "stand", args: {} }
  if (s.buttons.has("West")) return { name: "lie_down", args: {} }
  const linear = -s.leftY
  const angular = -s.leftX
  if (Math.abs(linear) < 0.05 && Math.abs(angular) < 0.05) return null
  return {
    name: "walk_to",
    args: { x: linear, y: 0, theta: angular },
  }
}

/** Arm mapper. Right stick drives end-effector X/Y, triggers Z, buttons grasp. */
const armMapper: Mapper = (s) => {
  if (s.buttons.has("South")) return { name: "set_gripper", args: { state: "open", force: 0 } }
  if (s.buttons.has("East")) return { name: "set_gripper", args: { state: "closed", force: 5 } }
  const x = s.rightX * 0.3
  const y = s.rightY * 0.3
  const z = (s.rightTrigger - s.leftTrigger) * 0.3
  if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01 && Math.abs(z) < 0.01) return null
  return { name: "move_to", args: { x, y, z } }
}

/** Humanoid mapper. Conservative: only gestures and look-at. */
const humanoidMapper: Mapper = (s) => {
  if (s.buttons.has("South")) return { name: "wave", args: { hand: "right" } }
  if (s.buttons.has("East")) return { name: "nod", args: { direction: "yes" } }
  if (s.buttons.has("North")) return { name: "emergency_stop", args: {} }
  if (Math.abs(s.rightX) < 0.05 && Math.abs(s.rightY) < 0.05) return null
  return {
    name: "look_at",
    args: { x: 1, y: -s.rightX, z: 1 + s.rightY },
  }
}

const MAPPERS: Record<RobotClass, Mapper> = {
  drone: droneMapper,
  mobile_base: mobileMapper,
  quadruped: quadrupedMapper,
  arm: armMapper,
  humanoid: humanoidMapper,
  auto: (s) => {
    // Fallback: try drone if user is mashing takeoff, otherwise mobile.
    if (s.buttons.has("South") || s.buttons.has("East")) return droneMapper(s)
    return mobileMapper(s)
  },
}

export function dispatchFor(
  cls: RobotClass,
  state: PadState,
): IntentDispatch | null {
  return MAPPERS[cls](state)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/**
 * Heuristic: map a ghostloop robot-profile name onto a RobotClass.
 * Lets the UI pick the right mapper without each profile having to
 * declare its class explicitly.
 */
export function classOf(profile?: string): RobotClass {
  if (!profile) return "auto"
  const p = profile.toLowerCase()
  if (p.includes("tello") || p.includes("drone") || p.includes("quadcopter"))
    return "drone"
  if (p.includes("spot") || p.includes("anymal") || p.includes("quadruped"))
    return "quadruped"
  if (p.includes("turtlebot") || p.includes("stretch") || p.includes("mobile"))
    return "mobile_base"
  if (p.includes("franka") || p.includes("ur") || p.includes("arm"))
    return "arm"
  if (p.includes("humanoid") || p.includes("h1") || p.includes("digit"))
    return "humanoid"
  return "auto"
}
