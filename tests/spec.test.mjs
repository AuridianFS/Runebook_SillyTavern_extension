import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeRulebook } from '../engine.js';
import { SPEC_TEXT, buildAiPrompt } from '../spec.js';

test('RULEBOOK_SPEC.md is in sync with spec.js (run: node tools/build-spec.mjs)', () => {
    assert.equal(readFileSync(new URL('../RULEBOOK_SPEC.md', import.meta.url), 'utf8'), SPEC_TEXT);
});

test('the example inside the spec is a valid rulebook that uses every feature', () => {
    const json = /~~~json\n([\s\S]*?)\n~~~/.exec(SPEC_TEXT)[1];
    const rb = normalizeRulebook(JSON.parse(json));
    assert.ok(rb.meters.some((m) => m.type === 'pips') && rb.meters.some((m) => m.type === 'number') && rb.meters.some((m) => m.decay));
    assert.ok(rb.rules.some((r) => r.aiCondition) && rb.rules.some((r) => r.conditions) && rb.rules.some((r) => r.cooldown) && rb.rules.some((r) => r.set !== undefined));
    assert.ok(rb.milestones.length && rb.influences.length);
});

test('every field the engine reads is described in the spec', () => {
    for (const word of ['aiCondition', 'cooldown', 'frequency', 'once_per_chat', 'conditions', 'milestones', 'influences', 'decay',
        'direction', 'repeat', 'description', 'status', 'pip', 'style', 'neq', 'gte', 'dice']) {
        assert.ok(SPEC_TEXT.includes(word) || (word === 'dice' && /dice/i.test(SPEC_TEXT)), word);
    }
});

test('AI prompt includes the idea and the full spec', () => {
    const p = buildAiPrompt('A jealousy meter for a rival');
    assert.match(p, /A jealousy meter for a rival/);
    assert.ok(p.includes(SPEC_TEXT));
    assert.match(buildAiPrompt(''), /Describe your tracker here/);
});
