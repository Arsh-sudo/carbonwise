import { useState, useEffect, useRef } from "react";

const CATEGORIES = {
  transport: {
    label: "Transport",
    icon: "🚗",
    color: "#e85d04",
    inputs: [
      { id: "car_km", label: "Car distance (km/week)", max: 1000, default: 150, factor: 0.21 },
      { id: "flights", label: "Flights per year", max: 30, default: 2, factor: 255 },
      { id: "public_transport", label: "Public transit (km/week)", max: 200, default: 30, factor: 0.089 },
    ],
  },
  food: {
    label: "Food & Diet",
    icon: "🍽️",
    color: "#2d6a4f",
    inputs: [
      { id: "meat_meals", label: "Meat meals per week", max: 21, default: 5, factor: 6.0 },
      { id: "dairy_servings", label: "Dairy servings per day", max: 6, default: 2, factor: 1.3 },
      { id: "food_waste", label: "Food waste (kg/week)", max: 10, default: 2, factor: 2.5 },
    ],
  },
  energy: {
    label: "Home Energy",
    icon: "⚡",
    color: "#f4a261",
    inputs: [
      { id: "electricity_kwh", label: "Electricity (kWh/month)", max: 1000, default: 250, factor: 0.82 },
      { id: "gas_cubic", label: "Gas (m³/month)", max: 200, default: 50, factor: 2.1 },
      { id: "heating_hours", label: "Heating hours/day (winter)", max: 24, default: 6, factor: 0.9 },
    ],
  },
  shopping: {
    label: "Shopping",
    icon: "🛍️",
    color: "#7b2d8b",
    inputs: [
      { id: "clothes_items", label: "New clothing items/month", max: 20, default: 3, factor: 8.5 },
      { id: "electronics", label: "Electronics purchases/year", max: 10, default: 1, factor: 70 },
      { id: "online_orders", label: "Online orders/week", max: 20, default: 3, factor: 0.5 },
    ],
  },
};

const TIPS = {
  transport: [
    "Switch to an EV or hybrid for your daily commute",
    "Try cycling or walking for trips under 5km",
    "Use video calls instead of business flights",
    "Carpool with colleagues at least twice a week",
  ],
  food: [
    "Try one plant-based meal per day",
    "Buy local, seasonal produce to cut food miles",
    "Plan meals in advance to reduce food waste",
    "Reduce red meat to 1-2 meals per week",
  ],
  energy: [
    "Switch to a 100% renewable energy tariff",
    "Set your thermostat 2°C lower and wear a sweater",
    "Install LED bulbs throughout your home",
    "Use a smart meter to track real-time usage",
  ],
  shopping: [
    "Buy secondhand clothing from apps like Vinted",
    "Repair electronics before replacing them",
    "Choose products with minimal packaging",
    "Wait 72 hours before non-essential purchases",
  ],
};

const GLOBAL_AVG = 4800; // kg CO₂e per year
const INDIA_AVG = 1800;
const TARGET = 2000;

function calcFootprint(values) {
  let totals = {};
  let grand = 0;
  for (const [cat, data] of Object.entries(CATEGORIES)) {
    let sum = 0;
    for (const inp of data.inputs) {
      const val = values[inp.id] ?? inp.default;
      let annual;
      if (inp.id === "flights" || inp.id === "electronics") annual = val * inp.factor;
      else if (inp.id === "electricity_kwh" || inp.id === "gas_cubic" || inp.id === "heating_hours") annual = val * inp.factor * 12;
      else annual = val * inp.factor * 52;
      sum += annual;
    }
    totals[cat] = Math.round(sum);
    grand += sum;
  }
  return { totals, grand: Math.round(grand) };
}

function getRating(kg) {
  if (kg < 2000) return { label: "Eco Champion", color: "#2d6a4f", bg: "#d8f3dc" };
  if (kg < 4000) return { label: "Below Average", color: "#1d6fa4", bg: "#d0ebff" };
  if (kg < 7000) return { label: "Average", color: "#e85d04", bg: "#ffe8d6" };
  return { label: "High Impact", color: "#c1121f", bg: "#ffe5e5" };
}

function DonutChart({ totals, total }) {
  const entries = Object.entries(totals);
  const colors = Object.values(CATEGORIES).map((c) => c.color);
  const size = 180;
  const cx = size / 2, cy = size / 2, r = 70, inner = 42;
  let cum = 0;
  const slices = entries.map(([cat, val], i) => {
    const pct = total > 0 ? val / total : 0;
    const startAngle = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const endAngle = cum * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + inner * Math.cos(startAngle);
    const iy1 = cy + inner * Math.sin(startAngle);
    const ix2 = cx + inner * Math.cos(endAngle);
    const iy2 = cy + inner * Math.sin(endAngle);
    const large = pct > 0.5 ? 1 : 0;
    return { cat, val, pct, color: colors[i], path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${large},0 ${ix1},${iy1} Z` };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s) => <path key={s.cat} d={s.path} fill={s.color} opacity={0.88} />)}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="600" fill="#333">{(total / 1000).toFixed(1)}t</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#888">CO₂e/yr</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(([cat, val], i) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: colors[i], flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#555", minWidth: 110 }}>{CATEGORIES[cat].label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{(val / 1000).toFixed(2)}t</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarComparison({ grand }) {
  const bars = [
    { label: "You", value: grand, color: grand > GLOBAL_AVG ? "#c1121f" : grand > INDIA_AVG ? "#e85d04" : "#2d6a4f" },
    { label: "India avg", value: INDIA_AVG, color: "#1d6fa4" },
    { label: "World avg", value: GLOBAL_AVG, color: "#888" },
    { label: "Target", value: TARGET, color: "#2d6a4f" },
  ];
  const max = Math.max(...bars.map((b) => b.value)) * 1.1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bars.map((b) => (
        <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#666", width: 72, textAlign: "right", flexShrink: 0 }}>{b.label}</span>
          <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 22, overflow: "hidden" }}>
            <div style={{ width: `${(b.value / max) * 100}%`, background: b.color, height: "100%", borderRadius: 4, transition: "width 0.6s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{(b.value / 1000).toFixed(1)}t</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIInsight({ footprint, values }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getInsight = async () => {
    setLoading(true);
    setError("");
    setInsight("");
    const summary = Object.entries(footprint.totals)
      .map(([cat, val]) => `${CATEGORIES[cat].label}: ${(val / 1000).toFixed(2)}t CO₂e`)
      .join(", ");
    const prompt = `You are a friendly climate coach. A person's annual carbon footprint is ${(footprint.grand / 1000).toFixed(2)} tonnes CO₂e. Breakdown: ${summary}. The global average is 4.8t and the Paris Agreement target is 2t. Give them a short (3-4 sentence), warm, personalized insight identifying their biggest impact area and one specific, achievable action they can take this week to reduce it. Be encouraging, not preachy.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      setInsight(text);
    } catch (e) {
      setError("Could not load AI insight. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <span style={{ fontWeight: 700, color: "#166534", fontSize: 15 }}>AI-Powered Personal Insight</span>
      </div>
      {insight ? (
        <p style={{ fontSize: 14, color: "#166534", lineHeight: 1.65, margin: 0 }}>{insight}</p>
      ) : (
        <p style={{ fontSize: 13, color: "#4ade80", margin: "0 0 12px" }}>Get a personalized analysis of your footprint and what to do next.</p>
      )}
      {error && <p style={{ fontSize: 13, color: "#c1121f", margin: "8px 0 0" }}>{error}</p>}
      <button
        onClick={getInsight}
        disabled={loading}
        style={{ marginTop: 12, background: loading ? "#d1fae5" : "#16a34a", color: loading ? "#166534" : "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
      >
        {loading ? (
          <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Analysing...</>
        ) : (
          <>{insight ? "🔄 Refresh Insight" : "✨ Get My Insight"}</>
        )}
      </button>
    </div>
  );
}

function CategoryInputs({ cat, catData, values, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {catData.inputs.map((inp) => {
        const val = values[inp.id] ?? inp.default;
        return (
          <div key={inp.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{inp.label}</label>
              <span style={{ fontSize: 13, fontWeight: 700, color: catData.color }}>{val}</span>
            </div>
            <input
              type="range" min={0} max={inp.max} step={1} value={val}
              onChange={(e) => onChange(inp.id, Number(e.target.value))}
              style={{ width: "100%", accentColor: catData.color }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const defaultValues = {};
  for (const [, catData] of Object.entries(CATEGORIES))
    for (const inp of catData.inputs) defaultValues[inp.id] = inp.default;

  const [values, setValues] = useState(defaultValues);
  const [activeTab, setActiveTab] = useState("transport");
  const [page, setPage] = useState("calculator"); // calculator | dashboard

  const footprint = calcFootprint(values);
  const rating = getRating(footprint.grand);
  const topCat = Object.entries(footprint.totals).sort((a, b) => b[1] - a[1])[0][0];

  const handleChange = (id, val) => setValues((v) => ({ ...v, [id]: val }));

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 820, margin: "0 auto", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a4731 0%, #2d6a4f 60%, #40916c 100%)", padding: "28px 28px 24px", borderRadius: "0 0 20px 20px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 32 }}>🌍</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>CarbonWise</h1>
            <p style={{ color: "#95d5b2", margin: 0, fontSize: 13 }}>Understand · Track · Reduce your carbon footprint</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {["calculator", "dashboard"].map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: page === p ? "#fff" : "rgba(255,255,255,0.15)", color: page === p ? "#1a4731" : "#d8f3dc", transition: "all 0.2s" }}>
              {p === "calculator" ? "⚡ Calculator" : "📊 Dashboard"}
            </button>
          ))}
        </div>
      </div>

      {page === "calculator" && (
        <div style={{ padding: "0 16px" }}>
          {/* Score banner */}
          <div style={{ background: rating.bg, border: `2px solid ${rating.color}30`, borderRadius: 16, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: rating.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>Your Annual Footprint</p>
              <p style={{ margin: "2px 0 0", fontSize: 36, fontWeight: 800, color: rating.color }}>{(footprint.grand / 1000).toFixed(1)}<span style={{ fontSize: 16, fontWeight: 500 }}> t CO₂e</span></p>
            </div>
            <span style={{ background: rating.color, color: "#fff", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 700 }}>{rating.label}</span>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {Object.entries(CATEGORIES).map(([cat, data]) => (
              <button key={cat} onClick={() => setActiveTab(cat)}
                style={{ padding: "8px 16px", borderRadius: 10, border: `2px solid ${activeTab === cat ? data.color : "#e0e0e0"}`, background: activeTab === cat ? data.color + "18" : "#fff", color: activeTab === cat ? data.color : "#888", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                {data.icon} {data.label}
                <span style={{ background: activeTab === cat ? data.color : "#eee", color: activeTab === cat ? "#fff" : "#888", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                  {(footprint.totals[cat] / 1000).toFixed(1)}t
                </span>
              </button>
            ))}
          </div>

          {/* Inputs + tips */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#333", fontWeight: 700 }}>{CATEGORIES[activeTab].icon} Adjust Values</h3>
              <CategoryInputs cat={activeTab} catData={CATEGORIES[activeTab]} values={values} onChange={handleChange} />
            </div>
            <div style={{ background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#333", fontWeight: 700 }}>💡 Quick Wins</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TIPS[activeTab].map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#f8fafb", borderRadius: 10, borderLeft: `3px solid ${CATEGORIES[activeTab].color}` }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: CATEGORIES[activeTab].color, minWidth: 16 }}>{i + 1}</span>
                    <p style={{ margin: 0, fontSize: 13, color: "#444", lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AIInsight footprint={footprint} values={values} />
        </div>
      )}

      {page === "dashboard" && (
        <div style={{ padding: "0 16px" }}>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Your Footprint", value: `${(footprint.grand / 1000).toFixed(1)}t`, sub: "CO₂e per year", color: rating.color, bg: rating.bg },
              { label: "vs. World Average", value: footprint.grand < GLOBAL_AVG ? `${Math.round((1 - footprint.grand / GLOBAL_AVG) * 100)}% less` : `${Math.round((footprint.grand / GLOBAL_AVG - 1) * 100)}% more`, sub: "than 4.8t global avg", color: footprint.grand < GLOBAL_AVG ? "#2d6a4f" : "#c1121f", bg: footprint.grand < GLOBAL_AVG ? "#d8f3dc" : "#ffe5e5" },
              { label: "To Paris Target", value: `${Math.max(0, (footprint.grand - TARGET) / 1000).toFixed(1)}t`, sub: "above 2t target", color: "#e85d04", bg: "#fff3e0" },
            ].map((card) => (
              <div key={card.label} style={{ background: card.bg, borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${card.color}25` }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: card.color, textTransform: "uppercase", letterSpacing: 0.6 }}>{card.label}</p>
                <p style={{ margin: "4px 0 2px", fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</p>
                <p style={{ margin: 0, fontSize: 12, color: card.color + "aa" }}>{card.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Donut */}
            <div style={{ background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#333", fontWeight: 700 }}>🍩 Breakdown by Category</h3>
              <DonutChart totals={footprint.totals} total={footprint.grand} />
            </div>
            {/* Bar comparison */}
            <div style={{ background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#333", fontWeight: 700 }}>📊 How You Compare</h3>
              <BarComparison grand={footprint.grand} />
              <p style={{ marginTop: 14, fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                Your biggest category is <strong>{CATEGORIES[topCat].label}</strong> at {(footprint.totals[topCat] / 1000).toFixed(2)}t — focus here for maximum impact.
              </p>
            </div>
          </div>

          {/* Per-category progress */}
          <div style={{ background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, color: "#333", fontWeight: 700 }}>📈 Category Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(footprint.totals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
                const catData = CATEGORIES[cat];
                const pct = footprint.grand > 0 ? (val / footprint.grand) * 100 : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>{catData.icon} {catData.label}</span>
                      <span style={{ fontSize: 13, color: catData.color, fontWeight: 700 }}>{(val / 1000).toFixed(2)}t <span style={{ color: "#bbb", fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 6, height: 10, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, background: catData.color, height: "100%", borderRadius: 6, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AIInsight footprint={footprint} values={values} />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type=range] { height: 4px; cursor: pointer; }
        button:hover { opacity: 0.92; }
      `}</style>
    </div>
  );
}
