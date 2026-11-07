# ghostloop-ui design tokens

Dark, monochrome control surface. Every value used in the UI comes from this list; add a token here before using a new value anywhere.
All tokens live as CSS variables in `src/app/globals.css`.

## Colour

Neutrals are tinted slightly cool. Nothing is pure black or pure white.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0E0F12` | Page background |
| `surface` | `#15161A` | Sidebar, panels, tables |
| `raised` | `#1C1E23` | Inputs, secondary buttons, row hover, code blocks |
| `active` | `#24262C` | Active nav item, pressed state |
| `line` | `#2C2F36` | Hairline dividers and panel edges |
| `line-strong` | `#3D4048` | Input borders, focus-free control edges |
| `text` | `#ECEDF0` | Primary text, primary button fill |
| `text-muted` | `#A4A8B1` | Secondary text |
| `text-faint` | `#868A94` | Labels, metadata, units (only on `bg` and `surface`) |
| `critical` | `#E5655F` | Critical alarms and errored robots only, always with a word |

Contrast against `surface`: text 15.4, muted 7.6, faint 5.1, critical 5.5. Primary button (`bg` on `text`) 16.4.

Severity and status are words first. Critical uses `critical` and bold; warning uses `text` and bold; info uses `text-muted` regular. Robot status: error is `critical`, busy is `text` semibold, idle is `text-muted`, offline is `text-faint`.

## Type

IBM Plex Sans for interface text, IBM Plex Mono for robot names, IDs, metric names and code. Numbers use tabular figures (`font-variant-numeric: tabular-nums`) and sit right-aligned in tables.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 28 / 32, -0.01em | 600 | Large stat values |
| `title` | 22 / 28, -0.01em | 600 | Page title |
| `heading` | 16 / 24 | 600 | Section heading |
| `body` | 14 / 20 | 400 | Default text |
| `small` | 13 / 18 | 400 | Secondary lines, table cells |
| `label` | 11 / 16, 0.06em, uppercase | 600 | Column headers, stat labels |
| `mono` | 13 / 20 (12 / 18 in code blocks) | 400 | Code, IDs |

## Spacing

4 px scale only: 4, 8, 12, 16, 24, 32, 48, 64. Page gutter 32 desktop, 16 phone. Space inside a group is 8-12, between groups 24-32.

## Radius

| Token | Value | Use |
|---|---|---|
| `r-sm` | 4 | Inline code, keyboard hints |
| `r-md` | 8 | Buttons, inputs, nav items, code blocks |
| `r-lg` | 12 | Panels |

Anything inset in a panel with 4 px padding uses 8 (12 minus 4).

## Elevation

Depth comes from the surface steps above. One shadow, only for things that float above the page (the phone navigation sheet):
`0 1px 2px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.35)`.

## Controls

| Control | Height | Notes |
|---|---|---|
| Button | 40 | Horizontal padding 16. Primary: `text` fill, `bg` label. Secondary: `raised` fill, `text` label. |
| Input | 40 | `raised` fill, `line-strong` border, focus border `text-muted` |
| Nav item | 36 desktop, 44 phone | Active: `active` fill, `text` label |
| Table row | 44 | Hover: `raised` |

Press feedback: 1 px downward translate on `:active`, 120 ms. No fades, no glows, no looping animation; respect `prefers-reduced-motion`.

## Icons

lucide-react only, 16 px, stroke 1.75, coloured `text-faint` or `text-muted`. Icons only where they aid scanning (navigation, copy, external link).
