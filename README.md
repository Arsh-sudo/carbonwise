# 🌍 CarbonWise — Carbon Footprint Awareness Platform

> **Google PromptWars Virtual — Challenge 3 Submission**

CarbonWise helps individuals **understand, track, and reduce** their carbon footprint through an interactive calculator, rich data visualisations, and AI-powered personalised insights (Claude API).

---

## ✨ Features

| Feature | Details |
|---|---|
| **Interactive Calculator** | Sliders across 4 categories: Transport, Food & Diet, Home Energy, Shopping |
| **Real-time Scoring** | Instant CO₂e calculation with a rating badge (Eco Champion → High Impact) |
| **Analytics Dashboard** | Donut chart breakdown, bar comparison vs India/World averages and Paris target |
| **AI-Powered Insights** | Claude API gives personalised, encouraging advice based on YOUR data |
| **Actionable Tips** | Category-specific quick wins to reduce impact immediately |
| **Responsive Design** | Works on mobile and desktop |

---

## 🛠 Tech Stack

- **React 18** + **Vite** — fast frontend build
- **Anthropic Claude API** — AI personalised insights (`claude-sonnet-4-20250514`)
- **Pure CSS** — no external UI library, custom charts with SVG + DOM
- **Vercel / Netlify** — zero-config deployment

---

## 🚀 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# → http://localhost:5173
```

> **Note:** The AI Insight feature calls the Anthropic API. You need to configure a proxy or use the deployed version where the API key is injected server-side. See deployment section.

---

## 📦 Build for Production

```bash
npm run build
# Output in /dist — ready to deploy
```

---

## 🌐 Deployment (Vercel — Recommended)

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel --prod
```

### Option B — Vercel Dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework: **Vite** (auto-detected)
4. Click **Deploy**
5. Your live URL will be: `https://carbonwise-<hash>.vercel.app`

### Option C — Netlify
```bash
npm run build
# Drag and drop the /dist folder to netlify.com/drop
```

---

## 🔑 API Key Handling

The Claude API key is passed through the Anthropic CORS proxy and does **not** need to be embedded in the frontend for PromptWars evaluation (the API endpoint accepts requests from claude.ai-hosted apps). For your own deployment, you can set up a simple serverless function:

```js
// api/insight.js (Vercel serverless)
export default async function handler(req, res) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(req.body)
  });
  const data = await response.json();
  res.json(data);
}
```

Add `ANTHROPIC_API_KEY` in Vercel Environment Variables.

---

## 📊 Carbon Calculation Methodology

| Category | Emission Factors |
|---|---|
| Car travel | 0.21 kg CO₂e/km (petrol average) |
| Flights | 255 kg CO₂e/flight (short-haul average) |
| Public transit | 0.089 kg CO₂e/km |
| Meat meal | 6.0 kg CO₂e/meal |
| Dairy serving | 1.3 kg CO₂e/serving |
| Electricity | 0.82 kg CO₂e/kWh (India grid) |
| Gas | 2.1 kg CO₂e/m³ |

Sources: IPCC, Our World in Data, UK DEFRA emission factors.

---

## 📁 Project Structure

```
carbonwise/
├── src/
│   ├── App.jsx        # Main application (calculator + dashboard + AI)
│   └── main.jsx       # React entry point
├── index.html         # HTML shell
├── vite.config.js     # Vite configuration
├── package.json
└── README.md
```

---

## 🏆 Built for Google PromptWars Virtual — Challenge 3
**Problem Statement:** Carbon Footprint Awareness Platform — Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalised insights.

---

## 📜 License
MIT — free to use and modify.
