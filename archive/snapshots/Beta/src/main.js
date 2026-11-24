import { Extension } from '@stdlib/extension';
import { METER_BAR, METER_PIPS, METER_NUMBER } from './constants.js';

// State Management
let runebooks = []; // Array of active Runebook objects
let nextRunebookId = 1;

/**
 * Runebook - A rule tracking system with meters, rules, and triggers
 */
class Runebook {
    constructor(name) {
        this.id = nextRunebookId++;
        this.name = name;
        this.meters = []; // Array of Meter objects
        this.rules = [];  // Array of Rule objects
        this.triggers = []; // Array of Trigger objects
        this.active = true;
        
        console.log(`[Runebook] Initialized: ${name}`);
    }

    addMeter(name, type, config) {
        let meter = {
            id: `rb${this.id}_${name}`,
            runebookId: this.id,
            name: name,
            type: type || METER_BAR,
            value: config.startValue || 50,
            min: config.min || 0,
            max: config.max || 100,
            levels: config.levels || [], // { threshold, label }
            history: [],
            visible: true
        };
        this.meters.push(meter);
        console.log(`[Runebook.${name}] Added meter ${type}`);
        return meter;
    }

    addRule(config) {
        let rule = {
            id: `rb${this.id}_r${rulesCount++}`,
            runebookId: this.id,
            name: config.name || "Unnamed Rule",
            condition: config.condition, // Function or expression string
            action: config.action, // What to do when triggered
            frequency: config.frequency || "always" // always, once_per_chat, etc.
        };
        this.rules.push(rule);
        console.log(`[Runebook.${name}] Added rule ${rule.name}`);
        return rule;
    }

    addTrigger(config) {
        let trigger = {
            id: `rb${this.id}_t${triggersCount++}`,
            runebookId: this.id,
            name: config.name || "Unnamed Trigger",
            condition: config.condition, // Function or expression string
            action: config.action, // What to do when triggered
            targetMeter: config.targetMeterId // Meter ID to affect (optional)
        };
        this.triggers.push(trigger);
        console.log(`[Runebook.${name}] Added trigger ${trigger.name}`);
        return trigger;
    }

    evaluateRules(message) {
        let triggered = [];
        for (rule of this.rules) {
            if (!this.checkCondition(rule.condition, message)) {
                continue;
            }

            // Apply action
            if (rule.action.type === "modify_meter") {
                let meter = this.getMeter(rule.action.meterId);
                if (meter) {
                    meter.value += rule.action.change;
                    meter.value = Math.min(meter.max, Math.max(meter.min, meter.value));
                    triggered.push(`${rule.name}: ${meter.name} changed by ${rule.action.change}`);
                    this.updateMeterUI(meter);
                }
            } else if (rule.action.type === "set_meter") {
                let meter = this.getMeter(rule.action.meterId);
                if (meter) {
                    meter.value = rule.action.value;
                    triggered.push(`${rule.name}: ${meter.name} set to ${rule.action.value}`);
                    this.updateMeterUI(meter);
                }
            } else if (rule.action.type === "show_status") {
                console.log(`[Runebook.${name}] Status: ${rule.action.status}`);
            }

        }
        return triggered;
    }

    evaluateTriggers(message) {
        let triggered = [];
        for (trigger of this.triggers) {
            if (!this.checkCondition(trigger.condition, message)) {
                continue;
            }

            // Apply action
            if (trigger.action.type === "modify_meter") {
                let meter = this.getMeter(trigger.action.meterId);
                if (meter) {
                    meter.value += trigger.action.change;
                    triggered.push(`${trigger.name}: ${meter.name} changed by ${trigger.action.change}`);
                }
            }

        }
        return triggered;
    }

    checkCondition(condition, message) {
        // Simplified condition checking - in real impl, parse and evaluate expressions
        if (typeof condition === "function") {
            return condition(message);
        }
        // For string conditions, would need expression parser
        return false;
    }

    getMeter(id) {
        for (let meter of this.meters) {
            if (meter.id === id) {
                return meter;
            }
        }
        return null;
    }

    updateMeterUI(meter) {
        // Update UI element - would use DOM manipulation in real extension
        console.log(`[Runebook.${name}] UI: ${meter.name} = ${(meter.value)}%`);
    }

    export() {
        return {
            name: this.name,
            meters: this.meters.map(m => ({ ...m, id: null })),
            rules: this.rules.map(r => ({
                ...r,
                id: null,
                condition: r.condition.toString(),
                action: typeof r.action === "function" ? JSON.stringify(r.action) : r.action
            })),
            triggers: this.triggers.map(t => ({
                ...t,
                id: null,
                condition: t.condition.toString(),
                action: typeof t.action === "function" ? JSON.stringify(t.action) : t.action
            }))
        };
    }

    import(data) {
        // Parse imported data and recreate meters, rules, triggers
    }
}

// Extension initialization
class RunebookExtension extends Extension {
    init() {
        console.log("[Runebook] Extension initialized");

        // Create main UI panel button in chat toolbar
        this.ui.register("chat-toolbar", "runebook-button", () => {
            return document.createElement("button");
        });

        // Add to extensions menu
        this.extensions.addMenuButton(
            "Runebooks",
            "Open Runebook manager - track RP conditions and elements"
        );

        // Hook into chat messages
        this.onMessageReceived = (message, sender) => {
            runebooks.forEach(rb => {
                let ruleResults = rb.evaluateRules(message);
                let triggerResults = rb.evaluateTriggers(message);

                if (ruleResults.length > 0 || triggerResults.length > 0) {
                    console.log(`[Runebook] ${rb.name} triggered:`, [...ruleResults, ...triggerResults]);
                    
                    // Could send status back to chat or update UI
                }
            });
        };

        // Create initial Runebook example
        this.createExampleRunebook("Affection Tracker");
    }

    createExampleRunebook(name) {
        let rb = new Runebook(name);

        // Add affection meter (bar type, 0-100)
        let affMeter = rb.addMeter(
            "Affection",
            METER_BAR,
            { startValue: 30, min: 0, max: 100 }
        );

        // Add trust meter (pips type, 0-5)
        let trustMeter = rb.addMeter(
            "Trust",
            METER_PIPS,
            { startValue: 2, min: 0, max: 5 }
        );

        // Rules that modify meters based on chat content
        rb.addRule({
            name: "Positive interaction",
            condition: (msg) => msg.text.includes("love") || msg.text.includes("care"),
            action: { type: "modify_meter", meterId: affMeter.id, change: 15 }
        });

        rb.addRule({
            name: "Negative interaction",
            condition: (msg) => msg.text.includes("hate") || msg.text.includes("disgust"),
            action: { type: "modify_meter", meterId: affMeter.id, change: -15 }
        });

        // Triggers for special events
        rb.addTrigger({
            name: "Important revelation",
            condition: (msg) => msg.text.includes("secret") && msg.text.includes("trust"),
            action: { type: "modify_meter", meterId: trustMeter.id, change: 1 }
        });

        runebooks.push(rb);
    }

    openManager() {
        // Create manager panel UI
        console.log("[Runebook] Opening manager");
        
        let panel = document.createElement("div");
        panel.id = "runebook-manager";
        panel.innerHTML = `
            <h2>Runebook Manager</h2>
            <p>RPC/ERP condition tracking and visualization.</p>
            
            <div id="runebook-list">
                <!-- Active runebooks will be listed here -->
            </div>

            <button onclick="RunebookExtension.toggleExample()">Toggle Example Runebook</button>
        `;

        document.body.appendChild(panel);
    }

    toggleExample() {
        if (runebooks.some(rb => rb.name === "Affection Tracker")) {
            runebooks = runebooks.filter(rb => rb.name !== "Affection Tracker");
        } else {
            this.createExampleRunebook("Affection Tracker");
        }
        // Refresh manager UI
    }

    exportAll() {
        return runebooks.map(rb => rb.export());
    }

    importAll(data) {
        data.forEach(imported => {
            let rb = new Runebook(imported.name);
            // Rebuild meters, rules, triggers from imported data
            rb.import(imported);
        });
    }
}

// Export the extension class
export default RunebookExtension;