import { describe, it, expect } from 'vitest'
import {
  blankState,
  applyEvent,
  dispatchFor,
  classOf,
  type GamepadEvent,
  type PadState,
} from './gamepad'

function axis(code: string, value: number): GamepadEvent {
  return { pad_id: 0, pad_name: 'test', kind: 'axis', code, value }
}

function button(kind: 'button_press' | 'button_release', code: string): GamepadEvent {
  return { pad_id: 0, pad_name: 'test', kind, code, value: kind === 'button_press' ? 1 : 0 }
}

function stateWith(overrides: Partial<PadState>): PadState {
  return { ...blankState(), ...overrides }
}

describe('blankState', () => {
  it('starts neutral with no buttons held', () => {
    const s = blankState()
    expect(s.leftX).toBe(0)
    expect(s.leftY).toBe(0)
    expect(s.rightX).toBe(0)
    expect(s.rightY).toBe(0)
    expect(s.leftTrigger).toBe(0)
    expect(s.rightTrigger).toBe(0)
    expect(s.buttons.size).toBe(0)
  })
})

describe('applyEvent', () => {
  it('passes a stick value through once it clears the deadzone', () => {
    const s = applyEvent(blankState(), axis('LeftStickX', 0.5))
    expect(s.leftX).toBe(0.5)
  })

  it('zeroes a stick value inside the deadzone', () => {
    const s = applyEvent(blankState(), axis('LeftStickX', 0.05))
    expect(s.leftX).toBe(0)
  })

  it('maps trigger aliases (LeftZ/RightZ) onto the trigger fields', () => {
    const s = blankState()
    applyEvent(s, axis('LeftZ', 0.7))
    applyEvent(s, axis('RightTrigger', 0.9))
    expect(s.leftTrigger).toBe(0.7)
    expect(s.rightTrigger).toBe(0.9)
  })

  it('tracks button press and release', () => {
    const s = blankState()
    applyEvent(s, button('button_press', 'South'))
    expect(s.buttons.has('South')).toBe(true)
    applyEvent(s, button('button_release', 'South'))
    expect(s.buttons.has('South')).toBe(false)
  })

  it('mutates and returns the same state object', () => {
    const s = blankState()
    expect(applyEvent(s, axis('RightStickY', 0.3))).toBe(s)
  })
})

describe('dispatchFor: button primitives', () => {
  it('drone South takes off, East lands, North e-stops', () => {
    expect(dispatchFor('drone', stateWith({ buttons: new Set(['South']) }))).toEqual({
      name: 'takeoff',
      args: { altitude: 1.5 },
    })
    expect(dispatchFor('drone', stateWith({ buttons: new Set(['East']) }))?.name).toBe('land')
    expect(dispatchFor('drone', stateWith({ buttons: new Set(['North']) }))?.name).toBe(
      'emergency_stop',
    )
  })

  it('quadruped maps South/East/West to sit/stand/lie_down', () => {
    expect(dispatchFor('quadruped', stateWith({ buttons: new Set(['South']) }))?.name).toBe('sit')
    expect(dispatchFor('quadruped', stateWith({ buttons: new Set(['East']) }))?.name).toBe('stand')
    expect(dispatchFor('quadruped', stateWith({ buttons: new Set(['West']) }))?.name).toBe(
      'lie_down',
    )
  })
})

describe('dispatchFor: continuous control', () => {
  it('returns null when the mobile base sticks are centered', () => {
    expect(dispatchFor('mobile_base', blankState())).toBeNull()
  })

  it('drives the mobile base from the left stick, inverting forward push', () => {
    const d = dispatchFor('mobile_base', stateWith({ leftY: -0.8, leftX: 0.4 }))
    expect(d?.name).toBe('drive')
    // pushing the stick forward (negative Y) should command positive linear_x
    expect(d?.args.linear_x).toBeCloseTo(0.8)
    expect(d?.args.angular_z).toBeCloseTo(-0.4)
  })

  it('scales arm end-effector motion by 0.3 and ignores tiny input', () => {
    expect(dispatchFor('arm', stateWith({ rightX: 0.001 }))).toBeNull()
    const d = dispatchFor('arm', stateWith({ rightX: 1, rightY: 1 }))
    expect(d?.name).toBe('move_to')
    expect(d?.args.x).toBeCloseTo(0.3)
    expect(d?.args.y).toBeCloseTo(0.3)
  })
})

describe('dispatchFor: auto fallback', () => {
  it('routes takeoff/land buttons to the drone mapper', () => {
    expect(dispatchFor('auto', stateWith({ buttons: new Set(['South']) }))?.name).toBe('takeoff')
  })

  it('otherwise behaves like the mobile base', () => {
    expect(dispatchFor('auto', stateWith({ leftY: -0.8 }))?.name).toBe('drive')
  })
})

describe('classOf', () => {
  it('defaults to auto when no profile is given', () => {
    expect(classOf()).toBe('auto')
    expect(classOf('something-unmapped')).toBe('auto')
  })

  it('maps known profile keywords to robot classes', () => {
    expect(classOf('tello-drone')).toBe('drone')
    expect(classOf('Boston Dynamics Spot')).toBe('quadruped')
    expect(classOf('turtlebot3')).toBe('mobile_base')
    expect(classOf('franka-panda')).toBe('arm')
    expect(classOf('unitree-h1')).toBe('humanoid')
  })
})
