export default function RulesList({ rules }) {
    if (!rules || rules.length === 0) {
        return <div className="no-rules">No active rules</div>;
    }

    return (
        <ul className="rules-list">
            {rules.map(rule => (
                <li key={rule.id} className="rule-item">
                    <strong>{rule.name}</strong>
                    <div className="rule-condition">
                        {typeof rule.condition === "string" ? rule.condition : "(function)"}
                    </div>
                    <div className="rule-action">{describeAction(rule.action)}</div>
                </li>
            ))}
        </ul>
    );
}

export default function TriggersList({ triggers }) {
    if (!triggers || triggers.length === 0) {
        return <div className="no-triggers">No active triggers</div>;
    }

    return (
        <ul className="triggers-list">
            {triggers.map(trigger => (
                <li key={trigger.id} className="trigger-item">
                    <strong>{trigger.name}</strong>
                    <div className="trigger-condition">
                        {typeof trigger.condition === "string" ? trigger.condition : "(function)"}
                    </div>
                    <div className="trigger-action">{describeAction(trigger.action)}</div>
                </li>
            ))}
        </ul>
    );
}

function describeAction(action) {
    if (!action) return "no action";

    if (action.type === "modify_meter") {
        return `${action.meterId}: change by ${action.change}`;
    } else if (action.type === "set_meter") {
        return `${action.meterId}: set to ${action.value}`;
    } else if (action.type === "show_status") {
        return `"${action.status}"`;
    } else if (action.type === "play_sound") {
        return `sound: ${action.sound || "default"}`;
    }

    return `${action.type}: ...`;
}