/**
 * Guided rulebook builder. The first half is pure data conversion (tested in Node);
 * the second half is the modal form, built with event delegation.
 */
import { normalizeRulebook, slugify } from './engine.js';

const OP_TO_SYMBOL = { eq: '=', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };
const SYMBOL_TO_OP = { '=': 'eq', '==': 'eq', '!=': 'neq', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte' };
const COMPARE_RE = /^\s*(.+?)\s*(>=|<=|!=|==|=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/;
const BOTH_RE = /^\s*(?:words|keywords)\s*:\s*(.*?)\s*;\s*regex\s*:\s*(.+?)\s*$/i;
const WORDS_RE = /^\s*(?:words|keywords)\s*:\s*(.+?)\s*$/i;
const REGEX_RE = /^\s*regex\s*:\s*(.+?)\s*$/i;

const str = (v) => (v === undefined || v === null ? '' : String(v));
const list = (v) => str(v).split(',').map((s) => s.trim()).filter(Boolean);

// ---------- condition lines ----------

/** One line of the form -> a raw condition. See HELP.conditions for the syntax. */
export function parseConditionLine(line) {
    let m = BOTH_RE.exec(line);
    if (m) return { keywords: list(m[1]), regex: m[2] };
    m = REGEX_RE.exec(line);
    if (m) return { regex: m[1] };
    m = WORDS_RE.exec(line);
    if (m) return { keywords: list(m[1]) };
    m = COMPARE_RE.exec(line);
    if (m) return { meter: m[1], operator: SYMBOL_TO_OP[m[2]], value: Number(m[3]) };
    return { keywords: list(line) };
}

/** A normalized condition -> one editable line. */
export function formatCondition(cond, meterNames) {
    if (cond.type === 'meter') return `${meterNames[cond.meter] ?? cond.meter} ${OP_TO_SYMBOL[cond.operator]} ${cond.value}`;
    if (cond.keywords.length && cond.regex) return `words: ${cond.keywords.join(', ')} ; regex: ${cond.regex}`;
    if (cond.regex) return `regex: ${cond.regex}`;
    return `words: ${cond.keywords.join(', ')}`;
}

const linesToConditions = (text) => str(text).split('\n').map((l) => l.trim()).filter(Boolean).map(parseConditionLine);

// ---------- field definitions ----------

export const HELP = {
    conditions: 'One check per line. Words: "words: love, care". Regex: "regex: \\bhello\\b". Meter: "Trust >= 3" (operators = != > >= < <=).',
};

// Field kinds: text, num, list (comma separated), area (multi-line), select, meter (pick a meter). wide = full row.
export const FIELDS = {
    meters: [
        { k: 'name', l: 'Name', t: 'text', wide: true },
        { k: 'type', l: 'Type', t: 'select', o: ['bar', 'pips', 'number'] },
        { k: 'min', l: 'Min', t: 'num' },
        { k: 'max', l: 'Max', t: 'num' },
        { k: 'start', l: 'Start', t: 'num' },
        { k: 'icon', l: 'Icon (emoji or fa-solid fa-heart)', t: 'text' },
        { k: 'color', l: 'Color (#ff6b9d)', t: 'text' },
        { k: 'style', l: 'Bar style', t: 'select', o: ['', 'bar', 'slider'] },
        { k: 'pip', l: 'Pip shape (pips only)', t: 'select', o: ['', 'circle', 'heart', 'star', 'square'] },
        { k: 'decay_after', l: 'Drift after N quiet messages', t: 'num' },
        { k: 'decay_amount', l: 'Drift amount (e.g. -1)', t: 'num' },
    ],
    rules: [
        { k: 'name', l: 'Name', t: 'text', wide: true },
        { k: 'meter', l: 'Meter it changes', t: 'meter' },
        { k: 'mode', l: 'Action', t: 'select', o: ['change', 'set'] },
        { k: 'amount', l: 'Amount (5, -3 or dice like 1d6)', t: 'text' },
        { k: 'keywords', l: 'Keywords (any of, comma separated)', t: 'list', wide: true },
        { k: 'regex', l: 'Regex (optional)', t: 'text', wide: true },
        { k: 'c_all', l: 'Also require ALL of (one per line)', t: 'area', wide: true, help: HELP.conditions },
        { k: 'c_any', l: 'Also require ANY of (one per line)', t: 'area', wide: true },
        { k: 'c_not', l: 'Block if ANY of these (one per line)', t: 'area', wide: true },
        { k: 'aiCondition', l: 'AI condition in plain English (needs AI-assisted mode)', t: 'area', wide: true },
        { k: 'on', l: 'Reads messages from', t: 'select', o: ['both', 'user', 'ai'] },
        { k: 'frequency', l: 'Frequency', t: 'select', o: ['always', 'once_per_chat'] },
        { k: 'cooldown', l: 'Cooldown (messages)', t: 'num' },
        { k: 'event', l: 'Event name (optional)', t: 'text' },
    ],
    milestones: [
        { k: 'name', l: 'Name', t: 'text', wide: true },
        { k: 'meter', l: 'Meter', t: 'meter' },
        { k: 'at', l: 'Crossing value', t: 'num' },
        { k: 'direction', l: 'Direction', t: 'select', o: ['either', 'up', 'down'] },
        { k: 'repeat', l: 'Fire', t: 'select', o: ['once', 'every time'] },
    ],
    influences: [
        { k: 'meter', l: 'Meter', t: 'meter' },
        { k: 'min', l: 'From', t: 'num' },
        { k: 'max', l: 'To', t: 'num' },
        { k: 'status', l: 'Status label', t: 'text' },
        { k: 'color', l: 'Color', t: 'text' },
        { k: 'description', l: 'On-screen description', t: 'text', wide: true },
        { k: 'text', l: 'Text sent to the AI', t: 'text', wide: true },
    ],
};

export const SECTION_TITLES = { meters: 'Meters', rules: 'Rules', milestones: 'Milestones', influences: 'Influences' };
const SINGULAR = { meters: 'meter', rules: 'rule', milestones: 'milestone', influences: 'influence' };

// ---------- draft <-> rulebook ----------

/** A normalized rulebook -> editable draft (every field is a string). */
export function rulebookToDraft(rb) {
    const names = Object.fromEntries(rb.meters.map((m) => [m.id, m.name]));
    const groupLines = (g) => (g ?? []).map((c) => formatCondition(c, names)).join('\n');
    return {
        id: rb.id,
        name: rb.name,
        meters: rb.meters.map((m) => ({
            ...Object.fromEntries(['id', 'name', 'type', 'min', 'max', 'start', 'icon', 'color', 'style', 'pip'].map((k) => [k, str(m[k])])),
            decay_after: str(m.decay?.after), decay_amount: str(m.decay?.amount),
        })),
        rules: rb.rules.map((r) => ({
            id: r.id, name: r.name, meter: r.meter,
            mode: r.set !== undefined ? 'set' : 'change', amount: str(r.set ?? r.change),
            keywords: r.keywords.join(', '), regex: r.regex,
            c_all: groupLines(r.conditions?.all), c_any: groupLines(r.conditions?.any), c_not: groupLines(r.conditions?.not),
            aiCondition: str(r.aiCondition), on: r.on, frequency: r.frequency, cooldown: str(r.cooldown), event: str(r.event),
        })),
        milestones: rb.milestones.map((m) => ({
            id: m.id, name: m.name, meter: m.meter, at: str(m.at), direction: m.direction, repeat: m.repeat ? 'every time' : 'once',
        })),
        influences: rb.influences.map((i) => ({
            meter: i.meter, min: str(i.min), max: str(i.max), status: i.status, color: i.color, description: i.description, text: i.text,
        })),
    };
}

function num(v, label) {
    if (v === '' || v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`"${label}" must be a number`);
    return n;
}

function setIf(obj, key, value) {
    if (value !== undefined && value !== '' && !(Array.isArray(value) && !value.length)) obj[key] = value;
}

/** Editable draft -> raw JSON for normalizeRulebook. Throws readable errors. */
export function draftToRaw(draft) {
    const raw = { id: draft.id || undefined, name: draft.name, meters: [], rules: [], milestones: [], influences: [] };

    for (const m of draft.meters) {
        const o = { id: m.id || undefined, name: m.name, type: m.type || 'bar' };
        for (const k of ['min', 'max', 'start']) setIf(o, k, num(m[k], `${m.name || 'Meter'} ${k}`));
        for (const k of ['icon', 'color', 'style', 'pip']) setIf(o, k, m[k]);
        const after = num(m.decay_after, 'Drift after');
        if (after !== undefined) o.decay = { after, amount: num(m.decay_amount, 'Drift amount') ?? 0 };
        raw.meters.push(o);
    }

    for (const r of draft.rules) {
        const o = { id: r.id || undefined, name: r.name, meter: r.meter, on: r.on, frequency: r.frequency };
        setIf(o, 'keywords', list(r.keywords));
        for (const k of ['regex', 'aiCondition', 'event']) setIf(o, k, str(r[k]).trim());
        setIf(o, 'cooldown', num(r.cooldown, `${r.name || 'Rule'} cooldown`));
        const conditions = {};
        for (const [group, key] of [['all', 'c_all'], ['any', 'c_any'], ['not', 'c_not']]) setIf(conditions, group, linesToConditions(r[key]));
        if (Object.keys(conditions).length) o.conditions = conditions;
        const amount = str(r.amount).trim();
        if (!amount) throw new Error(`Rule "${r.name || '(unnamed)'}" needs an amount`);
        o[r.mode === 'set' ? 'set' : 'change'] = Number.isFinite(Number(amount)) ? Number(amount) : amount;
        raw.rules.push(o);
    }

    for (const m of draft.milestones) {
        const at = num(m.at, `Milestone "${m.name || ''}" value`);
        if (at === undefined) throw new Error(`Milestone "${m.name || '(unnamed)'}" needs a crossing value`);
        raw.milestones.push({
            id: m.id || undefined, name: m.name, meter: m.meter, at, direction: m.direction || 'either', repeat: m.repeat === 'every time',
        });
    }

    for (const i of draft.influences) {
        const o = { meter: i.meter };
        for (const k of ['min', 'max']) setIf(o, k, num(i[k], `Influence ${k}`));
        for (const k of ['status', 'color', 'description', 'text']) setIf(o, k, i[k]);
        raw.influences.push(o);
    }
    return raw;
}

/** Blank item for a section, with sensible defaults. */
export function blankItem(section, draft) {
    const first = draft.meters.find((m) => m.id)?.id ?? '';
    const base = Object.fromEntries(FIELDS[section].map((f) => [f.k, f.t === 'select' ? f.o[0] : f.t === 'meter' ? first : '']));
    if (section === 'meters') Object.assign(base, { type: 'bar', min: '0', max: '100', start: '50' });
    if (section === 'rules') base.amount = '1';
    return base;
}

/** Give an item a stable id the first time it is named, so renaming never breaks references or saved state. */
export function ensureId(draft, section, item) {
    if (item.id || !str(item.name).trim()) return;
    const base = slugify(item.name);
    let id = base;
    for (let n = 2; draft[section].some((x) => x !== item && x.id === id); n++) id = `${base}_${n}`;
    item.id = id;
}

export function newDraft() {
    const d = { id: '', name: '', meters: [], rules: [], milestones: [], influences: [] };
    const m = blankItem('meters', d);
    m.name = 'Mood';
    ensureId(d, 'meters', m);
    d.meters.push(m);
    return d;
}

/** Validate a draft: returns {rb, summary}. Throws readable errors. */
export function validateDraft(draft) {
    const rb = normalizeRulebook(draftToRaw(draft));
    return { rb, summary: `"${rb.name}" is valid: ${rb.meters.length} meters, ${rb.rules.length} rules, ${rb.milestones.length} milestones, ${rb.influences.length} influences.` };
}

// ---------- clipboard ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Copy text. Falls back to a selectable box when the browser blocks the clipboard
 * (for example SillyTavern opened over plain http on another device).
 * @returns {Promise<boolean>} true when copied automatically
 */
export async function copyText(text, title = 'Copy this text') {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch { /* fall through */ }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) return true;
    } catch { /* fall through */ }

    const box = document.createElement('div');
    box.id = 'runebook_copybox';
    box.innerHTML = `<div class="rb-ed-box"><div class="rb-ed-head"><b>${esc(title)}</b></div>
        <div class="rb-ed-body"><small>Your browser blocked automatic copying. Select all and copy manually.</small>
        <textarea class="text_pole" rows="16" readonly>${esc(text)}</textarea></div>
        <div class="rb-ed-foot"><div class="menu_button" data-act="close">Close</div></div></div>`;
    box.addEventListener('click', (e) => { if (e.target.closest?.('[data-act="close"]')) box.remove(); });
    document.body.appendChild(box);
    box.querySelector?.('textarea')?.select();
    return false;
}

/**
 * Show the AI-facing text of a rulebook before it is imported. Resolves true to import.
 * Imported text enters AI-facing prompts, so it is shown for review first.
 */
export function confirmImport(rb, items, action = 'Import') {
    return new Promise((resolve) => {
        const box = document.createElement('div');
        box.id = 'runebook_review';
        const rows = items.map((i) => `<div class="rb-review-item${i.warning ? ' warn' : ''}">
            <small>${esc(i.where)}</small><div>${esc(i.text)}</div>${i.warning ? `<small class="rb-warn">Heads up: this ${esc(i.warning)}.</small>` : ''}</div>`).join('');
        const actionLabel = action === 'Save' ? 'saving' : 'importing';
        box.innerHTML = `<div class="rb-ed-box"><div class="rb-ed-head"><b>Review before ${actionLabel} "${esc(rb.name)}"</b>
            <small>Rulebooks can add instructions to your AI's user-role prompt context. Only use rulebooks you trust. This is the changed text it will send:</small></div>
            <div class="rb-ed-body">${rows || '<small>This rulebook sends no custom text to the AI.</small>'}</div>
            <div class="rb-ed-foot"><div class="menu_button" data-act="yes">${esc(action)}</div><div class="menu_button" data-act="no">Cancel</div></div></div>`;
        box.addEventListener('click', (e) => {
            const act = e.target.closest?.('[data-act]')?.dataset.act;
            if (!act) return;
            box.remove();
            resolve(act === 'yes');
        });
        document.body.appendChild(box);
    });
}

// ---------- modal UI ----------

function fieldHtml(f, item, draft) {
    const v = item[f.k] ?? '';
    let control;
    if (f.t === 'select') {
        control = `<select data-f="${f.k}">${f.o.map((o) => `<option value="${esc(o)}"${o === v ? ' selected' : ''}>${esc(o || '(none)')}</option>`).join('')}</select>`;
    } else if (f.t === 'meter') {
        const opts = draft.meters.filter((m) => m.id).map((m) => `<option value="${esc(m.id)}"${m.id === v ? ' selected' : ''}>${esc(m.name)}</option>`);
        control = `<select data-f="${f.k}"><option value="">(pick a meter)</option>${opts.join('')}</select>`;
    } else if (f.t === 'area') {
        control = `<textarea data-f="${f.k}" rows="2" spellcheck="false">${esc(v)}</textarea>`;
    } else {
        control = `<input data-f="${f.k}" type="text" value="${esc(v)}">`;
    }
    return `<label class="rb-f${f.wide ? ' wide' : ''}"${f.help ? ` title="${esc(f.help)}"` : ''}><span>${esc(f.l)}</span>${control}</label>`;
}

function jsonText(draft) {
    try { return JSON.stringify(draftToRaw(draft), null, 2); } catch (e) { return `(not ready yet: ${e.message})`; }
}

function builderHtml(draft, status, isError) {
    const sections = Object.keys(FIELDS).map((section) => `
        <h4>${SECTION_TITLES[section]}</h4>
        ${draft[section].map((item, i) => `
            <div class="rb-ed-item" data-section="${section}" data-index="${i}">
                <div class="menu_button rb-ed-remove" data-act="remove" title="Remove">&times;</div>
                ${FIELDS[section].map((f) => fieldHtml(f, item, draft)).join('')}
            </div>`).join('')}
        <div class="menu_button" data-act="add" data-section="${section}">+ Add ${SINGULAR[section]}</div>`).join('');

    const json = jsonText(draft);

    return `
        <div class="rb-ed-box">
            <div class="rb-ed-head"><b>Rulebook builder</b>
                <label class="rb-f wide"><span>Rulebook name</span><input data-top="name" type="text" value="${esc(draft.name)}"></label>
                <small>Name each meter first, then add rules that point at them. Hover a field for tips.</small>
            </div>
            <div class="rb-ed-body">${sections}
                <details class="rb-info"><summary>Generated JSON</summary><pre class="rb-pre">${esc(json)}</pre></details>
            </div>
            <div class="rb-ed-status${isError ? ' error' : ''}">${esc(status ?? '')}</div>
            <div class="rb-ed-foot">
                <div class="menu_button" data-act="validate">Validate</div>
                <div class="menu_button" data-act="save">Save</div>
                <div class="menu_button" data-act="copyjson" title="Copy the rulebook JSON">Copy JSON</div>
                <div class="menu_button" data-act="copyai" title="Copy the full format instructions for any AI assistant">Copy AI instructions</div>
                <div class="menu_button" data-act="cancel">Cancel</div>
            </div>
        </div>`;
}

/**
 * Open the builder. rb is a normalized rulebook to edit, or null for a new one.
 * onSave receives the validated rulebook. getAiInstructions returns text to copy.
 */
export function openBuilder(rb, { onSave, getAiInstructions }) {
    const draft = rb ? rulebookToDraft(rb) : newDraft();
    const root = document.createElement('div');
    root.id = 'runebook_editor';

    const render = (status, isError = false) => {
        const body = root.querySelector?.('.rb-ed-body');
        const scroll = body?.scrollTop ?? 0;
        root.innerHTML = builderHtml(draft, status, isError);
        const fresh = root.querySelector?.('.rb-ed-body');
        if (fresh) fresh.scrollTop = scroll;
    };
    const updatePreview = () => {
        const pre = root.querySelector?.('.rb-ed-body .rb-pre');
        if (pre) pre.textContent = jsonText(draft);
    };
    const close = () => root.remove();

    root.addEventListener('change', (e) => {
        const t = e.target;
        if (t.dataset?.top === 'name') { draft.name = t.value; updatePreview(); return; }
        const item = t.closest?.('.rb-ed-item');
        if (!item || !t.dataset?.f) return;
        const section = item.dataset.section;
        const entry = draft[section][Number(item.dataset.index)];
        entry[t.dataset.f] = t.value;
        if (t.dataset.f === 'name' && (section === 'meters' || section === 'rules' || section === 'milestones')) ensureId(draft, section, entry);
        // Re-render only when meter names change (the meter pickers need refreshing); otherwise keep focus.
        if (section === 'meters' && t.dataset.f === 'name') render(); else updatePreview();
    });

    root.addEventListener('click', async (e) => {
        const target = e.target.closest?.('[data-act]');
        const act = target?.dataset.act;
        if (!act) return;
        if (act === 'cancel') return close();
        if (act === 'add') {
            const section = target.dataset.section;
            draft[section].push(blankItem(section, draft));
            return render();
        }
        if (act === 'remove') {
            const item = target.closest('.rb-ed-item');
            draft[item.dataset.section].splice(Number(item.dataset.index), 1);
            return render();
        }
        if (act === 'copyai') {
            const ok = await copyText(getAiInstructions(), 'Rulebook instructions for an AI assistant');
            return render(ok ? 'AI instructions copied. Paste them into any AI assistant with your tracker idea.' : '');
        }
        try {
            const { rb: saved, summary } = validateDraft(draft);
            if (act === 'validate') return render(summary);
            if (act === 'copyjson') {
                const ok = await copyText(JSON.stringify(draftToRaw(draft), null, 2), 'Rulebook JSON');
                return render(ok ? 'JSON copied.' : '');
            }
            if (act === 'save') { onSave(saved); close(); }
        } catch (err) {
            render(err.message, true);
        }
    });

    render();
    document.body.appendChild(root);
    return { draft, root };
}
