import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dryRun, applyMessage, buildPrompt, createState, getInfluence, normalizeRulebook, resolveAmount } from '../engine.js';

const book = () => normalizeRulebook({
    name: 'T',
    meters: [{ id: 'a', name: 'A', type: 'bar', start: 50, decay: { after: 2, amount: -5 } }],
    rules: [
        { name: 'up', meter: 'a', keywords: ['hi'], change: 10, on: 'user' },
        { name: 'once', meter: 'a', keywords: ['secret'], change: 20, frequency: 'once_per_chat' },
        { name: 'set', meter: 'a', regex: 'reset', set: 1 },
    ],
    influences: [{ meter: 'a', min: 0, max: 40, status: 'Low', text: 'be cold' }],
});

test('whole-word match: "this" does not trigger "hi"', () => {
    const rb = book(), s = createState(rb);
    applyMessage(rb, s, 'this is fine', 'user');
    assert.equal(s.values.a, 50);
    applyMessage(rb, s, 'Hi there', 'user');
    assert.equal(s.values.a, 60);
});

test('source filter and once_per_chat', () => {
    const rb = book(), s = createState(rb);
    applyMessage(rb, s, 'hi', 'ai');
    assert.equal(s.values.a, 50);
    applyMessage(rb, s, 'a secret', 'ai');
    applyMessage(rb, s, 'a secret', 'ai');
    assert.equal(s.values.a, 70);
});

test('clamping, set, decay', () => {
    const rb = book(), s = createState(rb);
    s.values.a = 95;
    applyMessage(rb, s, 'hi hi', 'user');
    assert.equal(s.values.a, 100);
    applyMessage(rb, s, 'nothing', 'ai');
    applyMessage(rb, s, 'nothing', 'ai');
    assert.equal(s.values.a, 95);
    applyMessage(rb, s, 'reset', 'ai');
    assert.equal(s.values.a, 1);
});

test('prompt includes status and influence text', () => {
    const rb = book(), s = createState(rb);
    s.values.a = 10;
    const p = buildPrompt([{ rb, state: s }]);
    assert.match(p, /A: 10\/100 \(Low\)/);
    assert.match(p, /be cold/);
});

test('dice and validation', () => {
    assert.equal(resolveAmount('2d6+1', () => 0), 3);
    assert.equal(resolveAmount('-1d4', () => 0.99), -4);
    assert.throws(() => normalizeRulebook({ name: 'x', meters: [{ name: 'm' }], rules: [{ meter: 'zzz', keywords: ['a'], change: 1 }] }), /unknown meter/);
    assert.throws(() => normalizeRulebook({ name: 'x', meters: [{ name: 'm' }], rules: [{ meter: 'm', keywords: ['a'] }] }), /change.*set/);
});

test('legacy format still imports', () => {
    const rb = normalizeRulebook({
        name: 'Old', meters: [{ id: 'm1', name: 'M', type: 'bar', startValue: 30, min: 0, max: 100 }],
        rules: [{ id: 'r', name: 'R', condition: { type: 'contains_any', words: ['love'] }, action: { type: 'modify_meter', meterId: 'm1', change: 5, frequency: 'once_per_chat' } }],
    });
    assert.equal(rb.rules[0].change, 5);
    assert.equal(rb.meters[0].start, 30);
});

test('all bundled examples validate', () => {
    for (const f of readdirSync(new URL('../examples', import.meta.url))) {
        normalizeRulebook(JSON.parse(readFileSync(new URL(`../examples/${f}`, import.meta.url), 'utf8')));
    }
});

test('look options validate and structured log works', () => {
    const rb = normalizeRulebook({
        name: 'L',
        meters: [{ name: 'M', type: 'pips', max: 5, icon: 'fa-solid fa-heart', pip: 'star', color: '#fff' }],
        rules: [{ meter: 'M', keywords: ['x'], change: 1 }],
        influences: [{ meter: 'M', description: 'only on screen', color: 'red' }],
    });
    const s = createState(rb);
    const log = applyMessage(rb, s, 'x', 'user');
    assert.deepEqual(log[0], { rule: 'Rule 1', meter: 'm', name: 'M', before: 0, after: 1 });
    assert.equal(getInfluence(rb, s).descriptions.m, 'only on screen');
    assert.throws(() => normalizeRulebook({ name: 'x', meters: [{ name: 'm', color: 'red;}body{' }] }), /color/);
    assert.throws(() => normalizeRulebook({ name: 'x', meters: [{ name: 'm', icon: '<img src=x>' }] }), /icon/);
    assert.throws(() => normalizeRulebook({ name: 'x', meters: [{ name: 'm', pip: 'triangle' }] }), /pip/);
});

test('dryRun does not change real state', () => {
    const rb = book(), state = createState(rb);
    const { log, prompt } = dryRun([{ rb, state }], 'hi', 'user');
    assert.equal(log.length, 1);
    assert.equal(state.values.a, 50);
    assert.match(prompt, /A: 60\/100/);
});
