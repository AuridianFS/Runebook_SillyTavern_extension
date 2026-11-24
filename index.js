/**
 * Runebook for SillyTavern: SpicyChat-style Rulebooks.
 * Meters track story values, rules move them from chat keywords, and
 * influence rules tell the character how to behave at different levels.
 */
import {
    applyMessage, buildPrompt, createState, getInfluence, normalizeRulebook, repairState,
} from './engine.js';

const MODULE = 'runebook';
const PROMPT_KEY = 'runebook_prompt';
const EXAMPLES = ['blank_template', 'affection_tracker', 'wallet_tracker', 'dice_game'];
const DEFAULTS = { enabled: true, hud: true, dock: 'right', compact: 'auto', collapsed: {}, rulebooks: [] };
const HUD_WIDTH = 230;
const PIP_GLYPHS = { circle: '●', heart: '♥', star: '★', square: '■' };

const ctx = () => SillyTavern.getContext();
const $id = (id) => document.getElementById(id);

function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- storage ----------

function settings() {
    const { extensionSettings } = ctx();
    extensionSettings[MODULE] = { ...DEFAULTS, ...extensionSettings[MODULE] };
    return extensionSettings[MODULE];
}

/** Per-chat data: which rulebooks are attached and their current meter values. */
function chatData() {
    const { chatMetadata } = ctx();
    chatMetadata[MODULE] ??= { active: [], states: {} };
    return chatMetadata[MODULE];
}

const save = () => ctx().saveSettingsDebounced();
const saveChat = () => ctx().saveMetadata();

/** Active rulebooks for the current chat with repaired state. */
function activeEntries() {
    const data = chatData();
    const entries = [];
    for (const id of data.active) {
        const rb = settings().rulebooks.find((r) => r.id === id);
        if (!rb) continue;
        data.states[id] = repairState(rb, data.states[id]);
        entries.push({ rb, state: data.states[id] });
    }
    return entries;
}

// ---------- prompt + events ----------

function updatePrompt() {
    const c = ctx();
    const text = settings().enabled ? buildPrompt(activeEntries()) : '';
    const position = c.extension_prompt_types?.IN_CHAT ?? 1;
    const role = c.extension_prompt_roles?.SYSTEM ?? 0;
    c.setExtensionPrompt(PROMPT_KEY, text, position, 1, false, role);
}

let lastProcessed = '';

async function onMessage(id) {
    if (!settings().enabled) return;
    const msg = ctx().chat?.[id];
    if (!msg || msg.is_system || !msg.mes) return;

    const key = `${id}|${msg.swipe_id ?? 0}|${msg.mes}`;
    if (key === lastProcessed) return;
    lastProcessed = key;

    const source = msg.is_user ? 'user' : 'ai';
    let changed = false;
    for (const { rb, state } of activeEntries()) {
        const log = applyMessage(rb, state, msg.mes, source);
        for (const c of log) {
            changed = true;
            const delta = c.after - c.before;
            if (delta !== 0) pushNote(`${c.name} ${delta > 0 ? '+' : ''}${delta} (${c.rule})`);
        }
    }
    if (changed) await saveChat();
    updatePrompt();
    renderHud();
}

function onChatChanged() {
    lastProcessed = '';
    updatePrompt();
    renderHud();
    renderDrawer();
}

// ---------- rulebook management ----------

function addRulebook(raw) {
    const rb = normalizeRulebook(raw);
    const list = settings().rulebooks;
    const i = list.findIndex((r) => r.id === rb.id);
    if (i >= 0) list[i] = rb; else list.push(rb);
    save();
    return rb;
}

function setActive(id, on) {
    const data = chatData();
    data.active = data.active.filter((x) => x !== id);
    if (on) data.active.push(id);
    saveChat();
    updatePrompt();
    renderHud();
}

function deleteRulebook(id) {
    const s = settings();
    s.rulebooks = s.rulebooks.filter((r) => r.id !== id);
    const data = chatData();
    data.active = data.active.filter((x) => x !== id);
    delete data.states[id];
    save();
    saveChat();
}

function resetChat() {
    const data = chatData();
    for (const { rb } of activeEntries()) data.states[rb.id] = createState(rb);
    saveChat();
    updatePrompt();
    renderHud();
}

/** Rebuild meters from scratch by replaying every message in the chat, greeting included. */
async function rescanChat() {
    const data = chatData();
    const entries = activeEntries();
    for (const { rb } of entries) data.states[rb.id] = createState(rb);
    for (const msg of ctx().chat ?? []) {
        if (msg.is_system || !msg.mes) continue;
        for (const { rb } of entries) applyMessage(rb, data.states[rb.id], msg.mes, msg.is_user ? 'user' : 'ai');
    }
    await saveChat();
    updatePrompt();
    renderHud();
    toast('success', 'Meters rebuilt from the chat. Dice rules were re-rolled.');
}

// Short on-screen notes like "Trust +1 (Shared a secret)" that fade after a few seconds.
const notes = [];
function pushNote(text) {
    notes.push(text);
    setTimeout(() => { notes.shift(); renderHud(); }, 4000);
}

function download(rb) {
    const { id, name, meters, rules, influences } = rb;
    const blob = new Blob([JSON.stringify({ id, name, meters, rules, influences }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

async function loadExample(name) {
    const url = new URL(`./examples/${name}.json`, import.meta.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load example (${res.status})`);
    return addRulebook(await res.json());
}

function toast(kind, message) {
    const t = globalThis.toastr;
    if (t?.[kind]) t[kind](message, 'Runebook'); else console[kind === 'error' ? 'error' : 'log']('[Runebook]', message);
}

async function guarded(fn) {
    try { await fn(); } catch (e) { toast('error', e.message); }
    renderDrawer();
}

// ---------- UI ----------

function iconHtml(icon) {
    if (!icon) return '';
    return icon.startsWith('fa-') ? `<i class="${esc(icon)}"></i>` : esc(icon);
}

function meterHtml(meter, value, color) {
    const style = color ? ` style="--rb-color:${esc(color)}"` : '';
    if (meter.type === 'pips') {
        const total = Math.min(Math.round(meter.max - meter.min), 20);
        const filled = Math.round(value - meter.min);
        const glyph = meter.icon ? iconHtml(meter.icon) : PIP_GLYPHS[meter.pip ?? 'circle'];
        const pips = Array.from({ length: total }, (_, i) => `<span class="rb-pip${i < filled ? ' on' : ''}">${glyph}</span>`).join('');
        return `<div class="rb-pips"${style}>${pips}</div>`;
    }
    if (meter.type === 'number') return `<span class="rb-num"${style}>${esc(value)}</span>`;
    const pct = ((value - meter.min) / (meter.max - meter.min)) * 100;
    if (meter.style === 'slider') {
        return `<div class="rb-slider"${style}><div class="rb-knob" style="left:${pct}%"></div></div><span class="rb-num">${esc(value)}</span>`;
    }
    return `<div class="rb-bar"${style}><div class="rb-fill" style="width:${pct}%"></div></div><span class="rb-num">${esc(value)}</span>`;
}

function isCompact(rbId, count) {
    const own = settings().collapsed[rbId];
    if (own !== undefined) return own;
    const mode = settings().compact;
    return mode === 'on' || (mode === 'auto' && (count > 2 || window.innerWidth < 800));
}

function bookHtml({ rb, state }, count) {
    const info = getInfluence(rb, state);
    const compact = isCompact(rb.id, count);
    const body = rb.meters.map((m) => {
        const color = info.colors[m.id] ?? m.color;
        const status = info.statuses[m.id];
        const desc = info.descriptions[m.id];
        if (compact) {
            const tip = [m.name, status, desc].filter(Boolean).join(' - ');
            return `<span class="rb-chip" title="${esc(tip)}"${color ? ` style="--rb-color:${esc(color)}"` : ''}>${iconHtml(m.icon) || esc(m.name)} <b>${esc(state.values[m.id])}</b>${status ? ` ${esc(status)}` : ''}</span>`;
        }
        return `<div class="rb-row" title="${esc(desc ?? '')}">
            <span class="rb-label">${iconHtml(m.icon)} ${esc(m.name)}</span>${meterHtml(m, state.values[m.id], color)}
            ${status ? `<span class="rb-status">${esc(status)}</span>` : ''}
            ${desc ? `<div class="rb-desc">${esc(desc)}</div>` : ''}
        </div>`;
    }).join('');
    return `<div class="rb-hud-book" data-id="${esc(rb.id)}">
        <div class="rb-head" title="Click to ${compact ? 'expand' : 'minimize'}"><b>${esc(rb.name)}</b>
        <i class="fa-solid ${compact ? 'fa-chevron-down' : 'fa-chevron-up'}"></i></div>
        <div class="${compact ? 'rb-chips' : ''}">${body}</div></div>`;
}

function positionHud(hud) {
    const dock = settings().dock;
    hud.className = `rb-dock-${dock}`;
    hud.style.cssText = '';
    if (dock === 'float') return;
    const sheld = $id('sheld')?.getBoundingClientRect();
    const room = sheld ? (dock === 'left' ? sheld.left : window.innerWidth - sheld.right) : 0;
    if (sheld && room >= HUD_WIDTH + 16) {
        // Enough empty space beside the chat: sit right next to it.
        hud.style[dock] = `${(dock === 'left' ? sheld.left : window.innerWidth - sheld.right) - HUD_WIDTH - 8}px`;
    } else {
        hud.style[dock] = '4px'; // No room: overlay the screen edge.
        hud.classList.add('rb-overlay');
    }
}

function renderHud() {
    let hud = $id('runebook_hud');
    const entries = settings().enabled && settings().hud ? activeEntries() : [];
    if (!entries.length) { hud?.remove(); return; }
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'runebook_hud';
        hud.addEventListener('click', (e) => {
            const id = e.target.closest('.rb-head')?.closest('.rb-hud-book')?.dataset.id;
            if (!id) return;
            const count = activeEntries().length;
            settings().collapsed[id] = !isCompact(id, count);
            save();
            renderHud();
        });
        document.body.appendChild(hud);
    }
    hud.innerHTML = entries.map((e) => bookHtml(e, entries.length)).join('')
        + (notes.length ? `<div class="rb-notes">${notes.map((n) => `<div>${esc(n)}</div>`).join('')}</div>` : '');
    positionHud(hud);
}

function renderDrawer() {
    const list = $id('runebook_list');
    if (!list) return;
    const s = settings();
    const active = new Set(chatData().active);
    $id('runebook_enabled').checked = s.enabled;
    $id('runebook_hud_toggle').checked = s.hud;
    $id('runebook_dock').value = s.dock;
    $id('runebook_compact').value = s.compact;

    list.innerHTML = s.rulebooks.length ? s.rulebooks.map((rb) => `
        <div class="rb-item" data-id="${esc(rb.id)}">
            <label class="checkbox_label">
                <input type="checkbox" data-act="attach" ${active.has(rb.id) ? 'checked' : ''}>
                <span>${esc(rb.name)}</span>
            </label>
            <span class="rb-item-meta">${rb.meters.length} meters, ${rb.rules.length} rules</span>
            <div class="menu_button menu_button_icon" data-act="export" title="Export"><i class="fa-solid fa-download"></i></div>
            <div class="menu_button menu_button_icon" data-act="delete" title="Delete"><i class="fa-solid fa-trash"></i></div>
        </div>`).join('') : '<small>No rulebooks yet. Load an example or import a JSON file.</small>';
}

function buildDrawer() {
    const options = EXAMPLES.map((e) => `<option value="${e}">${e.replace(/_/g, ' ')}</option>`).join('');
    return `
    <div id="runebook_settings" class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>Runebook</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <label class="checkbox_label"><input type="checkbox" id="runebook_enabled"><span>Enable Runebook</span></label>
            <label class="checkbox_label"><input type="checkbox" id="runebook_hud_toggle"><span>Show meters on screen</span></label>
            <div class="flex-container">
                <label>Dock <select id="runebook_dock" class="text_pole">
                    <option value="right">Right of chat</option><option value="left">Left of chat</option><option value="float">Floating top right</option>
                </select></label>
                <label>Size <select id="runebook_compact" class="text_pole">
                    <option value="auto">Auto (compact if 3+)</option><option value="off">Always full</option><option value="on">Always compact</option>
                </select></label>
            </div>
            <small>Tick a rulebook below to attach it to the current chat.</small>
            <div id="runebook_list"></div>
            <div class="flex-container">
                <select id="runebook_example" class="text_pole">${options}</select>
                <div class="menu_button" id="runebook_load_example">Add example</div>
            </div>
            <div class="flex-container">
                <div class="menu_button" id="runebook_import">Import JSON</div>
                <div class="menu_button" id="runebook_reset">Reset meters</div>
                <div class="menu_button" id="runebook_rescan" title="Replay the whole chat, greeting included">Rescan chat</div>
            </div>
            <input type="file" id="runebook_file" accept=".json,application/json" hidden>
        </div>
    </div>`;
}

function bindDrawer() {
    $id('runebook_enabled').addEventListener('change', (e) => {
        settings().enabled = e.target.checked; save(); updatePrompt(); renderHud();
    });
    $id('runebook_hud_toggle').addEventListener('change', (e) => {
        settings().hud = e.target.checked; save(); renderHud();
    });
    $id('runebook_load_example').addEventListener('click', () => guarded(async () => {
        const rb = await loadExample($id('runebook_example').value);
        toast('success', `Added "${rb.name}"`);
    }));
    $id('runebook_import').addEventListener('click', () => $id('runebook_file').click());
    $id('runebook_file').addEventListener('change', (e) => guarded(async () => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        let raw;
        try { raw = JSON.parse(await file.text()); } catch { throw new Error('That file is not valid JSON'); }
        const rb = addRulebook(raw);
        toast('success', `Imported "${rb.name}"`);
    }));
    $id('runebook_reset').addEventListener('click', resetChat);
    $id('runebook_rescan').addEventListener('click', () => guarded(rescanChat));
    $id('runebook_dock').addEventListener('change', (e) => { settings().dock = e.target.value; save(); renderHud(); });
    $id('runebook_compact').addEventListener('change', (e) => {
        settings().compact = e.target.value; settings().collapsed = {}; save(); renderHud();
    });

    $id('runebook_list').addEventListener('click', (e) => {
        const item = e.target.closest('.rb-item');
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (!item || !act) return;
        const id = item.dataset.id;
        if (act === 'attach') { setActive(id, e.target.checked); return; }
        if (act === 'export') download(settings().rulebooks.find((r) => r.id === id));
        if (act === 'delete' && confirm('Delete this rulebook?')) {
            deleteRulebook(id); updatePrompt(); renderHud(); renderDrawer();
        }
    });
}

function addMenuButton() {
    const menu = $id('extensionsMenu');
    if (!menu || $id('runebook_menu_btn')) return;
    menu.insertAdjacentHTML('beforeend', `
        <div id="runebook_menu_btn" class="list-group-item flex-container flexGap5">
            <div class="fa-solid fa-book extensionsMenuExtensionButton"></div>Runebook meters
        </div>`);
    $id('runebook_menu_btn').addEventListener('click', () => {
        settings().hud = !settings().hud; save(); renderHud(); renderDrawer();
    });
}

// ---------- init ----------

jQuery(() => {
    const { eventSource, event_types } = ctx();

    $id('extensions_settings2').insertAdjacentHTML('beforeend', buildDrawer());
    bindDrawer();
    addMenuButton();

    eventSource.on(event_types.MESSAGE_SENT, onMessage);
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessage);
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);

    window.addEventListener('resize', renderHud);
    onChatChanged();
});
