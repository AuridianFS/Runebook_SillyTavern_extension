import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dryRun, applyMessage, buildPrompt, createState, getInfluence, normalizeRulebook, repairState, resolveAmount } from '../engine.js';

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

test('message cooldown blocks the configured number of subsequent messages', () => {
    const rb = normalizeRulebook({
        name: 'Cooldown',
        meters: [{ id: 'm', name: 'Meter', start: 0 }],
        rules: [{ id: 'r', meter: 'm', keywords: ['hit'], change: 1, cooldown: 2 }],
    });
    const state = createState(rb);
    applyMessage(rb, state, 'hit', 'user');
    applyMessage(rb, state, 'nothing', 'user');
    applyMessage(rb, state, 'nothing', 'ai');
    assert.equal(state.values.m, 1);
    applyMessage(rb, state, 'hit', 'user');
    assert.equal(state.values.m, 2);
    assert.equal(repairState(rb, state).messageCount, 4);
});

test('AND, NOT and meter conditions combine with legacy text matching', () => {
    const rb = normalizeRulebook({
        name: 'Conditions',
        meters: [{ id: 'trust', name: 'Trust', start: 3 }],
        rules: [{
            id: 'gift',
            meter: 'trust',
            keywords: ['gift'],
            change: 1,
            conditions: {
                all: [{ meter: 'trust', operator: 'gte', value: 3 }],
                not: [{ keywords: ['fake'] }],
            },
        }],
    });
    const state = createState(rb);
    applyMessage(rb, state, 'a fake gift', 'user');
    assert.equal(state.values.trust, 3);
    applyMessage(rb, state, 'a real gift', 'user');
    assert.equal(state.values.trust, 4);
});

test('condition and milestone definitions validate their operators and references', () => {
    const base = { name: 'Validation', meters: [{ id: 'm', name: 'Meter' }] };
    assert.throws(() => normalizeRulebook({
        ...base,
        rules: [{ meter: 'm', change: 1, conditions: { all: [{ meter: 'missing', operator: 'gte', value: 1 }] } }],
    }), /unknown meter/);
    assert.throws(() => normalizeRulebook({
        ...base,
        rules: [{ meter: 'm', change: 1, conditions: { all: [{ meter: 'm', operator: 'contains', value: 1 }] } }],
    }), /operator/);
    assert.throws(() => normalizeRulebook({
        ...base,
        milestones: [{ name: 'Out of range', meter: 'm', at: 101 }],
    }), /within meter/);
});

test('any conditions accept one matching text or meter predicate', () => {
    const rb = normalizeRulebook({
        name: 'Any',
        meters: [{ id: 'm', name: 'Meter', start: 5 }],
        rules: [{
            id: 'r',
            meter: 'm',
            change: 1,
            conditions: {
                any: [
                    { keywords: ['hello'] },
                    { meter: 'm', operator: 'gte', value: 10 },
                ],
            },
        }],
    });
    const state = createState(rb);
    applyMessage(rb, state, 'unrelated', 'user');
    assert.equal(state.values.m, 5);
    applyMessage(rb, state, 'hello', 'user');
    assert.equal(state.values.m, 6);
});

test('milestones fire only when crossing their threshold and once by default', () => {
    const rb = normalizeRulebook({
        name: 'Milestones',
        meters: [{ id: 'm', name: 'Meter', start: 8 }],
        rules: [{ id: 'up', meter: 'm', keywords: ['up'], change: 3 }],
        milestones: [{ id: 'ten', name: 'Reached ten', meter: 'm', at: 10, direction: 'up' }],
    });
    const state = createState(rb);
    const first = applyMessage(rb, state, 'up', 'user');
    assert.equal(first.filter((entry) => entry.milestone === 'ten').length, 1);
    state.values.m = 8;
    const second = applyMessage(rb, state, 'up', 'user');
    assert.equal(second.filter((entry) => entry.milestone === 'ten').length, 0);
    assert.equal(state.events['milestone:ten'], 1);
});

test('named rule events are counted in per-chat state', () => {
    const rb = normalizeRulebook({
        name: 'Events',
        meters: [{ id: 'm', name: 'Meter', start: 0 }],
        rules: [{ id: 'r', meter: 'm', keywords: ['hello'], change: 1, event: 'greeting' }],
    });
    const state = createState(rb);
    const log = applyMessage(rb, state, 'hello', 'user');
    assert.equal(log[0].event, 'greeting');
    assert.equal(repairState(rb, state).events.greeting, 1);
});

test('AI-conditioned rules require an explicit match result', () => {
    const rb = normalizeRulebook({
        name: 'AI',
        meters: [{ id: 'm', name: 'Meter', start: 0 }],
        rules: [{ id: 'r', meter: 'm', aiCondition: 'The message is a sincere apology.', change: 1 }],
    });
    const state = createState(rb);
    applyMessage(rb, state, 'sorry', 'user');
    assert.equal(state.values.m, 0);
    applyMessage(rb, state, 'sorry', 'user', Math.random, { aiMatches: ['r'] });
    assert.equal(state.values.m, 1);
});

test('manifest is valid and points at real files', () => {
    const m = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
    for (const key of ['display_name', 'js', 'css', 'version']) assert.ok(m[key], `manifest.${key}`);
    const top = /^## (\S+)/m.exec(readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'))[1];
    assert.equal(m.version, top, 'manifest version matches newest CHANGELOG entry');
    readFileSync(new URL(`../${m.js}`, import.meta.url));
    readFileSync(new URL(`../${m.css}`, import.meta.url));
});
