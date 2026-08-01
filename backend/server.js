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

app.get("/", (req, res) => {
    res.json({
        status: "Backend running",
        service: "Clarix API"
    });
});

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

  const systemPrompt = `You are a UX auditor embedded in the Cognitive Waste Detection Engine. Help developers and non-technical users reduce cognitive waste.

Scan data:
- URL: ${scanResult.url}
- Goal: ${scanResult.goal}
- Score: ${scanResult.cognitiveScore}/100 (Grade: ${scanResult.gradeLabel})
- Factors: Nav=${scanResult.factors?.navigationWaste || 0}, Visual=${scanResult.factors?.visualWaste || 0}, Content=${scanResult.factors?.contentWaste || 0}, Interaction=${scanResult.factors?.interactionWaste || 0}, Goal=${scanResult.factors?.goalWaste || 0}
- Issues: ${JSON.stringify(scanResult.issues)}

Rules:
1. Provide concise fixes specific to scan data.
2. Provide two implementation paths for each fix: 💻 For Developers (code/tech instructions) and 🖱️ For Non-Technical Users (dashboard/no-code steps).
3. End response with: "Fixing this brings your score from ${scanResult.cognitiveScore} to approximately X/100 (Grade: Y)."`;

  try {
    const messages = [{ role: 'user', content: message }];


    const modelName = process.env.OPENROUTER_MODEL || 'openrouter/free';
    const apiKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '';
    const apiKeyDetected = !!apiKey;

    console.log('[Chat Request] Received payload:', {
      messageLength: message?.length,
      url: scanResult?.url,
      hasScreenshot: !!screenshotBase64
    });
    console.log('[Chat OpenRouter] API Key Detected:', apiKeyDetected);
    console.log('[Chat OpenRouter] Model used:', modelName);

    if (!apiKeyDetected) {
      console.error('[Chat Error] OPENROUTER_API_KEY environment variable is missing.');
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured on the backend server.' });
    }

    const openRouterPayload = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 1000
    };

    console.log('[Chat OpenRouter] Sending request to OpenRouter API...');

    let response;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://clarix-2cd7.onrender.com',
          'X-Title': 'Cognitive Waste Detection Engine'
        },
        body: JSON.stringify(openRouterPayload)
      });
    } catch (fetchErr) {
      console.error('[Chat OpenRouter] Network/Fetch exception:', fetchErr);
      return res.status(500).json({ error: 'Failed to connect to OpenRouter API service.' });
    }

    console.log('[Chat OpenRouter] Response HTTP status:', response.status);

    const data = await response.json();
    console.log('[Chat OpenRouter] Response Body:', JSON.stringify(data));

    if (!response.ok) {
      console.error(`[Chat OpenRouter Error] OpenRouter returned HTTP ${response.status}:`, data);
      const errMsg = data.error?.message || `OpenRouter API error (HTTP ${response.status})`;
      return res.status(response.status).json({ error: errMsg, details: data });
    }

    let reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      console.warn('[Chat OpenRouter] Could not extract reply content from choices array.');
      return res.status(500).json({ error: 'Malformed AI response structure returned from OpenRouter.' });
    }

    console.log('[Chat OpenRouter] Successfully extracted AI response (length:', reply.length, 'chars)');

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
            'HTTP-Referer': process.env.FRONTEND_URL || 'https://clarix-2cd7.onrender.com',
            'X-Title': 'Cognitive Waste Detection Engine'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: contextCheckPrompt }],
            max_tokens: 10
          })
        });

        console.log('[Chat OpenRouter Visual Check] Status:', contextResponse.status);
        const contextData = await contextResponse.json();
        const decision = (contextData.choices?.[0]?.message?.content || 'NO').trim().toUpperCase().slice(0, 3);
        console.log('[Chat Visual Gate DEBUG] Raw model content:', JSON.stringify(contextData.choices?.[0]?.message?.content));
        console.log('[Chat Visual Gate DEBUG] Parsed decision:', decision);
        console.log('[Chat Visual Gate DEBUG] modelName used for gate call:', modelName);

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
                'HTTP-Referer': process.env.FRONTEND_URL || 'https://clarix-2cd7.onrender.com',
                'X-Title': 'Cognitive Waste Detection Engine'
              },
              body: JSON.stringify({
                model: modelName,
                messages: [{ role: 'user', content: zonePrompt }],
                max_tokens: 400
              })
            });

            console.log('[Chat OpenRouter Zone Prompt] Status:', zoneResponse.status);
            const zoneData = await zoneResponse.json();
            const raw = (zoneData.choices?.[0]?.message?.content || '[]').trim().replace(/```json|```/g, '').trim();
            try { annotations = JSON.parse(raw); } catch(e) { annotations = []; }
          }
        } else {
          isOutOfContext = true;
        }
      } catch(e) {
        console.error('[Chat Visual Gate DEBUG] Exception caught:', e.message);
        console.warn('[Chat OpenRouter Visual Audit Error]:', e);
      }
    }

    res.json({ reply, annotations, isOutOfContext });
  } catch (error) {
    console.error('[Chat Exception] Stack trace:', error.stack || error);
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

/**
 * 6. POST /api/feedback
 */
app.post('/api/feedback', (req, res) => {
  const feedbackData = req.body;
  console.log('[Feedback] Received user feedback:', feedbackData);
  res.json({ success: true, message: 'Feedback received' });
});

// Start server
server.listen(PORT, () => {
  console.log(`[Server] Backend running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket initialized`);
});

