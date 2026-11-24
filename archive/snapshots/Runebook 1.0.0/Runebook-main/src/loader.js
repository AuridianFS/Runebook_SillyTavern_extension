/**
 * Runebook Configuration Loader
 * 
 * Loads and validates runebook configuration from JSON files.
 * Supports both programmatic loading and file-based imports.
 */

import { METER_BAR, METER_PIPS, METER_NUMBER } from "./constants.js";

// Valid meter types
export const VALID_METER_TYPES = [METER_BAR, METER_PIPS, METER_NUMBER];

/**
 * Validate a meter configuration object
 * @param {Object} meter - Meter config to validate
 * @returns {Object|null} Error message if invalid, null if valid
 */
export function validateMeter(meter) {
    if (!meter.name || typeof meter.name !== "string") {
        return { type: "invalid", message: "Missing or invalid 'name' field" };
    }

    if (!VALID_METER_TYPES.includes(meter.type)) {
        return { type: "invalid", message: `Invalid meter type: ${meter.type}` };
    }

    // Validate numeric fields
    if (typeof meter.startValue !== "number") {
        return { type: "invalid", message: "'startValue' must be a number" };
    }

    if (meter.min === undefined || typeof meter.min !== "number") {
        return { type: "invalid", message: "'min' must be a number" };
    }

    if (meter.max === undefined || typeof meter.max !== "number") {
        return { type: "invalid", message: "'max' must be a number" };
    }

    // Validate level thresholds if provided
    if (meter.levels && Array.isArray(meter.levels)) {
        for (let i = 0; i < meter.levels.length; i++) {
            let level = meter.levels[i];
            if (!level.threshold || typeof level.threshold !== "number") {
                return { type: "invalid", message: `Level ${i}: 'threshold' must be a number` };
            }
        }
    }

    // Validate visible field
    if (meter.visible === undefined) {
        meter.visible = true;  // Default to true
    }

    return null;  // Valid
}

/**
 * Load runebook from JSON file path
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<Object>} Parsed configuration object
 */
export async function loadRunebookFromFile(filePath) {
    try {
        let text = await fetch(filePath).then(r => r.text());
        return parseRunebookConfig(text);
    } catch (error) {
        console.error(`[Runebook Loader] Failed to load from ${filePath}:`, error);
        throw error;
    }
}

/**
 * Parse runebook configuration from JSON text
 * @param {string} jsonText - Raw JSON text
 * @returns {Object} Parsed configuration object
 */
export function parseRunebookConfig(jsonText) {
    let data = JSON.parse(jsonText);

    // Validate structure
    if (!data.name || typeof data.name !== "string") {
        throw new Error("Configuration must have a 'name' field");
    }

    if (!Array.isArray(data.meters)) {
        throw new Error("'meters' must be an array");
    }

    if (!Array.isArray(data.rules)) {
        data.rules = [];  // Default empty array if missing
    }

    if (!Array.isArray(data.triggers)) {
        data.triggers = [];  // Default empty array if missing
    }

    // Validate each meter
    for (let i = 0; i < data.meters.length; i++) {
        let error = validateMeter(data.meters[i]);
        if (error) {
            throw new Error(`Meter ${i}: ${error.message}`);
        }
    }

    return { name: data.name, meters: data.meters, rules: data.rules, triggers: data.triggers };
}

/**
 * Export current runebooks to JSON format
 * @param {Array} runebooks - Array of Runebook objects
 * @returns {string} Formatted JSON string
 */
export function exportRunebooksToJson(runebooks) {
    // Convert each runebook to serializable config object
    let configs = runebooks.map(rb => {
        return {
            name: rb.name,
            meters: rb.meters.map(m => ({
                id: m.id,
                name: m.name,
                type: m.type,
                startValue: m.value,
                min: m.min,
                max: m.max,
                levels: m.levels,
                visible: m.visible
            })),
            rules: rb.rules.map(r => ({
                id: r.id,
                name: r.name,
                condition: typeof r.condition === "function" ? r.condition.toString() : r.condition,
                action: typeof r.action === "function" ? JSON.stringify(r.action) : r.action,
                frequency: r.frequency
            })),
            triggers: rb.triggers.map(t => ({
                id: t.id,
                name: t.name,
                condition: typeof t.condition === "function" ? t.condition.toString() : t.condition,
                action: typeof t.action === "function" ? JSON.stringify(t.action) : t.action
            }))
        };
    });

    return JSON.stringify(configs, null, 2);
}

/**
 * Validate a rules array from imported config
 * @param {Array} rules - Array of rule objects to validate
 */
export function validateRules(rules) {
    for (let i = 0; i < rules.length; i++) {
        let r = rules[i];

        if (!r.name || typeof r.name !== "string") {
            console.warn(`Rule ${i}: Missing or invalid 'name' field`);
        }

        if (!r.condition) {
            console.warn(`Rule ${i}: Missing 'condition' field`);
        }

        if (!r.action) {
            console.warn(`Rule ${i}: Missing 'action' field`);
        }
    }
}

/**
 * Validate triggers array from imported config
 */
export function validateTriggers(triggers) {
    for (let i = 0; i < triggers.length; i++) {
        let t = triggers[i];

        if (!t.name || typeof t.name !== "string") {
            console.warn(`Trigger ${i}: Missing or invalid 'name' field`);
        }

        if (!t.condition) {
            console.warn(`Trigger ${i}: Missing 'condition' field`);
        }

        if (!t.action) {
            console.warn(`Trigger ${i}: Missing 'action' field`);
        }
    }
}