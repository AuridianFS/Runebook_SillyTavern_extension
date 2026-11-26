// Pure helpers for the look of meters (gradients, effects). No DOM access: index.js renders, style.css styles.
import { FILL_STYLES, EFFECTS } from './engine.js';

const COLOR_RE = /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i;

export const DEFAULT_LOOK = { fill: 'solid', effect: 'none', colors: [] };
export const ANIMATION_MODES = ['auto', 'off'];

/** Ready-made looks: pick one in the builder to fill in colors, fill and effect. */
export const PRESETS = {
    fire: { colors: ['#ffeb3b', '#ff9800', '#e53935', '#7f0000'], fill: 'animated', effect: 'glow' },
    ocean: { colors: ['#00e5ff', '#2979ff', '#1a237e'], fill: 'gradient', effect: 'shimmer' },
    neon: { colors: ['#ff00e5', '#00e5ff', '#76ff03'], fill: 'animated', effect: 'glow' },
    royal: { colors: ['#ffd700', '#7e57c2', '#311b92'], fill: 'gradient', effect: 'shimmer' },
    'traffic light': { colors: ['#e53935', '#fdd835', '#43a047'], fill: 'stepped', effect: 'none' },
};

/** Split "#f00, gold #0f0" into color words. */
export function parseColors(text) {
    return String(text ?? '').split(/[\s,]+/).filter(Boolean);
}

/** Clean a saved "default look" object; anything invalid falls back to the plain default. Reads 2.5.x color/colorB too. */
export function normalizeLook(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const given = Array.isArray(r.colors) ? r.colors : [r.color, r.colorB];
    const colors = given.map((c) => String(c ?? '')).filter((c) => COLOR_RE.test(c)).slice(0, 26);
    return {
        fill: FILL_STYLES.includes(r.fill) ? r.fill : DEFAULT_LOOK.fill,
        effect: EFFECTS.includes(r.effect) ? r.effect : DEFAULT_LOOK.effect,
        colors,
    };
}

/**
 * Work out classes and CSS variables for one meter.
 * Meter fields win over the global default look; `colorOverride` (from an influence band) replaces Color A.
 * Up to four color stops (A-D) are spread evenly across a gradient. With nothing set the look is the original plain one.
 */
export function resolveLook(meter, look = DEFAULT_LOOK, colorOverride = '', pct = 0) {
    const fill = meter.fill ?? look.fill ?? 'solid';
    const effect = meter.effect ?? look.effect ?? 'none';
    const own = meter.colors ?? (meter.color ? [meter.color] : null);
    let colors = own ?? look.colors ?? [];
    if (colorOverride) colors = [colorOverride, ...colors.slice(1)];
    // Stepped: the meter range is cut into equal bands, one color each, and the whole meter takes the current band's color.
    if (fill === 'stepped' && colors.length > 1 && !colorOverride) {
        const idx = Math.min(Math.floor((Math.max(0, Math.min(100, pct)) / 100) * colors.length), colors.length - 1);
        colors = [colors[idx]];
    }
    const stops = colors.length ? colors : ['var(--SmartThemeQuoteColor)'];
    const classes = [];
    if (fill === 'gradient' || fill === 'animated') classes.push(`rb-fill-${fill}`);
    if (effect !== 'none') classes.push(`rb-fx-${effect}`);
    const vars = [];
    if (colors.length) vars.push(`--rb-a:${colors[0]}`, `--rb-color:${colors[0]}`);
    vars.push(`--rb-b:${stops[1] ?? stops[0]}`, `--rb-last:${stops[stops.length - 1]}`);
    // Plain list for linear-gradient(); animated gradients loop back to the first color so the motion is seamless.
    vars.push(`--rb-grad:${(fill === 'animated' ? [...stops, stops[0]] : stops.length > 1 ? stops : [stops[0], stops[0]]).join(',')}`);
    return { classes, vars, stops, fill, effect };
}

/** Per-pip variables: which two stops this pip sits between, how far along (0..1), and its index (for staggered animation). */
export function pipVars(i, total, stops = []) {
    const t = total > 1 ? i / (total - 1) : 0;
    const n = stops.length;
    if (n < 2) return `--i:${i}`;
    const seg = Math.min(Math.floor(t * (n - 1)), n - 2);
    const local = Math.round((t * (n - 1) - seg) * 100) / 100;
    return `--pa:${stops[seg]};--pb:${stops[seg + 1]};--p:${local};--i:${i}`;
}

function luminance(hex) {
    let h = hex.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length < 6) return null;
    const [r, g, b] = [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Non-blocking hint when a color will be hard to see on a dark or a light theme. Returns '' if fine. */
export function contrastWarning(color) {
    const c = String(color ?? '').trim().toLowerCase();
    if (!c) return '';
    const lum = c === 'black' ? 0 : c === 'white' ? 1 : c.startsWith('#') ? luminance(c) : null;
    if (lum == null) return '';
    if (lum < 0.02) return `"${color}" is very dark and may vanish on dark themes`;
    if (lum > 0.9) return `"${color}" is very light and may vanish on light themes`;
    return '';
}
