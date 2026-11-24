/**
 * Runebook engine: pure logic, no SillyTavern or DOM access.
 * Validates rulebooks, applies chat messages to meter state, and builds the
 * text that gets injected into the prompt.
 */

export const METER_TYPES = ['bar', 'pips', 'number'];
export const SOURCES = ['user', 'ai', 'both'];
export const FREQUENCIES = ['always', 'once_per_chat'];
export const PIP_SHAPES = ['circle', 'heart', 'star', 'square'];
export const BAR_STYLES = ['bar', 'slider'];
const COLOR_RE = /^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i;
const ICON_RE = /^[a-z0-9 -]{1,40}$/;

const DICE_RE = /^([+-]?)(\d*)d(\d+)([+-]\d+)?$/i;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function slugify(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'runebook';
}

/** True if spec is a number or dice notation like "1d20", "-1d4", "2d6+1". */
export function isValidAmount(spec) {
    return isNum(spec) || (typeof spec === 'string' && DICE_RE.test(spec.trim()));
}

/** Resolve a number or dice string to a number. */
export function resolveAmount(spec, rng = Math.random) {
    if (isNum(spec)) return spec;
    const m = DICE_RE.exec(String(spec).trim());
    if (!m) return 0;
    const count = m[2] === '' ? 1 : parseInt(m[2], 10);
    const sides = parseInt(m[3], 10);
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.floor(rng() * sides) + 1;
    total += m[4] ? parseInt(m[4], 10) : 0;
    return m[1] === '-' ? -total : total;
}

function normalizeMeter(raw, i) {
    const where = `Meter ${i + 1}`;
    if (!raw || typeof raw !== 'object') throw new Error(`${where} must be an object`);
    const name = String(raw.name ?? '').trim();
    if (!name) throw new Error(`${where} is missing a name`);
    const type = raw.type ?? 'bar';
    if (!METER_TYPES.includes(type)) throw new Error(`Meter "${name}" has invalid type "${type}" (use ${METER_TYPES.join(', ')})`);

    const min = raw.min ?? 0;
    const max = raw.max ?? (type === 'number' ? 1e9 : 100);
    if (!isNum(min) || !isNum(max) || max <= min) throw new Error(`Meter "${name}" needs numeric min < max`);

    const start = raw.start ?? raw.startValue ?? min;
    if (!isNum(start)) throw new Error(`Meter "${name}" start must be a number`);

    const meter = { id: String(raw.id ?? slugify(name)), name, type, min, max, start: clamp(start, min, max) };

    // Optional look: icon (emoji or Font Awesome classes), color, pip shape, bar style.
    if (raw.icon != null) {
        const icon = String(raw.icon).trim();
        if (icon.startsWith('fa-') ? !ICON_RE.test(icon) : [...icon].length > 4) {
            throw new Error(`Meter "${name}" icon must be an emoji or Font Awesome classes like "fa-solid fa-heart"`);
        }
        meter.icon = icon;
    }
    if (raw.color != null) {
        if (!COLOR_RE.test(String(raw.color))) throw new Error(`Meter "${name}" color must be like "#ff6b9d" or "red"`);
        meter.color = String(raw.color);
    }
    if (raw.pip != null) {
        if (!PIP_SHAPES.includes(raw.pip)) throw new Error(`Meter "${name}" pip must be one of ${PIP_SHAPES.join(', ')}`);
        meter.pip = raw.pip;
    }
    if (raw.style != null) {
        if (!BAR_STYLES.includes(raw.style)) throw new Error(`Meter "${name}" style must be one of ${BAR_STYLES.join(', ')}`);
        meter.style = raw.style;
    }

    if (raw.decay != null) {
        const { after, amount } = raw.decay;
        if (!Number.isInteger(after) || after < 1 || !isNum(amount)) {
            throw new Error(`Meter "${name}" decay needs {"after": whole number >= 1, "amount": number}`);
        }
        meter.decay = { after, amount };
    }
    return meter;
}

function normalizeRule(raw, i, meters) {
    if (!raw || typeof raw !== 'object') throw new Error(`Rule ${i + 1} must be an object`);

    // Legacy format: { condition: {type, words}, action: {type, meterId, change|value, frequency} }
    let r = raw;
    if (raw.condition && raw.action) {
        if (typeof raw.condition !== 'object') throw new Error(`Rule ${i + 1}: function conditions are no longer supported, use "keywords"`);
        r = {
            id: raw.id, name: raw.name, on: raw.on,
            keywords: raw.condition.words, regex: raw.condition.pattern,
            meter: raw.action.meterId, frequency: raw.action.frequency,
            ...(raw.action.type === 'set_meter' ? { set: raw.action.value } : { change: raw.action.change }),
        };
    }

    const name = String(r.name ?? `Rule ${i + 1}`).trim();
    const ref = String(r.meter ?? '').toLowerCase();
    const meter = meters.find((m) => m.id.toLowerCase() === ref || m.name.toLowerCase() === ref);
    if (!meter) throw new Error(`Rule "${name}" references unknown meter "${r.meter}"`);

    const keywords = (Array.isArray(r.keywords) ? r.keywords : []).map((k) => String(k).trim()).filter(Boolean);
    const regex = r.regex ? String(r.regex) : '';
    if (!keywords.length && !regex) throw new Error(`Rule "${name}" needs "keywords" or "regex"`);
    if (regex) {
        try { new RegExp(regex, 'iu'); } catch (e) { throw new Error(`Rule "${name}" has an invalid regex: ${e.message}`); }
    }

    const hasChange = r.change !== undefined;
    const hasSet = r.set !== undefined;
    if (hasChange === hasSet) throw new Error(`Rule "${name}" needs exactly one of "change" or "set"`);
    if (!isValidAmount(hasChange ? r.change : r.set)) throw new Error(`Rule "${name}" has an invalid amount (use a number or dice like "1d6")`);

    const on = r.on ?? 'both';
    if (!SOURCES.includes(on)) throw new Error(`Rule "${name}" has invalid "on" (use ${SOURCES.join(', ')})`);
    const frequency = FREQUENCIES.includes(r.frequency) ? r.frequency : 'always';

    const rule = { id: String(r.id ?? `rule_${i + 1}`), name, meter: meter.id, on, keywords, regex, frequency };
    if (hasChange) rule.change = r.change; else rule.set = r.set;
    return rule;
}

function normalizeInfluence(raw, i, meters) {
    const where = `Influence ${i + 1}`;
    if (!raw || typeof raw !== 'object') throw new Error(`${where} must be an object`);
    const ref = String(raw.meter ?? '').toLowerCase();
    const meter = meters.find((m) => m.id.toLowerCase() === ref || m.name.toLowerCase() === ref);
    if (!meter) throw new Error(`${where} references unknown meter "${raw.meter}"`);
    const status = String(raw.status ?? '').trim();
    const text = String(raw.text ?? '').trim();
    const description = String(raw.description ?? '').trim();
    const color = raw.color != null ? String(raw.color) : '';
    if (!status && !text && !description) throw new Error(`${where} needs "status", "text" or "description"`);
    if (color && !COLOR_RE.test(color)) throw new Error(`${where} color must be like "#ff6b9d" or "red"`);
    const min = raw.min ?? meter.min;
    const max = raw.max ?? meter.max;
    if (!isNum(min) || !isNum(max) || max < min) throw new Error(`${where} needs numeric min <= max`);
    return { meter: meter.id, min, max, status, text, description, color };
}

/** Validate raw JSON and return a clean rulebook. Throws Error with a readable message. */
export function normalizeRulebook(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('A rulebook must be a JSON object');
    const name = String(raw.name ?? '').trim();
    if (!name) throw new Error('Rulebook needs a "name"');
    if (!Array.isArray(raw.meters) || !raw.meters.length) throw new Error('Rulebook needs at least one meter');

    const meters = raw.meters.map(normalizeMeter);
    const seen = new Set();
    for (const m of meters) {
        if (seen.has(m.id)) throw new Error(`Duplicate meter id "${m.id}"`);
        seen.add(m.id);
    }

    // "triggers" is accepted for backward compatibility and merged into rules.
    const rawRules = [...(raw.rules ?? []), ...(raw.triggers ?? [])];
    const rules = rawRules.map((r, i) => normalizeRule(r, i, meters));
    const ruleIds = new Set();
    for (const r of rules) {
        if (ruleIds.has(r.id)) throw new Error(`Duplicate rule id "${r.id}"`);
        ruleIds.add(r.id);
    }

    const influences = (raw.influences ?? []).map((inf, i) => normalizeInfluence(inf, i, meters));
    return { id: String(raw.id ?? slugify(name)), name, meters, rules, influences };
}

/** Fresh per-chat state for a rulebook. */
export function createState(rb) {
    return {
        values: Object.fromEntries(rb.meters.map((m) => [m.id, m.start])),
        quiet: {},
        fired: {},
    };
}

/** Make sure a stored state has an entry for every meter (rulebook may have been edited). */
export function repairState(rb, state) {
    const fresh = createState(rb);
    const values = {};
    for (const m of rb.meters) {
        const v = state?.values?.[m.id];
        values[m.id] = isNum(v) ? clamp(v, m.min, m.max) : fresh.values[m.id];
    }
    return { values, quiet: state?.quiet ?? {}, fired: state?.fired ?? {} };
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word, case-insensitive match so "hi" does not match "this". */
export function matchesRule(rule, text) {
    for (const kw of rule.keywords) {
        const re = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegex(kw)}(?![\\p{L}\\p{N}_])`, 'iu');
        if (re.test(text)) return true;
    }
    return rule.regex ? new RegExp(rule.regex, 'iu').test(text) : false;
}

/**
 * Apply one chat message to a rulebook's state. Mutates state.
 * @param {'user'|'ai'} source who wrote the message
 * @returns {{rule:string, meter:string, name:string, before:number, after:number}[]} what changed
 */
export function applyMessage(rb, state, text, source, rng = Math.random) {
    const log = [];
    const touched = new Set();

    for (const rule of rb.rules) {
        if (rule.on !== 'both' && rule.on !== source) continue;
        if (rule.frequency === 'once_per_chat' && state.fired[rule.id]) continue;
        if (!matchesRule(rule, text)) continue;

        const meter = rb.meters.find((m) => m.id === rule.meter);
        const before = state.values[meter.id];
        const amount = resolveAmount(rule.change ?? rule.set, rng);
        const after = clamp(rule.set !== undefined ? amount : before + amount, meter.min, meter.max);

        state.values[meter.id] = after;
        touched.add(meter.id);
        if (rule.frequency === 'once_per_chat') state.fired[rule.id] = true;
        log.push({ rule: rule.name, meter: meter.id, name: meter.name, before, after });
    }

    for (const meter of rb.meters) {
        if (!meter.decay) continue;
        if (touched.has(meter.id)) { state.quiet[meter.id] = 0; continue; }
        state.quiet[meter.id] = (state.quiet[meter.id] ?? 0) + 1;
        if (state.quiet[meter.id] >= meter.decay.after) {
            const before = state.values[meter.id];
            state.values[meter.id] = clamp(before + meter.decay.amount, meter.min, meter.max);
            state.quiet[meter.id] = 0;
            if (state.values[meter.id] !== before) log.push({ rule: 'Decay', meter: meter.id, name: meter.name, before, after: state.values[meter.id] });
        }
    }
    return log;
}

/** Per-meter status, description and color (first match each) plus prompt texts for current values. */
export function getInfluence(rb, state) {
    const statuses = {};
    const descriptions = {};
    const colors = {};
    const texts = [];
    for (const inf of rb.influences) {
        const v = state.values[inf.meter];
        if (v < inf.min || v > inf.max) continue;
        if (inf.status && !statuses[inf.meter]) statuses[inf.meter] = inf.status;
        if (inf.description && !descriptions[inf.meter]) descriptions[inf.meter] = inf.description;
        if (inf.color && !colors[inf.meter]) colors[inf.meter] = inf.color;
        if (inf.text) texts.push(inf.text);
    }
    return { statuses, descriptions, colors, texts };
}

/** Prompt block injected into the chat so the character reacts to the meters. */
export function buildPrompt(entries) {
    const blocks = [];
    for (const { rb, state } of entries) {
        const { statuses, texts } = getInfluence(rb, state);
        const lines = rb.meters.map((m) => {
            const status = statuses[m.id] ? ` (${statuses[m.id]})` : '';
            const range = m.type === 'number' ? '' : `/${m.max}`;
            return `- ${m.name}: ${state.values[m.id]}${range}${status}`;
        });
        blocks.push([`[Runebook: ${rb.name}]`, ...lines, ...texts].join('\n'));
    }
    return blocks.join('\n\n');
}
