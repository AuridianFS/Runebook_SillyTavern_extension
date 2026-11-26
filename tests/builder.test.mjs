import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { normalizeRulebook } from '../engine.js';
import {
    confirmImport, blankItem, draftToRaw, ensureId, formatCondition, newDraft, parseConditionLine, rulebookToDraft, validateDraft,
} from '../builder.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../examples/${f}`, import.meta.url), 'utf8'));

test('every bundled example survives rulebook -> form -> rulebook unchanged', () => {
    for (const f of readdirSync(new URL('../examples', import.meta.url))) {
        const rb = normalizeRulebook(load(f));
        const again = normalizeRulebook(draftToRaw(rulebookToDraft(rb)));
        assert.deepEqual(again, rb, f);
    }
});

test('condition lines parse and format both ways', () => {
    assert.deepEqual(parseConditionLine('words: love, care'), { keywords: ['love', 'care'] });
    assert.deepEqual(parseConditionLine('love, care'), { keywords: ['love', 'care'] });
    assert.deepEqual(parseConditionLine('regex: \\bhi\\b'), { regex: '\\bhi\\b' });
    assert.deepEqual(parseConditionLine('Trust >= 3'), { meter: 'Trust', operator: 'gte', value: 3 });
    assert.deepEqual(parseConditionLine('Alert != 0'), { meter: 'Alert', operator: 'neq', value: 0 });
    assert.deepEqual(parseConditionLine('words: a, b ; regex: x+'), { keywords: ['a', 'b'], regex: 'x+' });
    const names = { t: 'Trust' };
    assert.equal(formatCondition({ type: 'meter', meter: 't', operator: 'lte', value: 2 }, names), 'Trust <= 2');
    assert.equal(formatCondition({ type: 'text', keywords: ['a', 'b'], regex: 'x+' }, names), 'words: a, b ; regex: x+');
});

test('building a rulebook from scratch with the form model', () => {
    const d = newDraft();
    d.name = 'Quest';
    const m = blankItem('meters', d);
    m.name = 'Courage';
    m.type = 'pips';
    m.max = '5';
    ensureId(d, 'meters', m);
    d.meters.push(m);
    const r = blankItem('rules', d);
    r.name = 'Brave act';
    r.meter = 'courage';
    r.keywords = 'charge, fight';
    r.c_all = 'Mood >= 10';
    r.c_not = 'words: flee';
    r.cooldown = '2';
    ensureId(d, 'rules', r);
    d.rules.push(r);
    const ms = blankItem('milestones', d);
    ms.name = 'Hero';
    ms.meter = 'courage';
    ms.at = '4';
    ms.direction = 'up';
    ensureId(d, 'milestones', ms);
    d.milestones.push(ms);
    const { rb, summary } = validateDraft(d);
    assert.match(summary, /valid/);
    assert.equal(rb.rules[0].id, 'brave_act');
    assert.equal(rb.rules[0].conditions.all[0].operator, 'gte');
    assert.equal(rb.rules[0].conditions.not[0].keywords[0], 'flee');
    assert.equal(rb.milestones[0].id, 'hero');
});

test('ids stay stable when an item is renamed and stay unique', () => {
    const d = newDraft();
    const a = blankItem('meters', d); a.name = 'Mood'; ensureId(d, 'meters', a); d.meters.push(a);
    assert.equal(d.meters[0].id, 'mood');
    assert.equal(a.id, 'mood_2');
    d.meters[0].name = 'Feeling';
    ensureId(d, 'meters', d.meters[0]);
    assert.equal(d.meters[0].id, 'mood');
});

test('form errors are readable', () => {
    const d = newDraft();
    d.name = 'X';
    d.meters[0].min = 'abc';
    assert.throws(() => validateDraft(d), /must be a number/);
    d.meters[0].min = '0';
    const r = blankItem('rules', d);
    r.name = 'Empty';
    r.amount = '';
    d.rules.push(r);
    assert.throws(() => validateDraft(d), /needs an amount/);
    r.amount = '1';
    assert.throws(() => validateDraft(d), /needs keywords, regex, conditions or aiCondition/);
});

test('import review dialog resolves true on Import and false on Cancel', async () => {
    const made = [];
    globalThis.document = {
        createElement: () => { const el = { handlers: {}, innerHTML: '', addEventListener(t, f) { this.handlers[t] = f; }, remove() { this.removed = true; } }; made.push(el); return el; },
        body: { appendChild() {} },
    };
    const rb = { name: 'Shared <b>book</b>' };
    const items = [{ where: 'Sent every turn', text: '<script>x</script>', warning: 'contains role or script-like markup' }];
    const yes = confirmImport(rb, items);
    assert.ok(!made[0].innerHTML.includes('<script>'), 'text is escaped');
    assert.match(made[0].innerHTML, /Heads up/);
    assert.match(made[0].innerHTML, /Review before importing/);
    assert.match(made[0].innerHTML, />Import</);
    made[0].handlers.click({ target: { closest: () => ({ dataset: { act: 'yes' } }) } });
    assert.equal(await yes, true);
    const no = confirmImport(rb, [], 'Save');
    assert.match(made[1].innerHTML, /Review before saving/);
    assert.match(made[1].innerHTML, />Save</);
    made[1].handlers.click({ target: { closest: () => ({ dataset: { act: 'no' } }) } });
    assert.equal(await no, false);
    assert.ok(made[1].removed);
});

import { resolveLook, pipVars, normalizeLook, contrastWarning, DEFAULT_LOOK, PRESETS } from '../visuals.js';

const base = { id: 'm', name: 'M', type: 'bar', min: 0, max: 10, start: 5 };
const wrap = (m) => ({ name: 'T', meters: [{ ...base, ...m }], rules: [] });

test('meters without look fields stay plain', () => {
    const m = normalizeRulebook(wrap({})).meters[0];
    for (const k of ['fill', 'effect', 'colors']) assert.equal(m[k], undefined);
    const v = resolveLook(m, DEFAULT_LOOK);
    assert.deepEqual(v.classes, []);
});

test('colors list: validates, caps at 26, round-trips, old A-D fields still load', () => {
    const rb = normalizeRulebook(wrap({ colors: ['#c62828', '#ffb300', 'green'], fill: 'animated', effect: 'shimmer' }));
    assert.deepEqual(rb.meters[0].colors, ['#c62828', '#ffb300', 'green']);
    assert.equal(rb.meters[0].color, '#c62828');
    assert.deepEqual(normalizeRulebook(draftToRaw(rulebookToDraft(rb))).meters[0], rb.meters[0]);
    const old = normalizeRulebook(wrap({ color: '#111', colorB: '#222', colorC: '#333', colorD: '#444' })).meters[0];
    assert.deepEqual(old.colors, ['#111', '#222', '#333', '#444']);
    assert.equal(old.colorB, undefined);
    const many = Array.from({ length: 26 }, (_, i) => `#${String(100 + i)}`);
    assert.equal(normalizeRulebook(wrap({ colors: many })).meters[0].colors.length, 26);
    assert.throws(() => normalizeRulebook(wrap({ colors: [...many, '#fff'] })), /at most 26/);
    assert.throws(() => normalizeRulebook(wrap({ colors: 'red' })), /list/);
    assert.throws(() => normalizeRulebook(wrap({ colors: ['url(x)'] })), /color/);
    assert.throws(() => normalizeRulebook(wrap({ fill: 'rainbow' })), /fill/);
    assert.throws(() => normalizeRulebook(wrap({ effect: 'sparkle' })), /effect/);
});

test('builder color box: one color is solid, several become a list, presets fill the fields', () => {
    const d = rulebookToDraft(normalizeRulebook(wrap({})));
    d.meters[0].colors = '#f00';
    assert.equal(draftToRaw(d).meters[0].color, '#f00');
    d.meters[0].colors = '#f00, gold  green';
    assert.deepEqual(draftToRaw(d).meters[0].colors, ['#f00', 'gold', 'green']);
    for (const p of Object.values(PRESETS)) {
        d.meters[0].colors = p.colors.join(', '); d.meters[0].fill = p.fill; d.meters[0].effect = p.effect;
        assert.doesNotThrow(() => validateDraft(d));
    }
});

test('resolveLook: meter wins over global, influence replaces first color, stepped picks the band', () => {
    const m = { ...base, colors: ['#111', '#222', '#333'], color: '#111', fill: 'gradient' };
    const v = resolveLook(m, { ...DEFAULT_LOOK, fill: 'animated', colors: ['#999', '#888'] }, '#abc');
    assert.deepEqual(v.stops, ['#abc', '#222', '#333']);
    assert.ok(v.classes.includes('rb-fill-gradient') && !v.classes.includes('rb-fill-animated'));
    const g = resolveLook(base, { ...DEFAULT_LOOK, fill: 'animated', effect: 'glow', colors: ['#f00', '#00f'] });
    assert.ok(g.classes.includes('rb-fill-animated') && g.classes.includes('rb-fx-glow'));
    assert.ok(g.vars.includes('--rb-grad:#f00,#00f,#f00'));
    const st = { ...base, colors: ['red', 'yellow', 'green'], fill: 'stepped' };
    assert.equal(resolveLook(st, DEFAULT_LOOK, '', 10).stops[0], 'red');
    assert.equal(resolveLook(st, DEFAULT_LOOK, '', 50).stops[0], 'yellow');
    assert.equal(resolveLook(st, DEFAULT_LOOK, '', 100).stops[0], 'green');
});

test('pipVars spreads stops across pips; normalizeLook migrates and rejects junk; contrast hints', () => {
    assert.match(pipVars(0, 5, ['#a', '#b', '#c']), /--pa:#a;--pb:#b;--p:0/);
    assert.match(pipVars(4, 5, ['#a', '#b', '#c']), /--pa:#b;--pb:#c;--p:1/);
    assert.equal(pipVars(2, 5, ['#a']), '--i:2');
    assert.deepEqual(normalizeLook({ fill: 'x', effect: 'y', color: 'url(', colorB: 5 }), DEFAULT_LOOK);
    assert.deepEqual(normalizeLook({ color: '#f00', colorB: '#00f' }).colors, ['#f00', '#00f']);
    assert.match(contrastWarning('#000'), /dark/);
    assert.match(contrastWarning('#fffffe'), /light/);
    assert.equal(contrastWarning('#ff6b9d'), '');
    assert.match(validateDraft(rulebookToDraft(normalizeRulebook(wrap({ color: '#010101' })))).summary, /Note:/);
});
