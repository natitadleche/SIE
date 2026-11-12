/*
 * Configuración ÚNICA de Tailwind (CDN 3.4.17) para todo SCOSIE.
 * Se carga justo después de <script src="https://cdn.tailwindcss.com/3.4.17">.
 * Los valores vienen de stitch_.../scosie_industrial_design_system/DESIGN.md:
 *  - "colors" del encabezado YAML (tokens Material que usa Stitch).
 *  - Colores de la sección de texto (sidebar, eléctrico, semánticos de estado).
 * Si cambia el sistema de diseño, se cambia aquí y en ningún otro lugar.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // --- Tokens Material (encabezado de DESIGN.md / Stitch) ---
        'surface': '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'surface-variant': '#d3e4fe',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#43474e',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        'outline': '#74777f',
        'outline-variant': '#c4c6cf',
        'surface-tint': '#455f87',
        'primary': '#022448',
        'on-primary': '#ffffff',
        'primary-container': '#1e3a5f',
        'on-primary-container': '#8aa4cf',
        'inverse-primary': '#adc8f5',
        'primary-fixed': '#d5e3ff',
        'primary-fixed-dim': '#adc8f5',
        'on-primary-fixed': '#001c3b',
        'on-primary-fixed-variant': '#2d486d',
        'secondary': '#006398',
        'on-secondary': '#ffffff',
        'secondary-container': '#5bb8fe',
        'on-secondary-container': '#00476e',
        'secondary-fixed': '#cce5ff',
        'secondary-fixed-dim': '#93ccff',
        'on-secondary-fixed': '#001d31',
        'on-secondary-fixed-variant': '#004b73',
        'tertiary': '#342000',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#503400',
        'on-tertiary-container': '#d9971a',
        'tertiary-fixed': '#ffddb0',
        'tertiary-fixed-dim': '#ffba46',
        'on-tertiary-fixed': '#281800',
        'on-tertiary-fixed-variant': '#614000',
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'background': '#f8f9ff',
        'on-background': '#0b1c30',

        // --- Paleta industrial (texto de DESIGN.md) ---
        'nav': { DEFAULT: '#0F2537', texto: '#94A3B8' }, // sidebar
        'cobalto': '#2B4C7E',
        'electrico': '#0284C7',
        'linea': '#E2E8F0',      // bordes y divisores
        'apagado': '#64748B',    // texto secundario / unidades

        // --- Semánticos de estado (badges, alertas) ---
        'ok':      { DEFAULT: '#16A34A', tinte: '#DCFCE7', texto: '#15803D', borde: '#BBF7D0' },
        'aviso':   { DEFAULT: '#CA8A04', tinte: '#FEF9C3', texto: '#854D0E', borde: '#FEF08A' },
        'peligro': { DEFAULT: '#DC2626', tinte: '#FEE2E2', texto: '#B91C1C', borde: '#FECACA' },
        'info':    { DEFAULT: '#0284C7', tinte: '#E0F2FE', texto: '#0369A1', borde: '#BAE6FD' },
        'archivo': { DEFAULT: '#475569', tinte: '#F1F5F9', texto: '#475569', borde: '#CBD5E1' },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-xl':        ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl-mobile': ['28px', { lineHeight: '34px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg':        ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg-mobile': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md':        ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-lg':           ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'title-md':           ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'body-lg':            ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':            ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm':            ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-md':           ['13px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-sm':           ['11px', { lineHeight: '14px', letterSpacing: '0.04em', fontWeight: '600' }],
        'tabular-code':       ['13px', { lineHeight: '18px', letterSpacing: '0em', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem', // inputs, botones, tablas
        md: '0.75rem',
        lg: '1rem',        // tarjetas y paneles
        xl: '1.5rem',      // drawers y hojas móviles
        full: '9999px',    // solo badges y avatares
      },
      spacing: {
        'gutter': '1.25rem',
        'gutter-sm': '0.75rem',
        'gutter-lg': '1.5rem',
        'margin': '1.5rem',
        'margin-mobile': '1rem',
        'margin-desktop': '2rem',
        'space-xxs': '0.125rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '0.75rem',
        'space-lg': '1rem',
        'space-xl': '1.5rem',
        'space-2xl': '2rem',
        'space-3xl': '3rem',
      },
      boxShadow: {
        // Niveles de elevación de DESIGN.md
        'elev-1': '0 1px 3px 0 rgba(15, 37, 55, 0.05)',
        'elev-2': '0 4px 6px -1px rgba(15, 37, 55, 0.07), 0 2px 4px -2px rgba(15, 37, 55, 0.04)',
        'elev-3': '0 10px 15px -3px rgba(15, 37, 55, 0.1), 0 4px 6px -4px rgba(15, 37, 55, 0.05)',
        'elev-4': '0 20px 25px -5px rgba(15, 37, 55, 0.15), 0 8px 10px -6px rgba(15, 37, 55, 0.08)',
      },
      // Breakpoints: se usan los de Tailwind, que coinciden con DESIGN.md
      // md = 768px (tablet / riel de íconos), xl = 1280px (escritorio / sidebar completo).
    },
  },
};
