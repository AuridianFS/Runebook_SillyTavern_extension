import React from "react";
import Meter from "./Meter.jsx";
import RulesList from "./RulesList.jsx";
import TriggersList from "./RulesList.jsx";  // Using same file, both exports available

export default function RunebookPanel({ runebooks, onToggleExample }) {
    return (
        <div className="runebook-panel">
            <h2>Runebook Manager</h2>
            <p className="subtitle">Track RP conditions and elements with meters, rules, and triggers.</p>

            <button onClick={onToggleExample}>
                Toggle Example Runebook: Affection Tracker
            </button>

            <div className="runebook-list">
                {runebooks.map(rb => (
                    <RunebookEntry key={rb.id} rb={rb} />
                ))}

                {runebooks.length === 0 && (
                    <p className="empty-message">No active runebooks. Enable the example or create custom ones.</p>
                )}
            </div>

            <button className="export-btn" onClick={window.runebookExport}>Export All</button>
            <button className="import-btn" onClick={window.runebookImport}>Import Data</button>
        </div>
    );
}

function RunebookEntry({ rb }) {
    return (
        <div className="runebook-entry">
            <h3>{rb.name}</h3>
            
            <p>Meters ({rb.meters.length}):</p>
            <div className="meters-row">
                {rb.meters.map(meter => (
                    <Meter key={meter.id} meter={meter} />
                ))}
            </div>

            <p className="stats-row">
                Rules: {rb.rules.length} | Triggers: {rb.triggers.length}
            </p>

            <details>
                <summary>View Active Rules</summary>
                <RulesList rules={rb.rules} />
            </details>

            <details>
                <summary>View Active Triggers</summary>
                <TriggersList triggers={rb.triggers} />
            </details>
        </div>
    );
}