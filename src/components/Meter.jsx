import React from "react";

export default function Meter({ meter, onChange }) {
    const { type, value, min, max } = meter;
    
    let displayValue = (value - min) / (max - min) * 100;
    let color = "blue";

    if (displayValue < 25) color = "red";
    else if (displayValue < 75) color = "yellow";

    if (type === METER_BAR) {
        return (
            <div className="meter-bar">
                <span className="meter-label">{meter.name}</span>
                <div className={`meter-fill ${color}`}>
                    <div className="meter-progress" style={{ width: `${displayValue}%` }}></div>
                </div>
                <span className="meter-value">{value.toFixed(1)}%</span>
            </div>
        );
    }

    if (type === METER_PIPS) {
        let pipCount = Math.round(value);
        return (
            <div className="meter-pips">
                <span className="meter-label">{meter.name}</span>
                <div className="pip-container">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div 
                            key={i} 
                            className={`pip ${i <= pipCount ? "filled" : ""}`}
                        ></div>
                    ))}
                </div>
                <span className="meter-value">{value.toFixed(1)}</span>
            </div>
        );
    }

    if (type === METER_NUMBER) {
        return (
            <div className="meter-number">
                <span className="meter-label">{meter.name}</span>
                <span className="meter-value">{value.toFixed(2)}</span>
            </div>
        );
    }

    return null;
}