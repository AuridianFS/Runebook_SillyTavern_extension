/**
 * Runebook Extension for Silly Tavern
 * Tracks RP/ERP conditions with meters, rules, and triggers
 */

// Use global fallback values immediately (works for legacy script loading)
// ES module import attempted but will fail if loaded as synchronous script
try {
    // Try ES module - this may or may not work depending on Silly Tavern's loader
    import("./constants.js").then(m => {
        METER_BAR = m.METER_BAR;
        METER_PIPS = m.METER_PIPS;
        METER_NUMBER = m.METER_NUMBER;
    }).catch(err => {
        // ES module failed - Silly Tavern likely using legacy loading
        console.log("[Runebook] ES module import failed, using fallback values");
    });
} catch (e) {
    // Module system not available at all
    console.log("[Runebook] No module support, using fallback values");
}

// CRITICAL: Set fallback values immediately so code works even if async import fails
METER_BAR = "bar";
METER_PIPS = "pips";
METER_NUMBER = "number";

console.log(`[Runebook] Constants loaded - BAR=${METER_BAR}, PIPS=${METER_PIPS}, NUMBER=${METER_NUMBER}`);

// State Management (module-level)
let runebooks = [];
let nextRunebookId = 1;
let managerVisible = false;
let exampleToggled = true;

/**
 * Runebook class - A rule tracking system with meters, rules, and triggers
 */
class Runebook {
    constructor(name) {
        this.id = nextRunebookId++;
        this.name = name;
        this.meters = [];
        this.rules = [];
        this.triggers = [];
        this.active = true;

        console.log(`[Runebook] Initialized: ${name}`);
    }

    addMeter(name, type, config) {
        let meter = {
            id: `rb${this.id}_${name}`,
            runebookId: this.id,
            name: name,
            type: type || "bar",
            value: config.startValue || 50,
            min: config.min || 0,
            max: config.max || 100,
            levels: config.levels || [],
            visible: true
        };
        this.meters.push(meter);
        console.log(`[Runebook.${name}] Added meter ${type}`);
        return meter;
    }

    addRule(config) {
        let rule = {
            id: `rb${this.id}_r${this.rules.length}`,
            runebookId: this.id,
            name: config.name || "Unnamed Rule",
            condition: config.condition,
            action: config.action,
            frequency: config.frequency || "always"
        };
        this.rules.push(rule);
        console.log(`[Runebook.${name}] Added rule ${rule.name}`);
        return rule;
    }

    addTrigger(config) {
        let trigger = {
            id: `rb${this.id}_t${this.triggers.length}`,
            runebookId: this.id,
            name: config.name || "Unnamed Trigger",
            condition: config.condition,
            action: config.action
        };
        this.triggers.push(trigger);
        console.log(`[Runebook.${name}] Added trigger ${trigger.name}`);
        return trigger;
    }

    evaluateRules(message) {
        let triggered = [];
        for (let rule of this.rules) {
            if (!this.checkCondition(rule.condition, message)) continue;

            if (rule.action.type === "modify_meter") {
                let meter = this.getMeter(rule.action.meterId);
                if (meter) {
                    meter.value += rule.action.change;
                    triggered.push(`${rule.name}: ${meter.name} changed`);
                }
            } else if (rule.action.type === "set_meter") {
                let meter = this.getMeter(rule.action.meterId);
                if (meter) {
                    meter.value = rule.action.value;
                    triggered.push(`${rule.name}: ${meter.name} set to ${rule.action.value}`);
                }
            } else if (rule.action.type === "show_status") {
                console.log(`[Runebook.${this.name}] Status: ${rule.action.status}`);
            }
        }
        return triggered;
    }

    evaluateTriggers(message) {
        let triggered = [];
        for (let trigger of this.triggers) {
            if (!this.checkCondition(trigger.condition, message)) continue;

            if (trigger.action.type === "modify_meter") {
                let meter = this.getMeter(trigger.action.meterId);
                if (meter) {
                    meter.value += trigger.action.change;
                    triggered.push(`${trigger.name}: ${meter.name} changed`);
                }
            }
        }
        return triggered;
    }

    checkCondition(condition, message) {
        if (typeof condition === "function") return condition(message);
        return false;
    }

    getMeter(id) {
        for (let meter of this.meters) {
            if (meter.id === id) return meter;
        }
        return null;
    }
}

/**
 * RunebookExtension - Main extension class with UI registration
 */
class RunebookExtension {
    constructor() {
        this.name = "Runebook";
        console.log("[Runebook] Extension instance created");
    }

    /** Called when user enables the extension */
    onEnable() {
        console.log("[Runebook] Extension enabled");

        // Build settings drawer HTML and append to extensions container
        this.buildAndAppendSettingsDrawer();

        // Add toolbar button using jQuery direct DOM manipulation  
        this.addChatToolbarButton();

        // Hook into chat messages for rule evaluation
        this.setupMessageHooks();

        // Create example runebook for demo
        this.createExampleRunebook("Affection Tracker");

        console.log("[Runebook] Extension fully initialized");
    }

    /** Called when user disables the extension */
    onDisable() {
        console.log("[Runebook] Extension disabled");

        // Clean up UI elements when disabling
        try {
            let btn = document.getElementById("runebook-toolbar-btn");
            if (btn) btn.remove();
        } catch(e) {}

        managerVisible = false;
        const panel = document.getElementById("runebook-manager");
        if (panel) {
            panel.remove();
        }

        console.log("[Runebook] Cleanup complete");
    }

    /** Build and append settings drawer to extensions settings container */
    buildAndAppendSettingsDrawer() {
        let drawerHtml = `
<div id="runebook-settings-drawer" class="inline-drawer runebook-settings">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b><i class="fa-solid fa-chart-bar"></i> Runebook</b>
<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label">
                    <input type="checkbox" id="runebook-enabled" checked>
                    <span>Enable Runebook</span>
                </label>

                <p style="color:#bbb;font-size:12px;margin-top:15px;">Track RP conditions with meters, rules, and triggers.</p>

                <button onclick="${this.name}.openManager()" 
                        style='background:#7c4dff;padding:8px 16px;margin-top:10px;border-radius:4px;color:white;font-size:13px;border:none;cursor:pointer;'>Open Manager</button>

                <hr style="border:none;height:1px;background:#3d3d5c;margin:20px 0;">

                <p style="color:#aaa;font-size:12px;">
                    Click the 📊 button in chat toolbar to open manager. Rules and triggers track AI/player messages automatically.
                </p>
            </div>
        </div>`;

        try {
            let container = document.getElementById("extensions_settings2");
            if (!container) {
                console.error("[Runebook] Could not find #extensions_settings2 container");
                return false;
            }

            container.insertAdjacentHTML("beforeend", drawerHtml);

            // Wire up the checkbox toggle
            let checkbox = document.getElementById("runebook-enabled");
            if (checkbox) {
                checkbox.checked = true;

                checkbox.onchange = function() {
                    managerVisible = false;
                    try {
                        document.getElementById("runebook-manager").remove();
                    } catch(e) {}
                    console.log("[Runebook] Extension disabled via settings drawer");
                };
            }

            console.log("[Runebook] Settings drawer appended to extensions container");
            return true;
        } catch(e) {
            console.error("[Runebook] Failed to append settings drawer:", e);
            return false;
        }
    }

    /** Add toolbar button to chat toolbar */
    addChatToolbarButton() {
        let toolbar = document.getElementById("chat-toolbar");
        if (!toolbar) {
            console.warn("[Runebook] Could not find #chat-toolbar element");
            return false;
        }

        // Remove existing button if present (reinstall scenario)
        try {
            let existingBtn = document.getElementById("runebook-toolbar-btn");
            if (existingBtn) existingBtn.remove();
        } catch(e) {}

        let btn = document.createElement("button");
        btn.id = "runebook-toolbar-btn";
        btn.innerHTML = "📊";
        btn.title = "Runebooks - Track RP Conditions";

        // Style like Extension-Dice uses (purple button, 30x30)
        btn.style.cssText = 
            "width:30px;height:30px;padding:4px 8px;" +
            "border-radius:4px;background:#7c4dff;color:white;" +
            "font-size:16px;cursor:pointer;margin-right:2px;border:none;";

        btn.onclick = function() {
            if (managerVisible) {
                managerVisible = false;
                try {
                    let panel = document.getElementById("runebook-manager");
                    if (panel) panel.style.display = "none";
                } catch(e) {}
                return;
            }
            RunebookExtension.openManager();
        };

        toolbar.appendChild(btn);
        console.log("[Runebook] Added toolbar button");
        return true;
    }

    /** Setup message event hooks */
    setupMessageHooks() {
        // Register to chat message events (using Silly Tavern's event system)
        let evtSource = SillyTavern.getEventSource();

        if (evtSource && typeof evtSource.on === "function") {
            try {
                evtSource.on("message_received", this.handleNewMessage.bind(this));
                console.log("[Runebook] Registered for message_received event");
            } catch(e) {
                console.warn("[Runebook] Could not register for message_received:", e);
            }

            try {
                evtSource.on("ai_message_received", this.handleAiMessage.bind(this));
                console.log("[Runebook] Registered for ai_message_received event");
            } catch(e) {
                console.warn("[Runebook] Could not register for ai_message_received:", e);
            }
        } else {
            // Fallback: use input keypress as proxy trigger
            let msgInput = document.getElementById("message_input");
            if (msgInput && typeof msgInput.addEventListener === "function") {
                msgInput.addEventListener("keypress", function(e) {
                    if (e.key === "Enter" && e.target.value.trim()) {
                        // Defer to next tick so user message is already in system
                        setTimeout(() => {
                            RunebookExtension.handleNewMessage(e.target.value);
                            e.target.value = "";
                        }, 100);
                    }
                });
            }
        }
    }

    /** Handle new user message */
    handleNewMessage(userText) {
        runebooks.forEach(rb => {
            let ruleResults = rb.evaluateRules({ text: userText });
            let triggerResults = rb.evaluateTriggers({ text: userText });

            if (ruleResults.length > 0 || triggerResults.length > 0) {
                console.log(`[Runebook] ${rb.name} triggered:`, [...ruleResults, ...triggerResults]);
            }
        });
    }

    /** Handle AI response message */
    handleAiMessage(aiText) {
        runebooks.forEach(rb => {
            let ruleResults = rb.evaluateRules({ text: aiText });
            let triggerResults = rb.evaluateTriggers({ text: aiText });

            if (ruleResults.length > 0 || triggerResults.length > 0) {
                console.log(`[Runebook] ${rb.name} triggered:`, [...ruleResults, ...triggerResults]);
            }
        });
    }

    /** Create example runebook for demo */
    createExampleRunebook(name) {
        let rb = new Runebook(name);

        // Define meter objects first
        let affMeter = rb.addMeter("Affection", "bar", { startValue: 30, min: 0, max: 100 });
        let trustMeter = rb.addMeter("Trust", "pips", { startValue: 2, min: 0, max: 5 });

        // Add rules that reference meter IDs
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

        rb.addTrigger({
            name: "Secret revealed",
            condition: (msg) => msg.text.includes("secret") && msg.text.includes("trust"),
            action: { type: "modify_meter", meterId: trustMeter.id, change: 2 }
        });

        runebooks.push(rb);
        console.log(`[Runebook] Created example runebook: ${name}`);
    }

    /** Open manager panel in chat window */
    static openManager() {
        // Check if already visible (toggle close)
        let existingPanel = document.getElementById("runebook-manager");
        if (existingPanel && managerVisible) {
            managerVisible = false;
            existingPanel.style.display = "none";
            console.log("[Runebook] Manager closed");
            return;
        }

        // Create panel element and append to body (like world_state_alpha does)
        let panel = document.createElement("div");
        panel.id = "runebook-manager";

        // Position at top-left (docked like Extension-Dice/WorldTracker)
        panel.style.cssText = 
            "position:absolute;top:10px;left:10px;width:380px;height:auto;" +
            "min-height:400px;z-index:9999;background:#1e1e2f;border-radius:8px;" +
            "padding:20px;font-family:'Segoe UI',sans-serif;color:#fff;" +
            "box-shadow:0 4px 20px rgba(0,0,0,0.5);overflow-y:auto;";

        // Build list of active runebooks with their meters
        let listDiv = document.createElement("div");
        listDiv.id = "runebook-list";

        // Header section
        panel.innerHTML = `
            <h2 style="color:#7c4dff;border-bottom:2px solid #7c4dff;padding-bottom:10px;">Runebook Manager</h2>
            <p style="color:#bbb;margin-top:0;font-size:13px;">Track RP conditions and elements with meters, rules, and triggers.</p>

            <button onclick="RunebookExtension.toggleExample()" 
                    style='background:#7c4dff;padding:8px 16px;margin-right:8px;border-radius:4px;color:white;font-size:13px;border:none;cursor:pointer;'>Toggle Example Runebook</button>
            
            <div id="${listDiv.id}"></div>`;

        listDiv.innerHTML = "<p style='color:#aaa;font-size:12px;'>Loading...</p>";

        panel.appendChild(listDiv);
        document.body.appendChild(panel);

        // Update list immediately
        RunebookExtension.updateRunebookList();

        managerVisible = true;
        console.log("[Runebook] Manager panel opened");
    }

    /** Toggle example runebook on/off */
    static toggleExample() {
        let hasExample = runebooks.some(rb => rb.name === "Affection Tracker");

        if (hasExample) {
            runebooks = runebooks.filter(rb => rb.name !== "Affection Tracker");
            console.log("[Runebook] Example runebook removed");
        } else {
            RunebookExtension.createExampleRunebook("Affection Tracker");
            console.log("[Runebook] Example runebook created");
        }

        // Update UI list immediately
        RunebookExtension.updateRunebookList();
    }

    /** Update manager panel list with active runebooks */
    static updateRunebookList() {
        let listDiv = document.getElementById("runebook-list");
        if (!listDiv) return;

        // Build HTML for each active runebook
        let html = "";

        for (let rb of runebooks.filter(rb => rb.active)) {
            html += `
                <div class="runebook-entry">
                    <h3 style="color:#fff;margin:0 0 8px 0;font-size:16px;">${rb.name}</h3>
                    ${RunebookExtension.buildMeterRows(rb)}
                    <span style='display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;color:white;background:#7c4dff;margin-left:8px;'>Active</span>
                </div>`;
        }

        if (!html) {
            html = "<p style='color:#aaa;font-size:12px;'>No active runebooks</p>";
        }

        listDiv.innerHTML = html;
    }

    /** Build meter rows HTML for a single runebook */
    static buildMeterRows(rb) {
        let html = "";
        for (let meter of rb.meters.filter(m => m.visible)) {
            let fillStyle = "";
            switch(meter.type) {
                case "bar":
                    fillStyle = `background:linear-gradient(90deg,#5ac8fa 0%,#ff6b6b ${((meter.value - meter.min)/(meter.max - meter.min))*100}%,#3d3d5c ${((meter.value - meter.min)/(meter.max - meter.min))*100}%)`;
                    break;
                case "pips":
                    fillStyle = `background:linear-gradient(90deg,#ffcc00 0%,#7c4dff ${((meter.value - meter.min)/(meter.max - meter.min))*100}%,#3d3d5c ${((meter.value - meter.min)/(meter.max - meter.min))*100}%)`;
                    break;
                case "number":
                    fillStyle = `background:linear-gradient(90deg,#7c4dff 0%,#ff6b6b ${((meter.value - meter.min)/(meter.max - meter.min))*100}%,#3d3d5c ${((meter.value - meter.min)/(meter.max - meter.min))*100}%)`;
                    break;
            }

            let progressPct = ((meter.value - meter.min) / (meter.max - meter.min)) * 100;
            html += `
                <div style="margin:8px 0;font-size:13px;">
                    <strong>${meter.name}</strong> (${meter.type})
                    <div style="margin-top:2px;">
                        <div style='width:100px;height:16px;border-radius:8px;overflow:hidden;background:#3d3d5c;'>
                            <div style='height:100%;background:${fillStyle};width:${progressPct}%;transition:width 0.3s ease;' aria-valuenow="${meter.value}" aria-valuemin="0" aria-valuemax="${meter.max}"></div>
                        </div>
                    </div>
                </div>`;
        }

        return html;
    }

    /** Open panel when called from extension menu */
    static openRunebookPanel() {
        RunebookExtension.openManager();
        return true;
    }
}

// Export for ES module loading (if Silly Tavern supports it)
export default RunebookExtension;