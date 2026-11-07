# ghostloop-ui design tokens

The dashboard reads like a flight recorder: pale instrument paper, black ink, a time axis on every screen that has time in it. Structure comes from type, hairline rules and space. There are no boxed panels, no stat tiles and no sidebar.

Every value used in the UI comes from this file. Add a token here before using a new value anywhere. All tokens are CSS variables in `src/app/globals.css`, defined once for light and once for dark.

## Theme

Light is the default. Dark follows `prefers-color-scheme` until the person picks one with the header toggle; the choice is stored in `localStorage` under `ghostloop_theme` (reads and writes wrapped in try/catch) and applied as `data-theme` on `<html>` before first paint.

## Colour

Neutrals are tinted cool. Nothing is pure black or pure white. Monochrome plus one alarm colour.

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#EDEEEB` | `#0B0C0D` | Page |
| `sheet` | `#E3E4E1` | `#161719` | Inputs, code, row hover, pressed |
| `ink` | `#111214` | `#E8E9E6` | Text, primary button, busy fill |
| `ink-2` | `#46494E` | `#A9ACAF` | Secondary text |
| `ink-3` | `#62656A` | `#8B8E92` | Column heads, axis, units, metadata |
| `rule` | `#C8CAC6` | `#2B2D30` | Hairlines (1 px) |
| `rule-strong` | `#A3A6A2` | `#46494D` | Input edges, axis ticks, hatch lines |
| `idle` | `#7C7F83` | `#76797D` | Idle fill on the timeline |
| `alarm` | `#C21F18` | `#FF5B4F` | Error state and Critical alarms only, always next to the word |

Contrast ratios (WCAG 2 formula):

| Pair | Light | Dark |
|---|---|---|
| `ink` on `paper` | 16.09 | 16.06 |
| `ink-2` on `paper` | 7.76 | 8.58 |
| `ink-3` on `paper` | 5.02 | 5.95 |
| `ink-3` on `sheet` | 4.58 | 5.45 |
| `alarm` on `paper` | 5.15 | 6.40 |
| `idle` fill on `paper` | 3.45 | 4.48 |
| `idle` fill against `ink` fill | 4.66 | 3.59 |

## Robot state

State is a word first. On the timeline each state also has its own fill, so the strip still reads in greyscale print:

| State | Word style | Strip fill |
|---|---|---|
| Busy | `ink`, 600 | Solid `ink` |
| Idle | `ink-2`, 400 | Solid `idle` |
| Offline | `ink-3`, 400 | 45 degree hatch, `rule-strong` lines 1 px every 4 px on `paper` |
| Error | `alarm`, 600 | Solid `alarm` |
| Not recorded | none | Dotted `rule` baseline only |

Alarm markers sit on the strip at their raise time: a 2 px tall-stroke tick that rises 4 px above the strip, `alarm` for Critical, `ink` for Warning, `ink-3` for Info.

## Type

Two families. Schibsted Grotesk for headings and interface text. JetBrains Mono for robot names, alarm codes, IDs, numbers and timestamps. Numbers use tabular figures and sit right-aligned in tables.

| Token | Size / line height | Tracking | Weight | Use |
|---|---|---|---|---|
| `display` | 44 / 48 (30 / 34 under 640) | -0.025em | 600 | Overview status sentence |
| `title` | 30 / 36 (26 / 32 under 640) | -0.02em | 600 | Page title |
| `heading` | 17 / 24 | -0.01em | 600 | Section heading |
| `body` | 15 / 22 | 0 | 400 | Default text |
| `small` | 13 / 18 | 0 | 400 | Secondary lines, column heads |
| `mono` | 13 / 20 | 0 | 400 / 500 | Names, codes, values |
| `mono-sm` | 12 / 16 | 0.01em | 400 | Axis ticks, time gutter on phones |

Column heads are `small` in `ink-3`, sentence case. No tiny uppercase labels.

## Spacing

4 px scale only: 4, 8, 12, 16, 24, 32, 48, 64. Page gutter 40 at 1440, 24 at tablet, 16 on phones. Space inside a group 8-12, between sections 48-64.

## Radius

| Token | Value | Use |
|---|---|---|
| `r` | 3 | Buttons, inputs, code blocks |

Strips, markers and rules are square.

## Elevation

Flat. One shadow, only for things that float: the phone navigation sheet and the timeline readout.
`0 1px 2px rgba(17,18,20,0.18), 0 6px 16px rgba(17,18,20,0.14)` (dark: alpha 0.6 and 0.5 on black).

## Controls

| Control | Height | Notes |
|---|---|---|
| Button | 40 (36 for row actions at 768 and up) | Padding 16. Primary: `ink` fill, `paper` label. Secondary: `sheet` fill, `ink` label. |
| Input | 40 | `sheet` fill, `rule-strong` border, focus border `ink` |
| Top bar | 56 | Links are text; active link is `ink` with a 2 px `ink` underline on the bar edge |
| Table row | 44 min | Hairline `rule` between rows, hover `sheet` |

Press feedback: 1 px downward translate on `:active`, 120 ms. No fades, glows, gradients (hatching only), status dots, pills or looping animation. Respect `prefers-reduced-motion`.

## Icons

lucide-react, 16 px, stroke 1.75, only for copy, external link, menu, close and the theme toggle.
