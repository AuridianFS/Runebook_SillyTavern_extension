import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { normalizeRulebook } from '../engine.js';
import {
    blankItem, draftToRaw, ensureId, formatCondition, newDraft, parseConditionLine, rulebookToDraft, validateDraft,
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
