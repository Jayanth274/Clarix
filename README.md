# Clarix — Cognitive Waste Detection Engine

> Quantify the invisible mental friction on any website. Analyze UX, detect cognitive waste, and get AI-powered fixes in seconds.

---

## What is Clarix?

Clarix is a full-stack web application that analyzes any public website for **cognitive waste** — the invisible mental effort users spend navigating confusing layouts, dense menus, poor readability, and unclear calls-to-action.

It crawls the target website using a real headless browser, captures a screenshot, extracts DOM-level element coordinates, and produces a **Cognitive Waste Score (CWS)** out of 100. Higher score = more waste = worse UX.

---

## Features

### Real DOM Analysis
A headless Playwright browser fully renders the target site — including JavaScript-heavy SPAs — captures a viewport screenshot, and extracts real element coordinates, link depth, readability scores, and interaction data.

### Cognitive Waste Score (CWS)
Five categories, each scored 0–20:

| Category | What it measures |
|---|---|
| Navigation Waste | Menu item count, navigation depth, Hick's Law violations |
| Visual Waste | Link density, button overload, page scroll ratio |
| Content Waste | Flesch-Kincaid readability, missing H1, alt text, meta description |
| Interaction Waste | Missing search, mobile responsiveness, CTA presence, touch target size, contrast ratio |
| Goal Waste | Whether the user's stated goal is reachable from the homepage |

### AI Visual Audit
Ask the AI Auditor anything about your score. Say **"visually show me"** to trigger a full-screen annotated walkthrough of your site's actual screenshot — friction points highlighted with real DOM coordinates, not hardcoded zones.

### AI Auditor Chatbot
Context-aware chatbot powered by an AI model. Provides dual-path responses for every fix:
- **For Developers** — exact code snippets
- **For Non-Technical Users** — step-by-step no-code instructions

Always projects score improvements accurately (lower score = less waste = better).

### Competitor Comparison
Scan two websites side by side. Get an instant winner declaration with a full score breakdown for each site.

### Partial Crawl Detection
If the crawler can only partially access a site, Clarix shows a warning banner explaining exactly why — rather than silently returning inaccurate data.

### Smart Error Handling
Specific, human-readable error messages for blocked sites, DNS failures, timeouts, SSL errors, and robots.txt restrictions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js, Express |
| Crawler | Playwright (Chromium, headless) |
| AI | OpenRouter API |
| Screenshot | Playwright JPEG capture |
| Thumbnail | html2canvas |
| Markdown | ReactMarkdown |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Jayanth274/clarix.git
cd clarix

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup

Create a `.env` file in the `/backend` directory:

```env
OPENROUTER_API_KEY=your_api_key_here
PORT=5000
```

Get your API key from [OpenRouter](https://openrouter.ai) and paste it as the value for `OPENROUTER_API_KEY`.

### Running Locally

```bash
# Terminal 1 — Start backend
cd backend
npm start

# Terminal 2 — Start frontend
cd frontend
npm run dev
```

Frontend runs at `http://localhost:3000`
Backend runs at `http://localhost:5000`

---

## How It Works

1. **Enter URL & Goal** — Paste any public website URL and describe what a user is trying to accomplish (e.g. "find contact info", "buy a product")

2. **Deep DOM Crawl** — Playwright launches a headless Chromium browser, fully renders the page including JavaScript frameworks, scrolls to trigger lazy-loaded content, captures a screenshot, and extracts real element coordinates

3. **Cognitive Waste Score** — Five categories are scored using real metrics: menu item counts, link density, Flesch-Kincaid readability, touch target sizes, contrast ratios, and goal keyword matching

4. **AI Visual Audit** — Open the AI Auditor and say "visually show me" to trigger a full-screen step-by-step walkthrough of your site's friction points, annotated directly on the screenshot

---

## Works Best On

- Blogs and personal websites
- Portfolio sites
- College and university websites
- Small business websites
- E-commerce sites (non-enterprise)

> Large platforms like Amazon, Flipkart, or Google may block automated access — this is expected behavior, not a bug. Clarix respects robots.txt.

---

## Project Structure

```
clarix/
├── backend/
│   ├── autonomousCrawler.js     # Playwright crawler + CWS scoring engine
│   ├── server.js                # Express API routes
│   └── websocketServer.js       # WebSocket server
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx  # Home page
│       │   ├── AnalyzerPage.jsx # Main analysis page
│       │   └── ComparisonPage.jsx
│       └── components/
│           ├── FullScreenAudit.jsx  # Visual audit walkthrough
│           ├── ScoreGauge.jsx       # CWS gauge
│           └── BreakdownPanel.jsx   # Score breakdown cards
```

---

## Author

Built by [Sri Sai Jayanth](https://github.com/Jayanth274)
