---
name: SCOSIE Industrial Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f87'
  primary: '#022448'
  on-primary: '#ffffff'
  primary-container: '#1e3a5f'
  on-primary-container: '#8aa4cf'
  inverse-primary: '#adc8f5'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#342000'
  on-tertiary: '#ffffff'
  tertiary-container: '#503400'
  on-tertiary-container: '#d9971a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#adc8f5'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#2d486d'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#ffddb0'
  tertiary-fixed-dim: '#ffba46'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: IBM Plex Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  tabular-code:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

### Brand Personality & Philosophy
This design system embodies technical rigor, operational efficiency, and industrial reliability. Designed specifically for low-voltage electrical engineering and field management operations in Mexico, the UI radiates absolute composure, structural discipline, and architectural clarity. The interface acts as precision equipment: utilitarian without feeling crude, sophisticated without unnecessary ornamentation, and optimized for split-second legibility across control room desktops and ruggedized field tablets under variable sunlight.

### Design Movement
**Corporate / Industrial Modern**: A hybrid of corporate clarity and high-density technical design. The visual rhythm relies on crisp structural boundaries, balanced white space, purposeful contrast ratios, and tabular accuracy. Visual hierarchy is established through surface elevation tiers, subtle containment borders, and targeted industrial safety color accents, preventing visual fatigue across 10-hour operational shifts.

## Colors

### Primary Palette & Tonal Hierarchy
- **Deep Industrial Navy (`#0F2537`)**: Anchors primary navigation bars, deep sidebars, high-level headers, and high-impact actions. Provides institutional authority.
- **Primary Navy (`#1E3A5F`)**: Core interaction token for standard interactive states, active navigation indicators, key metrics, and dominant brand elements.
- **Cobalt Accent (`#2B4C7E`)**: Secondary interactive depth, active hover tiers, and table header emphasis.
- **Electric Blue (`#0284C7`)**: Dynamic highlight color representing live electrical diagnostics, telemetric feeds, active links, and electrical blueprint overlays.

### Neutral & Surface Foundation
- **Canvas Base (`#F4F6F9`)**: Soft neutral foundation preventing glare in outdoor and bright technical settings.
- **Surface Pure (`#FFFFFF`)**: Component canvas, table containers, card backdrops, and active modal sheets.
- **Divider & Border (`#E2E8F0`)**: Low-contrast architectural containment lines for dense forms and tabular matrices.
- **Muted Slate (`#64748B`)**: Secondary text, unit indicators (e.g., `V`, `A`, `kW`), and passive metadata.
- **Text Primary (`#334155` to `#0F2537`)**: High-contrast, fatigue-free body and tabular numerical copy.

### Operational Safety & Semantic Accents
- **Verde Seguridad (Normativa STPS / CFE)**: `#16A34A` (Solid) / `#DCFCE7` (Tint). Applied to "Obra Terminada", "Circuito Desenergizado Seguro", "Aprobado", and normal crew statuses.
- **Amarillo Advertencia / En Proceso**: `#CA8A04` (Solid) / `#FEF9C3` (Tint). Designates "En Ejecución", "Revisión de Transformador", "Maniobra Programada", and cautionary load thresholds.
- **Rojo Urgente / Falla**: `#DC2626` (Solid) / `#FEE2E2` (Tint). Reserved for "Sobrecarga Crítica", "Falla de Aislamiento", "Riesgo de Arco", and overdue technical deliverables.
- **Azul Prospección / Cotizada**: `#0284C7` (Solid) / `#E0F2FE` (Tint). Indicates "Cotizada", "Planificación", and preliminary engineering surveys.

## Typography

### Structural Guidance
IBM Plex Sans delivers the necessary engineering aesthetic: neutral grottesco proportions with humanized terminals and distinct character distinction (e.g., distinguishing numeral `1`, uppercase `I`, and lowercase `l`), imperative for serial codes, breaker capacities, and conductor measurements (AWG/kcmil).

### Data & Technical Formatting
- Enable OpenType tabular figures (`font-variant-numeric: tabular-nums`) across all tables, load calculations, voltmeter readouts, and catalog indices.
- Standard form labels and data headers employ `label-sm` with slight uppercase tracking (`0.04em`) to ensure legibility when scanning multi-row electrical schedules.

## Layout & Spacing

### Layout Architecture
- **Desktop (>= 1280px)**: Persistent structural sidebar (260px fixed width), 12-column fluid grid, 24px gutters, and 32px outer canvas margins. Tables and dashboards use full-width expansion with sticky table headers and vertical scroll locks.
- **Tablet / Rugged Toughbook (768px - 1279px)**: Collapsible icon-only rail sidebar (72px width), 8-column layout, 16px gutters, and 24px outer margins.
- **Mobile Handheld (< 768px)**: Single column stacked layout with bottom navigation sheet or top app bar with flyout menu, 16px outer margins, and 12px card-to-card gaps.

### Density Philosophy
This design system favors a compact operational baseline over consumer-style negative space. Padding inside table cells, equipment rows, and field input sheets defaults to 8px-12px vertical spacing to maximize visible line items per viewport without causing mis-taps.

## Elevation & Depth

### Atmospheric Model
Elevation follows a clean physical stacking metaphor using subtle low-blur drop shadows paired with precision hairline strokes (`1px solid #E2E8F0`). This ensures containers remain visually distinct on non-calibrated field monitors and rugged laptops without requiring dark, distracting drop shadows.

### Elevation Levels
- **Level 0 (Flat Ground)**: Background canvas (`#F4F6F9`). No elevation or shadow.
- **Level 1 (Structural Containers & Tables)**: Background `#FFFFFF`, border `1px solid #E2E8F0`, shadow: `0 1px 3px 0 rgba(15, 37, 55, 0.05)`. Used for data cards, inventory tables, and form sections.
- **Level 2 (Hover States & Field Cards)**: Shadow: `0 4px 6px -1px rgba(15, 37, 55, 0.07), 0 2px 4px -2px rgba(15, 37, 55, 0.04)`. Applied to interactive cards, draggable crew assignments, and active work orders.
- **Level 3 (Flyouts, Popovers & Toolbars)**: Shadow: `0 10px 15px -3px rgba(15, 37, 55, 0.1), 0 4px 6px -4px rgba(15, 37, 55, 0.05)`. Used for datepickers, electrical asset selectors, and dropdown menus.
- **Level 4 (Modal Dialogs & Critical Alerts)**: Shadow: `0 20px 25px -5px rgba(15, 37, 55, 0.15), 0 8px 10px -6px rgba(15, 37, 55, 0.08)`. Accompanied by a semi-opaque backdrop blur overlay (`rgba(15, 37, 55, 0.5)` with `backdrop-filter: blur(4px)`).

## Shapes

### Shape Language
A measured roundedness index of `2` provides an engineering balance: sufficiently rounded to soften rigid data grids and forms, yet crisp enough to feel architecturally constructed rather than playful.

- **Base Radii (`rounded`, 0.5rem / 8px)**: Inputs, buttons, segmented controls, table containers, and filter chips.
- **Large Radii (`rounded-lg`, 1rem / 16px)**: High-level metric panels, field log cards, modal windows, and work order summary cards.
- **Extra Large Radii (`rounded-xl`, 1.5rem / 24px)**: Slide-over panels and mobile drawer sheets.
- **Pill (`rounded-full`)**: Exclusively reserved for status badges, crew avatar containers, and electrical phase indicators (A, B, C, N, G).

## Components

### Buttons
- **Primary**: Background `#1E3A5F`, text `#FFFFFF`, border `1px solid transparent`, radius `8px`. Hover: `#0F2537`. Focus: active ring `3px rgba(2, 132, 197, 0.35)`.
- **Secondary**: Background `#FFFFFF`, text `#1E3A5F`, border `1px solid #CBD5E1`. Hover: `#F8FAFC`, border `#94A3B8`.
- **Tertiary / Ghost**: Transparent surface, text `#2B4C7E`. Hover: `#EDF2F7`.
- **Critical / Danger**: Background `#DC2626`, text `#FFFFFF`. Hover: `#B91C1C`.
- **Tactile Sizing**: Minimum touch target of 40px height on desktop, 48px on mobile/field views for glove compatibility.

### Badges de Estado (Work Order & Installation Status)
- Structured with high-contrast text and a tinted background fill:
  - **Cotizada**: Background `#E0F2FE`, text `#0369A1`, border `1px solid #BAE6FD`.
  - **En Proceso**: Background `#FEF9C3`, text `#854D0E`, border `1px solid #FEF08A`. Optional pulsing dot for active field operations.
  - **Terminada**: Background `#DCFCE7`, text `#15803D`, border `1px solid #BBF7D0`.
  - **Archivada**: Background `#F1F5F9`, text `#475569`, border `1px solid #CBD5E1`.

### Data Tables (Cuadrillas, Tableros & Transformadores)
- **Header Row**: Background `#F8FAFC`, uppercase `label-sm`, color `#475569`, border bottom `2px solid #E2E8F0`.
- **Table Cells**: Height 48px (standard) or 36px (dense mode), vertical align middle, text `body-md` / `tabular-code`.
- **Alternating Zebra Rows**: Subtle alternating backgrounds (`#FFFFFF` to `#FBFCFE`) with a `#F1F5F9` hover state for quick scanning across 20+ columns.
- **Sticky Column**: Row selector checkbox and Equipment Tag ID pinned to the left edge with a subtle vertical separator shadow.

### Field Log Cards (Bitácora de Campo)
- Surface `#FFFFFF` with `rounded-lg`, border `1px solid #E2E8F0`, padding `16px`.
- Header houses work-order ID, datetime stamp in `tabular-code`, and crew supervisor badge.
- Content zone supports photo attachments of transformer nameplates or panel wiring, accompanied by sign-off timestamps.

### Form Inputs & Selectors
- Standard text input, electrical measurement fields, and dropdowns use border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F2537`, radius `8px`, height 40px.
- Focus state triggers border `#0284C7` and outline ring `3px rgba(2, 132, 197, 0.2)`.
- Units (e.g., `kVA`, `V`, `Hz`, `m`) are locked into a right-aligned fixed gray adornment (`#F1F5F9`, color `#64748B`).

### Navigation Sidebar
- Fixed width of 260px, background `#0F2537`, text `#94A3B8`.
- Active item indicator: Left border `4px solid #0284C7`, background `rgba(255, 255, 255, 0.08)`, text `#FFFFFF`.
- Integrated section groups: *Operaciones* (Obras, Cuadrillas, Bitácora), *Ingeniería & Activos* (Tableros, Transformadores, Memorias Técnicas), and *Administración* (Cotizaciones, Almacén).