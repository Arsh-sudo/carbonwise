import { useState, useEffect, useRef } from "react";

const CATEGORIES = {
  transport: {
    label: "Transport", icon: "🚗", color: "#f97316", darkColor: "#fb923c",
    inputs: [
      { id: "car_km", label: "Car distance (km/week)", max: 1000, default: 150, factor: 0.21 },
      { id: "flights", label: "Flights per year", max: 30, default: 2, factor: 255 },
      { id: "public_transport", label: "Public transit (km/week)", max: 200, default: 30, factor: 0.089 },
    ],
  },
  food: {
    label: "Food & Diet", icon: "🍽️", color: "#22c55e", darkColor: "#4ade80",
    inputs: [
      { id: "meat_meals", label: "Meat meals per week", max: 21, default: 5, factor: 6.0 },
      { id: "dairy_servings", label: "Dairy servings per day", max: 6, default: 2, factor: 1.3 },
      { id: "food_waste", label: "Food waste (kg/week)", max: 10, default: 2, factor: 2.5 },
    ],
  },
  energy: {
    label: "Home Energy", icon: "⚡", color: "#eab308", darkColor: "#facc15",
    inputs: [
      { id: "electricity_kwh", label: "Electricity (kWh/month)", max: 1000, default: 250, factor: 0.82 },
      { id: "gas_cubic", label: "Gas (m³/month)", max: 200, default: 50, factor: 2.1 },
      { id: "heating_hours", label: "Heating hours/day (winter)", max: 24, default: 6, factor: 0.9 },
    ],
  },
  shopping: {
    label: "Shopping", icon: "🛍️", color: "#a855f7", darkColor: "#c084fc",
    inputs: [
      { id: "clothes_items", label: "New clothing items/month", max: 20, default: 3, factor: 8.5 },
      { id: "electronics", label: "Electronics purchases/year", max: 10, default: 1, factor: 70 },
      { id: "online_orders", label: "Online orders/week", max: 20, default: 3, factor: 0.5 },
    ],
  },
};

const TIPS = {
  transport: ["Switch to an EV or hybrid for your daily commute", "Try cycling or walking for trips under 5km", "Use video calls instead of business flights", "Carpool with colleagues at least twice a week"],
  food: ["Try one plant-based meal per day", "Buy local, seasonal produce to cut food miles", "Plan meals in advance to reduce food waste", "Reduce red meat to 1–2 meals per week"],
  energy: ["Switch to a 100% renewable energy tariff", "Set your thermostat 2°C lower and wear a sweater", "Install LED bulbs throughout your home", "Use a smart meter to track real-time usage"],
  shopping: ["Buy secondhand clothing from apps like Vinted", "Repair electronics before replacing them", "Choose products with minimal packaging", "Wait 72 hours before non-essential purchases"],
};

const GLOBAL_AVG = 4800;
const INDIA_AVG = 1800;
const TARGET = 2000;

function calcFootprint(values) {
  let totals = {}, grand = 0;
  for (const [cat, data] of Object.entries(CATEGORIES)) {
    let sum = 0;
    for (const inp of data.inputs) {
      const val = values[inp.id] ?? inp.default;
      let annual;
      if (inp.id === "flights" || inp.id === "electronics") annual = val * inp.factor;
      else if (["electricity_kwh","gas_cubic","heating_hours"].includes(inp.id)) annual = val * inp.factor * 12;
      else annual = val * inp.factor * 52;
      sum += annual;
    }
    totals[cat] = Math.round(sum); grand += sum;
  }
  return { totals, grand: Math.round(grand) };
}

function getRating(kg) {
  if (kg < 2000) return { label: "Eco Champion", emoji: "🌱", color: "#22c55e", darkColor: "#4ade80", bgLight: "#f0fdf4", bgDark: "#052e16" };
  if (kg < 4000) return { label: "Below Average", emoji: "💧", color: "#3b82f6", darkColor: "#60a5fa", bgLight: "#eff6ff", bgDark: "#1e3a5f" };
  if (kg < 7000) return { label: "Average Impact", emoji: "🔥", color: "#f97316", darkColor: "#fb923c", bgLight: "#fff7ed", bgDark: "#431407" };
  return { label: "High Impact", emoji: "⚠️", color: "#ef4444", darkColor: "#f87171", bgLight: "#fef2f2", bgDark: "#450a0a" };
}

// Animated counter hook
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    const start = prevTarget.current;
    prevTarget.current = target;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);
  return value;
}

function DonutChart({ totals, total, dark }) {
  const entries = Object.entries(totals);
  const colors = Object.values(CATEGORIES).map(c => dark ? c.darkColor : c.color);
  const size = 170; const cx = size/2, cy = size/2, r = 66, inner = 38;
  let cum = 0;
  const slices = entries.map(([cat, val], i) => {
    const pct = total > 0 ? val / total : 0;
    const sa = cum * 2 * Math.PI - Math.PI / 2; cum += pct;
    const ea = cum * 2 * Math.PI - Math.PI / 2;
    const x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
    const ix1=cx+inner*Math.cos(sa),iy1=cy+inner*Math.sin(sa),ix2=cx+inner*Math.cos(ea),iy2=cy+inner*Math.sin(ea);
    const lg = pct > 0.5 ? 1 : 0;
    return { cat, val, pct, color: colors[i], path: `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${inner},${inner} 0 ${lg},0 ${ix1.toFixed(1)},${iy1.toFixed(1)} Z` };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}>
        {slices.map((s, i) => (
          <path key={s.cat} d={s.path} fill={s.color}
            style={{ transition: "all 0.5s ease", transformOrigin: `${cx}px ${cy}px` }}
            onMouseEnter={e => e.target.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        ))}
        <text x={cx} y={cy-7} textAnchor="middle" fontSize="14" fontWeight="700" fill={dark?"#f1f5f9":"#1e293b"}>{(total/1000).toFixed(1)}t</text>
        <text x={cx} y={cy+9} textAnchor="middle" fontSize="10" fill={dark?"#94a3b8":"#64748b"}>CO₂e/yr</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map(([cat, val], i) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, animation: `fadeSlideIn 0.4s ease ${i*0.07}s both` }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i], flexShrink: 0, boxShadow: `0 0 6px ${colors[i]}88` }} />
            <span style={{ fontSize: 12, color: dark?"#94a3b8":"#64748b", minWidth: 100 }}>{CATEGORIES[cat].label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: dark?"#e2e8f0":"#1e293b" }}>{(val/1000).toFixed(2)}t</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarComparison({ grand, dark }) {
  const bars = [
    { label: "You", value: grand, color: grand > GLOBAL_AVG ? "#ef4444" : grand > INDIA_AVG ? "#f97316" : "#22c55e" },
    { label: "India avg", value: INDIA_AVG, color: "#3b82f6" },
    { label: "World avg", value: GLOBAL_AVG, color: dark?"#64748b":"#94a3b8" },
    { label: "2°C Target", value: TARGET, color: "#22c55e" },
  ];
  const max = Math.max(...bars.map(b => b.value)) * 1.15;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {bars.map((b, i) => (
        <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 10, animation: `fadeSlideIn 0.4s ease ${i*0.08}s both` }}>
          <span style={{ fontSize: 12, color: dark?"#94a3b8":"#64748b", width: 68, textAlign: "right", flexShrink: 0 }}>{b.label}</span>
          <div style={{ flex: 1, background: dark?"#1e293b":"#f1f5f9", borderRadius: 6, height: 24, overflow: "hidden" }}>
            <div style={{ width: `${(b.value/max)*100}%`, background: b.color, height: "100%", borderRadius: 6, transition: "width 0.8s cubic-bezier(.34,1.56,.64,1)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{(b.value/1000).toFixed(1)}t</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIInsight({ footprint, dark }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getInsight = async () => {
    setLoading(true); setError(""); setInsight("");
    const summary = Object.entries(footprint.totals).map(([cat,val]) => `${CATEGORIES[cat].label}: ${(val/1000).toFixed(2)}t CO₂e`).join(", ");
    const prompt = `You are a friendly climate coach. A person's annual carbon footprint is ${(footprint.grand/1000).toFixed(2)} tonnes CO₂e. Breakdown: ${summary}. The global average is 4.8t and the Paris Agreement target is 2t. Give them a short (3-4 sentence), warm, personalised insight identifying their biggest impact area and one specific, achievable action they can take this week to reduce it. Be encouraging, not preachy.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setInsight(data.content?.map(b => b.text||"").join("") || "");
    } catch (e) { setError("Could not load AI insight. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ background: dark ? "linear-gradient(135deg,#052e16,#064e3b)" : "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: `1.5px solid ${dark?"#16a34a44":"#86efac"}`, borderRadius: 18, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.06, pointerEvents: "none" }}>🌿</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: dark?"#16a34a33":"#bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: dark?"#4ade80":"#15803d", fontSize: 15 }}>AI Personal Coach</p>
          <p style={{ margin: 0, fontSize: 11, color: dark?"#86efac88":"#16a34a88" }}>Powered by Claude</p>
        </div>
      </div>
      {insight ? (
        <p style={{ fontSize: 14, color: dark?"#86efac":"#166534", lineHeight: 1.75, margin: "0 0 14px", animation: "fadeSlideIn 0.5s ease" }}>{insight}</p>
      ) : (
        <p style={{ fontSize: 13, color: dark?"#4ade8088":"#15803d88", margin: "0 0 14px" }}>Get a personalised analysis and your most impactful next step.</p>
      )}
      {error && <p style={{ fontSize: 13, color: "#ef4444", margin: "0 0 10px" }}>{error}</p>}
      <button onClick={getInsight} disabled={loading} style={{ background: loading ? (dark?"#14532d":"#dcfce7") : "#16a34a", color: loading ? (dark?"#4ade80":"#15803d") : "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: loading?"default":"pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.2s", transform: loading?"scale(0.97)":"scale(1)" }}>
        {loading ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Analysing your footprint...</> : <>{insight ? "🔄 Refresh Insight" : "✨ Get My Insight"}</>}
      </button>
    </div>
  );
}

function SliderInput({ inp, catData, value, onChange, dark }) {
  const pct = (value / inp.max) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: dark?"#94a3b8":"#64748b", fontWeight: 500 }}>{inp.label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color: dark ? catData.darkColor : catData.color, background: `${dark ? catData.darkColor : catData.color}18`, padding: "1px 9px", borderRadius: 20 }}>{value}</span>
      </div>
      <div style={{ position: "relative", height: 6, background: dark?"#1e293b":"#f1f5f9", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${dark ? catData.darkColor : catData.color}88, ${dark ? catData.darkColor : catData.color})`, borderRadius: 3, transition: "width 0.15s ease" }} />
        <input type="range" min={0} max={inp.max} step={1} value={value} onChange={e => onChange(inp.id, Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
      </div>
    </div>
  );
}

export default function App() {
  const defaultValues = {};
  for (const [,catData] of Object.entries(CATEGORIES)) for (const inp of catData.inputs) defaultValues[inp.id] = inp.default;

  const [values, setValues] = useState(defaultValues);
  const [activeTab, setActiveTab] = useState("transport");
  const [page, setPage] = useState("calculator");
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const footprint = calcFootprint(values);
  const rating = getRating(footprint.grand);
  const topCat = Object.entries(footprint.totals).sort((a,b) => b[1]-a[1])[0][0];
  const animatedGrand = useCountUp(footprint.grand);
  const handleChange = (id, val) => setValues(v => ({ ...v, [id]: val }));

  const bg = dark ? "#0f172a" : "#f8fafc";
  const cardBg = dark ? "#1e293b" : "#ffffff";
  const cardBorder = dark ? "#334155" : "#e2e8f0";
  const textPrimary = dark ? "#f1f5f9" : "#0f172a";
  const textSecondary = dark ? "#94a3b8" : "#64748b";
  const ratingColor = dark ? rating.darkColor : rating.color;
  const catColor = (cat) => dark ? CATEGORIES[cat].darkColor : CATEGORIES[cat].color;

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: bg, transition: "background 0.4s ease, color 0.4s ease" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0 80px" }}>

        {/* HEADER */}
        <div style={{ background: dark ? "linear-gradient(135deg,#0f2027,#203a43,#1a4731)" : "linear-gradient(135deg,#134e2a,#1a6b3c,#40916c)", padding: "28px 28px 22px", borderRadius: "0 0 24px 24px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: 40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, backdropFilter: "blur(10px)" }}>🌍</div>
              <div>
                <h1 style={{ color: "#fff", margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.8 }}>CarbonWise</h1>
                <p style={{ color: "#95d5b2", margin: "3px 0 0", fontSize: 13 }}>Understand · Track · Reduce</p>
              </div>
            </div>
            {/* Dark mode toggle */}
            <button onClick={() => setDark(d => !d)} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontSize: 18, backdropFilter: "blur(10px)", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 600, fontSize: 13 }}
              title="Toggle dark mode">
              <span style={{ fontSize: 16, transition: "transform 0.4s", transform: dark ? "rotate(180deg)" : "rotate(0deg)" }}>{dark ? "☀️" : "🌙"}</span>
              {dark ? "Light" : "Dark"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {["calculator","dashboard"].map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ padding: "8px 20px", borderRadius: 22, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: page===p ? "#fff" : "rgba(255,255,255,0.12)", color: page===p ? "#1a4731" : "#d8f3dc", transition: "all 0.25s", transform: page===p ? "scale(1.02)" : "scale(1)", boxShadow: page===p ? "0 4px 14px rgba(0,0,0,0.15)" : "none" }}>
                {p === "calculator" ? "⚡ Calculator" : "📊 Dashboard"}
              </button>
            ))}
          </div>
        </div>

        {/* CALCULATOR PAGE */}
        {page === "calculator" && (
          <div style={{ padding: "0 16px", animation: "fadeSlideIn 0.4s ease" }}>
            {/* Score banner */}
            <div style={{ background: dark ? rating.bgDark : rating.bgLight, border: `2px solid ${ratingColor}30`, borderRadius: 20, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, transition: "all 0.4s ease", boxShadow: dark ? "none" : `0 4px 20px ${rating.color}18` }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: ratingColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2 }}>Your Annual Footprint</p>
                <p style={{ margin: "4px 0 0", fontSize: 42, fontWeight: 900, color: ratingColor, letterSpacing: -1, lineHeight: 1, transition: "color 0.4s" }}>
                  {(animatedGrand/1000).toFixed(1)}<span style={{ fontSize: 18, fontWeight: 500, marginLeft: 4 }}>t CO₂e</span>
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: dark ? ratingColor+"99" : ratingColor+"bb" }}>
                  {footprint.grand < GLOBAL_AVG ? `${Math.round((1-footprint.grand/GLOBAL_AVG)*100)}% below world average` : `${Math.round((footprint.grand/GLOBAL_AVG-1)*100)}% above world average`}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span style={{ background: ratingColor, color: "#fff", borderRadius: 22, padding: "7px 18px", fontSize: 13, fontWeight: 800, boxShadow: `0 4px 14px ${ratingColor}44` }}>
                  {rating.emoji} {rating.label}
                </span>
                <span style={{ fontSize: 12, color: dark ? ratingColor+"88" : ratingColor+"99" }}>Target: 2.0t for Paris 2°C</span>
              </div>
            </div>

            {/* Category tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
              {Object.entries(CATEGORIES).map(([cat, data]) => {
                const active = activeTab === cat;
                const cc = catColor(cat);
                return (
                  <button key={cat} onClick={() => setActiveTab(cat)} style={{ padding: "9px 16px", borderRadius: 12, border: `2px solid ${active ? cc : (dark?"#334155":"#e2e8f0")}`, background: active ? `${cc}22` : cardBg, color: active ? cc : textSecondary, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s", transform: active ? "translateY(-2px)" : "translateY(0)", boxShadow: active ? `0 4px 14px ${cc}30` : "none" }}>
                    <span>{data.icon}</span>
                    <span>{data.label}</span>
                    <span style={{ background: active ? cc : (dark?"#334155":"#f1f5f9"), color: active ? "#fff" : textSecondary, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 700, transition: "all 0.2s" }}>
                      {(footprint.totals[cat]/1000).toFixed(1)}t
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inputs + Tips grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: "20px 22px", transition: "all 0.3s", boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, color: textPrimary, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: `${catColor(activeTab)}22`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{CATEGORIES[activeTab].icon}</span>
                  Adjust Values
                </h3>
                {CATEGORIES[activeTab].inputs.map(inp => (
                  <SliderInput key={inp.id} inp={inp} catData={CATEGORIES[activeTab]} value={values[inp.id] ?? inp.default} onChange={handleChange} dark={dark} />
                ))}
              </div>
              <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: "20px 22px", transition: "all 0.3s", boxShadow: dark ? "none" : "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, color: textPrimary, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: "#fef08a33", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>💡</span>
                  Quick Wins
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {TIPS[activeTab].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "11px 14px", background: dark ? "#0f172a" : "#f8fafc", borderRadius: 12, borderLeft: `3px solid ${catColor(activeTab)}`, animation: `fadeSlideIn 0.35s ease ${i*0.07}s both`, transition: "transform 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: catColor(activeTab), minWidth: 18, marginTop: 1 }}>{i+1}</span>
                      <p style={{ margin: 0, fontSize: 13, color: textSecondary, lineHeight: 1.55 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <AIInsight footprint={footprint} dark={dark} />
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {page === "dashboard" && (
          <div style={{ padding: "0 16px", animation: "fadeSlideIn 0.4s ease" }}>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 22 }}>
              {[
                { label: "Your Footprint", value: `${(footprint.grand/1000).toFixed(1)}t`, sub: "CO₂e per year", color: ratingColor, bg: dark?rating.bgDark:rating.bgLight },
                { label: "vs World Average", value: footprint.grand < GLOBAL_AVG ? `${Math.round((1-footprint.grand/GLOBAL_AVG)*100)}% less` : `${Math.round((footprint.grand/GLOBAL_AVG-1)*100)}% more`, sub: "than 4.8t global avg", color: footprint.grand<GLOBAL_AVG?(dark?"#4ade80":"#16a34a"):(dark?"#f87171":"#dc2626"), bg: footprint.grand<GLOBAL_AVG?(dark?"#052e16":"#f0fdf4"):(dark?"#450a0a":"#fef2f2") },
                { label: "Above Paris Target", value: `${Math.max(0,(footprint.grand-TARGET)/1000).toFixed(1)}t`, sub: "target is 2.0t/year", color: dark?"#fb923c":"#ea580c", bg: dark?"#431407":"#fff7ed" },
              ].map((card, i) => (
                <div key={card.label} style={{ background: card.bg, borderRadius: 18, padding: "18px 20px", border: `1.5px solid ${card.color}22`, animation: `fadeSlideIn 0.4s ease ${i*0.1}s both`, transition: "transform 0.2s, box-shadow 0.2s", boxShadow: dark?"none":`0 2px 12px ${card.color}12` }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${card.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=dark?"none":`0 2px 12px ${card.color}12`; }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: card.color, textTransform: "uppercase", letterSpacing: 1 }}>{card.label}</p>
                  <p style={{ margin: "5px 0 3px", fontSize: 28, fontWeight: 900, color: card.color, letterSpacing: -0.5 }}>{card.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: `${card.color}99` }}>{card.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: "20px 22px", boxShadow: dark?"none":"0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, color: textPrimary, fontWeight: 700 }}>🍩 Category Breakdown</h3>
                <DonutChart totals={footprint.totals} total={footprint.grand} dark={dark} />
              </div>
              <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: "20px 22px", boxShadow: dark?"none":"0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, color: textPrimary, fontWeight: 700 }}>📊 How You Compare</h3>
                <BarComparison grand={footprint.grand} dark={dark} />
                <p style={{ marginTop: 14, fontSize: 12, color: textSecondary, lineHeight: 1.6, padding: "10px 12px", background: dark?"#0f172a":"#f8fafc", borderRadius: 10 }}>
                  Biggest area: <strong style={{ color: catColor(topCat) }}>{CATEGORIES[topCat].label}</strong> at {(footprint.totals[topCat]/1000).toFixed(2)}t — focus here for maximum impact.
                </p>
              </div>
            </div>

            {/* Progress bars */}
            <div style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: 18, padding: "20px 22px", marginBottom: 20, boxShadow: dark?"none":"0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, color: textPrimary, fontWeight: 700 }}>📈 Impact Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(footprint.totals).sort((a,b) => b[1]-a[1]).map(([cat, val], i) => {
                  const pct = footprint.grand > 0 ? (val/footprint.grand)*100 : 0;
                  const cc = catColor(cat);
                  return (
                    <div key={cat} style={{ animation: `fadeSlideIn 0.4s ease ${i*0.08}s both` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary, display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cc, display: "inline-block", boxShadow: `0 0 6px ${cc}` }} />
                          {CATEGORIES[cat].icon} {CATEGORIES[cat].label}
                        </span>
                        <span style={{ fontSize: 13, color: cc, fontWeight: 700 }}>
                          {(val/1000).toFixed(2)}t <span style={{ color: textSecondary, fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div style={{ background: dark?"#0f172a":"#f1f5f9", borderRadius: 6, height: 10, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, background: `linear-gradient(90deg,${cc}88,${cc})`, height: "100%", borderRadius: 6, transition: "width 0.9s cubic-bezier(.34,1.56,.64,1)", boxShadow: `0 0 8px ${cc}44` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <AIInsight footprint={footprint} dark={dark} />
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #94a3b844; border-radius: 3px; }
        button { font-family: inherit; }
      `}</style>
    </div>
  );
}
