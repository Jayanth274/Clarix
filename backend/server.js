import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { initWebSocketServer } from './websocketServer.js';
import { WebsiteAnalyzer } from './autonomousCrawler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize WebSocket server
initWebSocketServer(server);

// In-memory storage (no database)
const sessions = new Map();

/**
 * 1. POST /api/session/start
 */
app.post('/api/session/start', (req, res) => {
  const sessionId = `session_${Date.now()}`;
  const { goal, uiType, optimalPath } = req.body;

  sessions.set(sessionId, {
    sessionId,
    goal,
    uiType,
    optimalPath,
    timestamp: Date.now(),
    metrics: {}
  });

  res.json({ sessionId, timestamp: Date.now() });
});

/**
 * 2. POST /api/session/update
 */
app.post('/api/session/update', (req, res) => {
  const { sessionId, metrics } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId is required' });
  }

  const session = sessions.get(sessionId);
  if (session) {
    session.metrics = { ...session.metrics, ...metrics };
    sessions.set(sessionId, session);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Session not found' });
  }
});

/**
 * 3. GET /api/session/:id
 */
app.get('/api/session/:id', (req, res) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

/**
 * 4. POST /api/analyze
 */
app.post('/api/analyze', async (req, res) => {
  const { url, goal } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const fullUrl = url.includes('://') ? url : `https://${url}`;
  console.log(`[Analyze] Starting: ${fullUrl} | Goal: "${goal || 'None'}"`);

  // Check robots.txt before analyzing
  let blockedReason = null;
  try {
    const robotsUrl = new URL(fullUrl).origin + '/robots.txt';
    const robotsRes = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text();
      const lines = robotsTxt.toLowerCase().split('\n');
      let isUserAgentAll = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'user-agent: *') isUserAgentAll = true;
        if (isUserAgentAll && trimmed.startsWith('disallow: /')) {
          const path = trimmed.replace('disallow:', '').trim();
          if (path === '/') {
            blockedReason = 'robots.txt disallows all crawlers (Disallow: /)';
            break;
          }
        }
      }
    }
  } catch(e) {
    // robots.txt fetch failed — continue anyway
  }

  try {
    const analyzer = new WebsiteAnalyzer();
    const result = await analyzer.analyze(fullUrl, goal);
    if (blockedReason) result.robotsWarning = blockedReason;
    res.json(result);
  } catch (error) {
    console.error('❌ Analysis error:', error);

    const msg = error.message || '';
    let friendlyError = '';

    if (blockedReason) {
      friendlyError = `This site's robots.txt blocks all crawlers (Disallow: /). Analysis cannot proceed without violating their crawl policy.`;
    } else if (msg.includes('net::ERR_NAME_NOT_RESOLVED') || msg.includes('EAI_AGAIN')) {
      friendlyError = `The domain could not be resolved. Check the URL for typos or try again.`;
    } else if (msg.includes('net::ERR_CONNECTION_REFUSED') || msg.includes('ECONNREFUSED')) {
      friendlyError = `The server refused the connection. The site may be down or blocking automated access.`;
    } else if (msg.includes('Timeout') || msg.includes('timeout')) {
      friendlyError = `The site took too long to respond. It may be slow or blocking headless browsers.`;
    } else if (msg.includes('net::ERR_CERT') || msg.includes('SSL')) {
      friendlyError = `SSL certificate error. The site has an invalid or expired security certificate.`;
    } else if (msg.includes('403') || msg.includes('Forbidden')) {
      friendlyError = `The site returned 403 Forbidden. It is actively blocking automated access.`;
    } else if (msg.includes('429')) {
      friendlyError = `The site returned 429 Too Many Requests. Rate limiting is active — try again later.`;
    } else {
      friendlyError = `Analysis failed. Large platforms like Amazon, Flipkart, or Google actively block crawlers — this is expected. Try a smaller or open website.`;
    }

    res.status(500).json({ error: friendlyError });
  }
});

/**
 * 4.5 POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  const { message, scanResult, screenshotBase64 } = req.body;
  if (!message || !scanResult) return res.status(400).json({ error: 'message and scanResult are required' });

  const systemPrompt = `You are an expert UX auditor and cognitive load specialist embedded inside the Cognitive Waste Detection Engine. You help both developers and non-technical users (bloggers, small business owners) reduce cognitive waste on their websites.

The user has just scanned a website. Here is the full scan data:
- URL: ${scanResult.url}
- Goal: ${scanResult.goal}
- Cognitive Waste Score: ${scanResult.cognitiveScore}/100 (higher = more waste = worse)
- Grade: ${scanResult.gradeLabel}
- Navigation Waste: ${scanResult.factors?.navigationWaste}/20
- Visual Waste: ${scanResult.factors?.visualWaste}/20
- Content Waste: ${scanResult.factors?.contentWaste}/20
- Interaction Waste: ${scanResult.factors?.interactionWaste}/20
- Goal Waste: ${scanResult.factors?.goalWaste}/20
- Detected Issues: ${JSON.stringify(scanResult.issues)}
- Metrics: ${JSON.stringify(scanResult.metrics)}

SCORING FORMULA (use this for exact score projections):
- Each category is scored 0-20. Total = sum of all 5 categories = max 100.
- Navigation Waste: 0-20 based on menu item count and nav depth
- Visual Waste: 0-20 based on link density, button count, scroll ratio
- Content Waste: 0-20 based on readability grade, missing H1, alt text, meta description
- Interaction Waste: 0-20 based on missing search, mobile responsiveness, CTA presence, small touch targets, contrast
- Goal Waste: 0-20 based on whether goal keywords appear in navigation
- CRITICAL: Lower score = LESS waste = BETTER. When a fix is applied, the factor score DECREASES not increases. For example if Interaction Waste is currently 13/20 and adding a search bar removes the "No Search Bar" penalty of 8 points, Interaction Waste becomes 5/20. The total CWS score DECREASES by 8. Never project a higher score as a positive outcome. Always verify: projected score must be LOWER than current score of ${scanResult.cognitiveScore}.

AUDIENCE RULES:
- Always give TWO implementation paths for every fix:
  1. 💻 For Developers: exact code snippet or technical instruction (HTML/CSS/React/WordPress PHP)
  2. 🖱️ For Non-Technical Users: step-by-step no-code instruction (WordPress dashboard, Wix editor, Blogger settings)
- Detect platform from URL if possible (e.g. wordpress.com, wix.com, blogspot.com) and prioritize that platform's instructions
- If platform is unknown, give generic HTML + WordPress instructions

RESPONSE RULES:
1. Always be specific to THEIR scan data — never give generic advice
2. When suggesting a fix, calculate exactly how many points it saves using the scoring formula above
3. Prioritize fixes by impact — highest score reduction first
4. For each fix, state: what to fix → where exactly on the page → how to implement it (both paths) → points saved
5. If the user asks a visual question, confirm that the visual annotation panel has been activated showing their site screenshot with colored overlay boxes marking exactly where changes should be made. Say "I've highlighted the areas on your site screenshot below" and then give the placement details.
6. FORMAT RULES — strictly follow these:
   - Never use nested bullet points or sub-lists
   - Never use more than 2 levels of indentation
   - Use bold headers like **Fix 1:** instead of markdown headers
   - Keep each point to 1-2 lines maximum
   - Separate sections with a single blank line only
   - Code blocks are allowed but keep them short (max 8 lines)
   - No bullet points inside bullet points ever
7. End every response with the exact projected new score: "Fixing this brings your score from ${scanResult.cognitiveScore} to approximately X/100 (Grade: Y)"
8. Never suggest fixes that aren't supported by the actual scan data

RESPONSE FORMAT — follow this exactly for every fix:

**Fix N: [Fix Name]** — saves X pts ([Category]: current→new)

Where: [1 sentence describing exact page location]

💻 For Developers:
[1-2 sentence explanation + code block if needed, max 10 lines of code]

🖱️ For Non-Technical Users:
[3-5 clear steps, no sub-bullets, each step on its own line starting with a number]

---

RULES:
- Always include a code block for developers
- Always include numbered steps for non-technical users  
- Never use bullet points inside bullet points
- One blank line between sections, no more
- Always end the full response with: "Fixing this brings your score from ${scanResult.cognitiveScore} to approximately X/100 (Grade: Y)."
- Minimum 3 sentences of explanation per fix so users actually understand why`;

  try {
    const messages = [{ role: 'user', content: message }];


    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Cognitive Waste Detection Engine'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Check if message contains "visual" keyword
    const isVisualRequest = message.toLowerCase().includes('visual');

    let annotations = [];
    let isOutOfContext = false;

    if (isVisualRequest) {
      const hasRealTargets = scanResult.annotationTargets && scanResult.annotationTargets.length > 0;

      // Context check — is this a valid cognitive waste visual request?
      const contextCheckPrompt = `The user asked: "${message}"
Context: UX cognitive waste tool for ${scanResult.url}. Issues: ${JSON.stringify(scanResult.issues.map(i => i.title))}.
Is this visual request related to improving the website's cognitive waste, UX, navigation, layout, content, or interaction?
Answer only YES or NO. Nothing else.`;

      try {
        const contextResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Cognitive Waste Detection Engine'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [{ role: 'user', content: contextCheckPrompt }],
            max_tokens: 10
          })
        });

        const contextData = await contextResponse.json();
        const decision = (contextData.choices?.[0]?.message?.content || 'NO').trim().toUpperCase().slice(0, 3);

        if (decision === 'YES') {
          if (hasRealTargets) {
            // Use real DOM coordinates from crawler directly — no AI guessing zones
            annotations = scanResult.annotationTargets.map(t => ({
              label: t.label,
              description: t.description,
              category: t.category,
              coords: t.coords
            }));
          } else {
            // Fallback: AI generates zones (old behaviour) only if crawler had no targets
            const zonePrompt = `Return a JSON array of max 4 annotations for: ${scanResult.url}
Issues: ${JSON.stringify(scanResult.issues.map(i => i.title))}
Each item: {"zone":"one of [top-left-header,top-center-header,top-right-header,main-nav,hero-section,main-content,bottom-footer,left-sidebar,right-sidebar]","label":"max 5 words","category":"one of [navigation,interaction,goal,visual,content]","description":"one sentence"}
Return ONLY the JSON array. No markdown. No explanation.`;

            const zoneResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Cognitive Waste Detection Engine'
              },
              body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [{ role: 'user', content: zonePrompt }],
                max_tokens: 400
              })
            });

            const zoneData = await zoneResponse.json();
            const raw = (zoneData.choices?.[0]?.message?.content || '[]').trim().replace(/```json|```/g, '').trim();
            try { annotations = JSON.parse(raw); } catch(e) { annotations = []; }
          }
        } else {
          isOutOfContext = true;
        }
      } catch(e) {
        console.warn('Visual audit failed:', e.message);
      }
    }

    res.json({ reply, annotations, isOutOfContext });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

/**
 * 5. POST /api/compare
 */
app.post('/api/compare', async (req, res) => {
  const { url1, url2, goal } = req.body;
  if (!url1 || !url2) return res.status(400).json({ error: 'Two URLs are required' });

  console.log(`[Compare] Starting: ${url1} vs ${url2}`);

  try {
    const analyzer1 = new WebsiteAnalyzer();
    const result1 = await analyzer1.analyze(url1, goal);

    const analyzer2 = new WebsiteAnalyzer();
    const result2 = await analyzer2.analyze(url2, goal);

    const score1 = result1.cognitiveScore;
    const score2 = result2.cognitiveScore;
    const winner = score1 <= score2 ? 'url1' : 'url2'; // Lower is better
    const scoreDifference = Math.abs(score1 - score2);

    res.json({ result1, result2, winner, scoreDifference });
  } catch (error) {
    console.error('❌ Comparison error:', error);
    res.status(500).json({ error: 'Comparison failed or blocked by one of the websites' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Backend running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket initialized`);
});
