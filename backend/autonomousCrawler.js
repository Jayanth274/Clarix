/**
 * Autonomous Website Analyzer - V2 (SPA-Aware)
 * Properly handles JavaScript-heavy sites (React, Angular, etc.)
 * Waits for full page render before analyzing
 */

import { chromium } from 'playwright';

export class WebsiteAnalyzer {
    constructor() {
        this.results = {
            url: '',
            pages: [],
            navigation: { links: [], depth: 0, menuItems: 0 },
            performance: { loadTimes: [], avgLoadTime: 0 },
            forms: [],
            hasSearch: false,
            isMobileResponsive: false,
            siteMap: [],
        };
    }

    /**
     * Main entry - analyze a website autonomously
     */
    async analyze(url, goal = null) {
        const fullUrl = url.includes('://') ? url : `https://${url}`;
        this.results.url = fullUrl;
        this.results.goal = goal;
        let browser;
        try {
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--window-size=1920,1080',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--allow-running-insecure-content'
                ]
            });

            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
                isMobile: false,
                hasTouch: false,
                locale: 'en-US',
                timezoneId: 'Asia/Kolkata',
                extraHTTPHeaders: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-IN,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0'
                }
            });

            await context.addInitScript(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en'] });
                window.chrome = { runtime: {} };
            });

            const page = await context.newPage();
            // Viewport is set in context

            // Step 1: Load and analyze homepage (with retry)
            console.log(`[Step 1] Loading ${fullUrl}...`);
            await this.analyzeHomepage(page, fullUrl);

            // Step 2: Analyze navigation structure
            console.log(`[Step 2] Mapping navigation structure...`);
            await this.analyzeNavigation(page, fullUrl);

            // Step 3: Crawl important inner pages
            console.log(`[Step 3] Crawling inner pages...`);
            await this.crawlInnerPages(page, browser, fullUrl);

            // Step 4: Check mobile responsiveness
            console.log(`[Step 4] Checking mobile responsiveness...`);
            await this.checkMobileResponsive(browser, fullUrl);

            // Step 5: Calculate cognitive score
            console.log(`[Step 5] Calculating cognitive score...`);
            const analysis = this.calculateCognitiveScore(goal);

            console.log(`[Done] Score: ${analysis.cognitiveScore}/100 (${analysis.grade})`);

            await browser.close();
            return analysis;

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            if (browser) await browser.close();
            throw error;
        }
    }

    /**
     * Retry wrapper for page navigation - handles DNS/network failures
     */
    async gotoWithRetry(page, url, options = {}, maxRetries = 3) {
        const defaults = { waitUntil: 'load', timeout: 60000 };
        const opts = { ...defaults, ...options };

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await page.goto(url, opts);
                // Verify page actually loaded
                const title = await page.title();
                const bodyLen = await page.evaluate(() => document.body?.innerHTML?.length || 0);

                if (bodyLen > 100 || attempt === maxRetries) {
                    console.log(`   ✓ Page loaded (attempt ${attempt}): title="${title}", body=${bodyLen} chars`);
                    return response;
                }
                console.log(`   ⚠️ Page seems empty (attempt ${attempt}), retrying...`);
                await page.waitForTimeout(2000);
            } catch (e) {
                console.warn(`   ⚠️ Load attempt ${attempt}/${maxRetries} failed: ${e.message}`);
                if (attempt === maxRetries) {
                    console.warn(`   ❌ All ${maxRetries} attempts failed for ${url}`);
                    throw e;
                }
                await page.waitForTimeout(3000); // Wait before retry
            }
        }
    }

    /**
     * Wait for page to fully render (handles SPAs)
     */
    async waitForFullRender(page, doScroll = true) {
        try {
            // Wait for network to be mostly idle
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
        } catch (e) {
            // Ignore timeout
        }

        // Additional wait for JS frameworks to render DOM
        await page.waitForTimeout(3000);

        // Wait until DOM is stable
        try {
            await page.waitForFunction(() => {
                return document.readyState === 'complete';
            }, { timeout: 5000 });
        } catch (e) {
            // Continue anyway
        }

        // Scroll down to trigger lazy-loaded content
        if (doScroll) {
            try {
                await page.evaluate(async () => {
                    const distance = 400;
                    const delay = 200;
                    const maxScrolls = 8;
                    for (let i = 0; i < maxScrolls; i++) {
                        window.scrollBy(0, distance);
                        await new Promise(r => setTimeout(r, delay));
                    }
                    // Scroll back to top
                    window.scrollTo(0, 0);
                });
                await page.waitForTimeout(1500);
            } catch (e) {
                // Ignore scroll errors
            }
        }
    }

    /**
     * Try to dismiss cookie banners and popups
     */
    async dismissPopups(page) {
        const popupSelectors = [
            // Cookie consent buttons
            'button[id*="accept" i]',
            'button[class*="accept" i]',
            'button[id*="cookie" i]',
            'button[class*="cookie" i]',
            'a[id*="accept" i]',
            '[data-testid*="accept" i]',
            '[aria-label*="accept" i]',
            '[aria-label*="Accept" i]',
            // "Got it" / "OK" buttons
            'button:has-text("Accept")',
            'button:has-text("Got it")',
            'button:has-text("OK")',
            'button:has-text("I agree")',
            'button:has-text("Agree")',
            // Close modal buttons
            'button[class*="close" i]',
            '[aria-label="Close"]',
            '.modal-close',
        ];

        for (const selector of popupSelectors) {
            try {
                const btn = page.locator(selector).first();
                if (await btn.isVisible({ timeout: 500 })) {
                    await btn.click({ timeout: 1000 });
                    await page.waitForTimeout(500);
                    break; // Only dismiss one popup
                }
            } catch (e) {
                // Ignore
            }
        }
    }

    /**
     * Step 1: Analyze homepage with full render wait
     */
    async analyzeHomepage(page, url) {
        const startTime = Date.now();

        try {
            await this.gotoWithRetry(page, url);
        } catch (e) {
            console.warn(`⚠️ Initial load failed after retries, continuing with what we have...`);
        }

        // Wait for SPA content to render
        await this.waitForFullRender(page);

        const loadTime = Date.now() - startTime;
        this.results.performance.loadTimes.push({ url, time: loadTime });

        // Dismiss cookie banners etc.
        await this.dismissPopups(page);
        await page.waitForTimeout(1000);

        try {
          const screenshotBuffer = await page.screenshot({ 
            fullPage: false,
            type: 'jpeg',
            quality: 60
          });
          this.results.screenshotBase64 = screenshotBuffer.toString('base64');
          console.log(`[Screenshot] Captured: ${Math.round(this.results.screenshotBase64.length / 1024)}KB`);
        } catch(e) {
          console.warn('📸 Screenshot failed:', e.message);
          this.results.screenshotBase64 = null;
        }


        // Extract comprehensive page data
        const pageData = await page.evaluate(() => {
            // Helper: check if element is visible
            const isVisible = (el) => {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return rect.width > 0 && rect.height > 0 &&
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0';
            };

            // ---- ALL LINKS (DOM-level, both visible and hidden) ----
            const allAnchors = Array.from(document.querySelectorAll('a[href]'));
            const allLinks = allAnchors.map(a => ({
                text: (a.textContent || '').trim().substring(0, 120),
                href: a.href,
                ariaLabel: a.getAttribute('aria-label') || '',
                isVisible: isVisible(a)
            }));
            const visibleLinks = allLinks.filter(l => l.isVisible);

            // ---- NAVIGATION / MENU ----
            // Check both visible and all DOM elements for nav patterns
            const navSelectors = [
                'nav', '[role="navigation"]',
                'header', '.navbar', '.nav-bar', '.navigation',
                '.header', '#header', '#navbar',
                '[class*="nav" i]', '[class*="menu" i]',
                '[class*="sidebar" i]', '[class*="toolbar" i]'
            ];

            let menuItems = new Set();
            let menuLabels = [];

            navSelectors.forEach(sel => {
                try {
                    document.querySelectorAll(sel).forEach(nav => {
                        const items = nav.querySelectorAll('a, button, [role="menuitem"], [role="tab"]');
                        items.forEach(item => {
                            const text = (item.textContent || item.getAttribute('aria-label') || '').trim();
                            // Include ALL menu items (visible or not) in SPA apps
                            if (text && text.length > 0 && text.length < 60 && !/^\d+$/.test(text)) {
                                menuItems.add(text);
                                if (isVisible(item)) {
                                    menuLabels.push(text);
                                }
                            }
                        });
                    });
                } catch (e) { }
            });

            // ---- SEARCH (check ALL elements, not just visible) ----
            const searchSelectors = [
                'input[type="search"]',
                'input[placeholder*="search" i]',
                'input[name*="search" i]',
                'input[name*="query" i]',
                'input[name*="q"]',
                'input[aria-label*="search" i]',
                '[role="search"]',
                '[role="search"] input',
                '[class*="search" i] input',
                '[id*="search" i]',
                'form[action*="search" i]',
                'form[action*="query" i]',
                'button[aria-label*="search" i]',
                'a[aria-label*="search" i]',
                '[class*="search-icon" i]',
                '[class*="searchIcon" i]',
                'svg[class*="search" i]',
            ];

            let hasSearch = false;
            for (const sel of searchSelectors) {
                try {
                    const els = document.querySelectorAll(sel);
                    if (els.length > 0) {
                        hasSearch = true;
                        break;
                    }
                } catch (e) { }
            }

            // Also check the HTML source and all class/id names for "search"
            if (!hasSearch) {
                const html = document.documentElement.outerHTML.toLowerCase();
                if (html.includes('search') && (html.includes('input') || html.includes('searchbar') || html.includes('search-input') || html.includes('searchinput'))) {
                    hasSearch = true;
                }
            }

            // ---- BUTTONS (include all DOM buttons for CTA detection) ----
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], a[class*="btn" i], a[class*="button" i]'));
            const visibleButtons = allButtons.filter(b => isVisible(b));

            // ---- FORMS ----
            const forms = document.querySelectorAll('form');
            const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
            const visibleInputs = Array.from(inputs).filter(i => isVisible(i));

            // ---- HEADINGS (check all, including inside shadow dom or dynamic) ----
            const h1s = document.querySelectorAll('h1');
            const h2s = document.querySelectorAll('h2');
            const h3s = document.querySelectorAll('h3');
            const headings = {
                h1: Array.from(h1s).map(h => h.textContent.trim().substring(0, 100)).filter(t => t.length > 0),
                h2: Array.from(h2s).map(h => h.textContent.trim().substring(0, 100)).filter(t => t.length > 0),
                h3: Array.from(h3s).map(h => h.textContent.trim().substring(0, 100)).filter(t => t.length > 0),
            };

            // ---- IMAGES ----
            const images = document.querySelectorAll('img');
            const imagesWithoutAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '').length;

            // ---- CTA DETECTION (check ALL buttons, not just visible) ----
            const ctaKeywords = ['sign up', 'get started', 'try', 'buy', 'subscribe', 'start', 'register', 'join', 'download', 'free', 'log in', 'login', 'create account'];
            const ctaElements = allButtons.filter(btn => {
                const text = (btn.textContent || '').toLowerCase().trim();
                return ctaKeywords.some(kw => text.includes(kw));
            });

            // Also detect CTA-like anchor tags
            const ctaAnchors = allAnchors.filter(a => {
                const text = (a.textContent || '').toLowerCase().trim();
                return ctaKeywords.some(kw => text.includes(kw));
            });

            // ---- FONT SIZES ----
            const bodyStyle = window.getComputedStyle(document.body);
            const baseFontSize = parseFloat(bodyStyle.fontSize);

            // ---- META TAGS ----
            const metaDescription = document.querySelector('meta[name="description"]');
            const metaViewport = document.querySelector('meta[name="viewport"]');
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');

            // ---- PAGE DIMENSIONS ----
            const scrollHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;

            // ---- TOTAL DOM ELEMENTS (complexity metric) ----
            const totalDomElements = document.querySelectorAll('*').length;

            // ---- INTERACTIVE ELEMENT SIZING (Fitt's Law) ----
            const smallTargets = visibleButtons.filter(b => {
                const rect = b.getBoundingClientRect();
                return rect.width < 44 || rect.height < 44;
            }).length;

            // ---- READABILITY DATA ----
            // Extract meaningful text blocks
            const textNodes = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                if (node.parentElement.tagName !== 'SCRIPT' &&
                    node.parentElement.tagName !== 'STYLE' &&
                    node.textContent.trim().length > 20) {
                    textNodes.push(node.textContent.trim());
                }
            }
            const fullText = textNodes.join(' ');

            // ---- COLOR CONTRAST SAMPLING ----
            const getColor = (el, prop) => window.getComputedStyle(el)[prop];
            const parseRgb = (color) => {
                const match = color.match(/\d+/g);
                return match ? match.map(Number) : [0, 0, 0];
            };
            const getLuminance = (r, g, b) => {
                const a = [r, g, b].map(v => {
                    v /= 255;
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                });
                return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
            };
            const getContrastRatio = (fg, bg) => {
                const [r1, g1, b1] = parseRgb(fg);
                const [r2, g2, b2] = parseRgb(bg);
                const l1 = getLuminance(r1, g1, b1);
                const l2 = getLuminance(r2, g2, b2);
                return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
            };

            const bodyColor = getColor(document.body, 'color');
            const bodyBg = getColor(document.body, 'backgroundColor');
            const contrastRatio = getContrastRatio(bodyColor, bodyBg.includes('rgba(0, 0, 0, 0)') ? 'rgb(255, 255, 255)' : bodyBg);

            return {
                title: document.title || 'Untitled',
                url: window.location.href,
                finalUrl: window.location.href,

                // Links - report BOTH visible and total DOM links
                totalLinks: allLinks.length,
                visibleLinks: visibleLinks.length,
                links: allLinks.slice(0, 150),

                // Navigation
                menuItemCount: menuItems.size,
                menuLabels: menuLabels.slice(0, 40),
                allMenuLabels: [...menuItems].slice(0, 60),

                // Search
                hasSearch,

                // Interactive elements
                buttonCount: allButtons.length,
                visibleButtonCount: visibleButtons.length,
                smallTargetCount: smallTargets, // NEW
                ctaCount: ctaElements.length + ctaAnchors.length,
                ctaTexts: [...ctaElements, ...ctaAnchors].map(c => (c.textContent || '').trim().substring(0, 80)).slice(0, 10),

                // Forms
                formCount: forms.length,
                visibleInputCount: visibleInputs.length,
                totalInputCount: inputs.length,

                // Content
                headings,
                h1Count: headings.h1.length,
                imageCount: images.length,
                imagesWithoutAlt,
                baseFontSize,
                bodyTextLength: (document.body.innerText || '').length,
                totalDomElements,

                // Readability & Visuals
                fullTextSample: fullText.substring(0, 5000), // Limit for performance
                contrastRatio, // NEW

                // Page dimensions
                scrollHeight,
                viewportHeight,
                scrollRatio: Math.round(scrollHeight / viewportHeight * 10) / 10,

                // SEO signals
                hasMetaDescription: !!metaDescription,
                metaDescriptionLength: metaDescription ? metaDescription.content.length : 0,
                hasViewportMeta: !!metaViewport,
                hasOgTitle: !!ogTitle,
                hasFavicon: !!favicon,
            };
        });

        // Log what was detected for debuging
        console.log(`   📊 Page title: ${pageData.title}`);
        console.log(`   📊 Final URL: ${pageData.finalUrl}`);
        console.log(`   📊 Total DOM links: ${pageData.totalLinks}, Visible: ${pageData.visibleLinks}`);
        console.log(`   📊 Menu items: ${pageData.menuItemCount}`);
        console.log(`   📊 Search found: ${pageData.hasSearch}`);
        console.log(`   📊 Buttons: ${pageData.buttonCount}, CTAs: ${pageData.ctaCount}`);
        console.log(`   📊 Small Targets (<44px): ${pageData.smallTargetCount}`);
        console.log(`   📊 Contrast Ratio: ${pageData.contrastRatio.toFixed(2)}`);
        console.log(`   📊 DOM elements: ${pageData.totalDomElements}`);
        console.log(`   📊 Headings H1: ${pageData.headings.h1.length}, H2: ${pageData.headings.h2.length}`);
        console.log(`   📊 Has viewport meta: ${pageData.hasViewportMeta}`);

        this.results.pages.push({
            url,
            type: 'homepage',
            loadTime,
            ...pageData
        });

        this.results.navigation.menuItems = pageData.menuItemCount;
        this.results.navigation.menuLabels = pageData.menuLabels;
        this.results.hasSearch = pageData.hasSearch;

        // Collect real DOM coordinates for visual audit annotations
        try {
          const annotationTargets = await page.evaluate(() => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const getCoords = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) return null;
              return {
                xPct: (r.x / vw) * 100,
                yPct: (r.y / vh) * 100,
                wPct: (r.width / vw) * 100,
                hPct: (r.height / vh) * 100,
              };
            };

            const ctaKeywords = ['sign up','get started','try','buy','subscribe','start','free','register','join','download'];
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"], a'));
            const ctaEl = Array.from(document.querySelectorAll('button, input[type="submit"]'))
              .find(b => {
                const r = b.getBoundingClientRect();
                const style = window.getComputedStyle(b);
                const isVisible = r.width > 80 && r.height > 35 && style.display !== 'none' && style.visibility !== 'hidden';
                const isNotNav = !b.closest('nav, [role="navigation"], header, aside, [class*="sidebar"]');
                return isVisible && isNotNav && ctaKeywords.some(kw => (b.textContent || '').toLowerCase().includes(kw));
              }) || null;
            const searchEl = document.querySelector('input[type="search"], input[placeholder*="search" i], [role="search"]');
            const navEl = document.querySelector('nav, [role="navigation"], header');
            const h1El = document.querySelector('h1');
            const imgNoAlt = Array.from(document.querySelectorAll('img')).find(img => !img.alt || img.alt.trim() === '');
            const smallBtn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => {
              const r = b.getBoundingClientRect();
              return (r.width > 0 && r.height > 0) && (r.width < 44 || r.height < 44);
            });
            const smallTargets = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
                const r = b.getBoundingClientRect();
                return (r.width > 0 && r.height > 0) && (r.width < 44 || r.height < 44);
            });
            const formEl = Array.from(document.querySelectorAll('form')).find(f => {
              const inputs = f.querySelectorAll('input:not([type="hidden"]):not([type="search"]), textarea, select');
              const r = f.getBoundingClientRect();
              const isNotSearchBar = !f.closest('[class*="search"], [role="search"]');
              return inputs.length >= 2 && r.height > 60 && r.width > 200 && isNotSearchBar;
            }) || null;

            const targets = [
              { id: 'nav',       label: 'Navigation Bar',        description: 'Top navigation structure detected.',           category: 'navigation',  el: navEl },
              { id: 'cta',       label: 'Primary CTA',           description: 'Main call-to-action button detected.',         category: 'interaction', el: ctaEl },
              { id: 'search',    label: 'Search',                description: 'Search input detected.',                       category: 'interaction', el: searchEl },
              { id: 'h1',        label: 'Primary Heading',       description: 'H1 heading detected.',                         category: 'content',     el: h1El },
              { id: 'imgnoalt',  label: 'Image Missing Alt',     description: 'Image found without alt text.',                category: 'content',     el: imgNoAlt },
              { id: 'smallbtn',  label: 'Small Touch Target',    description: 'Button under 44px — hard to tap on mobile.',   category: 'interaction', el: smallBtn },
              { id: 'form',      label: 'Form',                  description: 'Form element detected.',                       category: 'interaction', el: formEl },
            ];

            return targets
              .map(t => ({ id: t.id, label: t.label, description: t.description, category: t.category, coords: getCoords(t.el) }))
              .filter(t => t.coords !== null);
          });

          this.results.annotationTargets = annotationTargets;
          console.log(`[Annotations] Targets collected: ${annotationTargets.length}`);
        } catch(e) {
          console.warn('📍 Annotation targets failed:', e.message);
          this.results.annotationTargets = [];
        }
    }

    /**
     * Step 2: Analyze navigation depth and structure
     */
    async analyzeNavigation(page, baseUrl) {
        const pageData = this.results.pages[0];
        if (!pageData) return;

        const baseHost = new URL(baseUrl).hostname;

        // Filter internal links
        const internalLinks = pageData.links.filter(link => {
            try {
                const linkHost = new URL(link.href).hostname;
                return linkHost === baseHost || linkHost.endsWith('.' + baseHost);
            } catch {
                return false;
            }
        });

        // Deduplicate by URL
        const uniqueLinks = [];
        const seen = new Set();
        for (const link of internalLinks) {
            const normalizedUrl = link.href.split('#')[0].split('?')[0]; // Remove hash and query
            if (!seen.has(normalizedUrl)) {
                seen.add(normalizedUrl);
                uniqueLinks.push(link);
            }
        }

        this.results.navigation.links = uniqueLinks;
        this.results.siteMap = uniqueLinks.map(l => ({
            text: l.text,
            url: l.href,
            depth: this.calculateUrlDepth(l.href, baseUrl)
        }));

        // Calculate navigation depth
        const depths = this.results.siteMap.map(s => s.depth);
        this.results.navigation.depth = depths.length > 0 ? Math.max(...depths) : 0;
    }

    /**
     * Step 3: Crawl inner pages
     */
    async crawlInnerPages(page, browser, baseUrl) {
        // Pick diverse pages to crawl (different sections)
        const pages = this.results.siteMap
            .filter(s => s.depth >= 1 && s.depth <= 2 && s.text.length > 1)
            .slice(0, 4); // Max 4 inner pages

        for (const pageInfo of pages) {
            try {
                const innerPage = await browser.newPage();
                const startTime = Date.now();

                await innerPage.goto(pageInfo.url, {
                    waitUntil: 'load',
                    timeout: 30000
                });

                await this.waitForFullRender(innerPage);
                const loadTime = Date.now() - startTime;
                this.results.performance.loadTimes.push({ url: pageInfo.url, time: loadTime });

                // Quick analysis
                const innerData = await innerPage.evaluate(() => {
                    const isVisible = (el) => {
                        if (!el) return false;
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        return rect.width > 0 && rect.height > 0 &&
                            style.display !== 'none' && style.visibility !== 'hidden';
                    };

                    const links = Array.from(document.querySelectorAll('a[href]')).filter(a => isVisible(a));
                    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select')).filter(i => isVisible(i));
                    const headings = document.querySelectorAll('h1, h2, h3');

                    return {
                        linkCount: links.length,
                        formFieldCount: inputs.length,
                        headingCount: headings.length,
                        title: document.title,
                        scrollHeight: document.documentElement.scrollHeight,
                    };
                });

                this.results.pages.push({
                    url: pageInfo.url,
                    type: 'inner',
                    loadTime,
                    label: pageInfo.text,
                    ...innerData
                });

                if (innerData.formFieldCount > 3) {
                    this.results.forms.push({
                        url: pageInfo.url,
                        fieldCount: innerData.formFieldCount,
                        label: pageInfo.text
                    });
                }

                await innerPage.close();
            } catch (e) {
                console.warn(`⚠️ Failed to analyze: ${pageInfo.url} (${e.message})`);
            }
        }

        // Calculate average load time
        const times = this.results.performance.loadTimes.map(t => t.time);
        this.results.performance.avgLoadTime = times.length > 0
            ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
            : 0;
    }

    /**
     * Step 4: Check mobile responsiveness
     */
    async checkMobileResponsive(browser, url) {
        try {
            const mobilePage = await browser.newPage();
            await mobilePage.setViewportSize({ width: 375, height: 812 });

            await mobilePage.goto(url, { waitUntil: 'load', timeout: 30000 });
            await this.waitForFullRender(mobilePage);

            const mobileData = await mobilePage.evaluate(() => {
                const hasHorizontalScroll = document.documentElement.scrollWidth > (window.innerWidth + 10);
                const metaViewport = document.querySelector('meta[name="viewport"]');

                // Check if content overflows
                const bodyWidth = document.body.scrollWidth;
                const viewportWidth = window.innerWidth;

                return {
                    hasHorizontalScroll,
                    hasViewportMeta: !!metaViewport,
                    contentWidth: bodyWidth,
                    viewportWidth,
                    overflowRatio: Math.round((bodyWidth / viewportWidth) * 100) / 100
                };
            });

            // A site is responsive if it has viewport meta AND content doesn't overflow much
            this.results.isMobileResponsive = mobileData.hasViewportMeta && mobileData.overflowRatio < 1.1;
            this.results.mobileData = mobileData;

            await mobilePage.close();
        } catch (e) {
            console.warn('⚠️ Mobile check failed:', e.message);
            this.results.isMobileResponsive = false;
        }
    }

    /**
     * Step 5: Calculate cognitive score (0-100)
     * New Philosophy: Higher Score = More Waste = Worse UX
     */
    calculateCognitiveScore(goal = null) {
        const homepage = this.results.pages[0] || {};
        
        // Detect partial crawl
        const partialCrawlReasons = [];
        if (!this.results.screenshotBase64) partialCrawlReasons.push('Screenshot could not be captured');
        if ((homepage.bodyTextLength || 0) < 500) partialCrawlReasons.push('Page content appears too thin — site may have blocked rendering');
        if ((homepage.totalDomElements || 0) < 50) partialCrawlReasons.push('Very few DOM elements detected — JavaScript may not have rendered');
        if ((homepage.totalLinks || 0) < 3) partialCrawlReasons.push('Almost no links detected — content may be behind authentication or blocked');
        const isPartialCrawl = partialCrawlReasons.length > 0;

        const navigation = this.results.navigation || { depth: 0, menuItems: 0, links: [], menuLabels: [] };
        const issues = [];
        const positives = [];

        // Detect site type for adjusted scoring
        const detectSiteType = () => {
          const navLabels = (navigation.allMenuLabels || []).map(l => l.toLowerCase());
          const allText = (homepage.fullTextSample || '').toLowerCase();
          const links = homepage.totalLinks || 0;
          const forms = this.results.forms?.length || 0;
          const buttonCount = homepage.buttonCount || 0;
          const domain = this.results.url || '';

          const hasPrice = /add to (cart|basket)|checkout|shopping cart|buy now|shop now/.test(allText) && (homepage.buttonCount || 0) > 5;
          const hasBlogSignals = /blog|post|article|read more|published|author|category|tag/.test(allText) || navLabels.some(l => /blog|posts|articles|journal/.test(l));
          const hasPortfolioSignals = navLabels.some(l => /portfolio|work|projects|gallery|about me/.test(l)) && buttonCount < 10 && links < 30;
          const isEdu = /\.edu|university|college|school|institute/.test(domain);
          const hasCorporateSignals = forms > 0 && navLabels.some(l => /contact|service|solution|about|career/.test(l));

          if (hasPrice) return 'ecommerce';
          if (hasPortfolioSignals) return 'portfolio';
          if (isEdu) return 'educational';
          if (hasBlogSignals && !hasCorporateSignals) return 'blog';
          if (hasCorporateSignals) return 'corporate';
          return 'unknown';
        };

        const siteType = detectSiteType();
        console.log(`[SiteType] Detected: ${siteType}`);

        // 1. Navigation Waste (0-20 points)
        let navigationWaste = 0;
        const menuItems = navigation.menuItems || 0;
        const navDepth = navigation.depth || 0;

        const navPenaltyMultiplier = siteType === 'educational' ? 0.5 : 1;

        if (menuItems > 20) {
          navigationWaste += Math.round(10 * navPenaltyMultiplier);
          issues.push({ category: 'navigation', title: 'Overwhelming Menu', detail: `Detected ${menuItems} menu items. Hick's Law suggests this causes significant decision paralysis.`, suggestion: 'Consolidate menu into 5-7 primary categories.' });
        } else if (menuItems > 12) {
          navigationWaste += Math.round(7 * navPenaltyMultiplier);
          issues.push({ category: 'navigation', title: 'Complex Navigation', detail: `Detected ${menuItems} menu items. Excessive options increase scanning time.`, suggestion: 'Group related items into dropdowns.' });
        } else if (menuItems >= 8) {
          navigationWaste += Math.round(3 * navPenaltyMultiplier);
          issues.push({ category: 'navigation', title: 'Dense Menu', detail: `Detected ${menuItems} menu items. Borderline for cognitive ease.`, suggestion: 'Simplify labels or reduce items.' });
        }

        if (navDepth > 5) {
          navigationWaste += Math.round(10 * navPenaltyMultiplier);
          issues.push({ category: 'navigation', title: 'Extreme Nav Depth', detail: `Navigation depth is ${navDepth} levels. Important content is too hard to reach.`, suggestion: 'Flatten the site structure to 3 levels max.' });
        } else if (navDepth >= 4) {
          navigationWaste += Math.round(5 * navPenaltyMultiplier);
          issues.push({ category: 'navigation', title: 'High Nav Depth', detail: `Navigation depth is ${navDepth} levels. Users may lose context.`, suggestion: 'Add shortcuts to deep content from the homepage.' });
        }
        navigationWaste = Math.min(20, navigationWaste);

        // 2. Visual Clarity Waste (0-20 points)
        let visualWaste = 0;
        const totalLinks = homepage.totalLinks || 0;
        const buttonCount = homepage.buttonCount || 0;
        const scrollRatio = homepage.scrollRatio || 1;

        if (totalLinks > 150) {
            visualWaste += 8;
            issues.push({ category: 'design', title: 'Visual Clutter (Links)', detail: `Detected ${totalLinks} links. High density of links creates visual noise.`, suggestion: 'Prioritize essential links and use progressive disclosure.' });
        } else if (totalLinks > 80) {
            visualWaste += 4;
            issues.push({ category: 'design', title: 'Dense Link Structure', detail: `Detected ${totalLinks} links. Approaching threshold for visual fatigue.`, suggestion: 'De-emphasize secondary navigation links.' });
        }

        if (buttonCount > 30) {
            visualWaste += 7;
            issues.push({ category: 'design', title: 'Button Overload', detail: `Detected ${buttonCount} clickable buttons. Too many calls-to-action dilute the primary goal.`, suggestion: 'Use text links for secondary actions.' });
        } else if (buttonCount >= 15) {
            visualWaste += 3;
            issues.push({ category: 'design', title: 'Frequent Buttons', detail: `Detected ${buttonCount} buttons. Ensure a clear visual hierarchy between primary and secondary buttons.`, suggestion: 'Differentiate CTA buttons clearly from others.' });
        }

        if (scrollRatio > 10) {
            visualWaste += 5;
            issues.push({ category: 'design', title: 'Extremely Long Page', detail: `Page is ${scrollRatio}x viewport height. Important content may be buried.`, suggestion: 'Use anchor links or shorten the page.' });
        } else if (scrollRatio >= 5) {
            visualWaste += 2;
            issues.push({ category: 'design', title: 'Long Page Scroll', detail: `Page length is ${scrollRatio}x viewport. Users may lose interest while scrolling.`, suggestion: 'Ensure consistent value throughout the scroll.' });
        }
        visualWaste = Math.min(20, visualWaste);

        // 3. Content Readability Waste (0-20 points)
        let contentWaste = 0;
        const readability = this.calculateReadability(homepage.fullTextSample || '');
        const imageCount = homepage.imageCount || 0;
        const imagesWithoutAlt = homepage.imagesWithoutAlt || 0;
        const h1Count = homepage.h1Count || 0;

        if (readability.gradeLevel > 12) {
            contentWaste += 8;
            issues.push({ category: 'content', title: 'Difficult Readability', detail: `Reading level is Grade ${readability.gradeLevel} (College+). Hard for general audiences.`, suggestion: 'Use shorter sentences and simpler vocabulary.' });
        } else if (readability.gradeLevel >= 9) {
            contentWaste += 4;
            issues.push({ category: 'content', title: 'Complex Content', detail: `Reading level is Grade ${readability.gradeLevel}. Moderate complexity.`, suggestion: 'Break up long paragraphs.' });
        }

        if (imageCount > 0 && (imagesWithoutAlt / imageCount) > 0.5) {
            contentWaste += 4;
            issues.push({ category: 'accessibility', title: 'Missing Alt Text', detail: `Over 50% of images are missing alt descriptions. Hurts accessibility.`, suggestion: 'Add descriptive alt text to all meaningful images.' });
        }

        if (h1Count === 0) {
            contentWaste += 5;
            issues.push({ category: 'seo', title: 'Missing Primary Heading', detail: 'No H1 found. Page structure is unclear to users and search engines.', suggestion: 'Add a single, clear H1 heading.' });
        } else if (h1Count > 3) {
            contentWaste += 3;
            issues.push({ category: 'seo', title: 'Excessive H1 Headings', detail: `Found ${h1Count} H1 headings. Should have exactly one.`, suggestion: 'Convert secondary headings to H2 or H3.' });
        }

        if (!homepage.hasMetaDescription) {
            contentWaste += 3;
            issues.push({ category: 'seo', title: 'No Meta Description', detail: 'Missing SEO summary. Users won\'t know what the page is about in search results.', suggestion: 'Add a 150-160 character meta description.' });
        }
        contentWaste = Math.min(20, contentWaste);

        // 4. Interaction Design Waste (0-20 points)
        let interactionWaste = 0;
        const ctaCount = homepage.ctaCount || 0;
        const visibleButtons = homepage.visibleButtonCount || 1;
        const smallTargets = homepage.smallTargetCount || 0;
        const smallTargetRatio = smallTargets / visibleButtons;
        const contrast = homepage.contrastRatio || 21;

        const searchPenalty = (siteType === 'blog' || siteType === 'portfolio') ? 3 : 8;
        if (!this.results.hasSearch) {
          interactionWaste += searchPenalty;
          issues.push({ category: 'interaction', title: 'No Search Bar', detail: `No search found. Users must navigate menus manually to find deep content.${siteType === 'blog' ? ' Less critical for blogs but still helpful.' : ''}`, suggestion: 'Add a search bar in the header.' });
        }

        if (!this.results.isMobileResponsive) {
            interactionWaste += 8;
            issues.push({ category: 'interaction', title: 'Not Mobile Responsive', detail: 'Site does not adapt to small screens. Critical friction for mobile users.', suggestion: 'Use responsive layout and viewport meta tag.' });
        }

        if (ctaCount === 0 && siteType !== 'blog' && siteType !== 'portfolio' && siteType !== 'educational') {
          interactionWaste += 7;
          issues.push({ category: 'interaction', title: 'No Clear CTA', detail: 'No prominent call-to-action detected. Conversion path is ambiguous.', suggestion: 'Add a bold "Get Started" or "Learn More" button.' });
        }

        if (smallTargetRatio > 0.2) {
            interactionWaste += 5;
            issues.push({ category: 'interaction', title: 'Small Touch Targets', detail: `${Math.round(smallTargetRatio * 100)}% of buttons are too small (<44px). High risk of mistaps.`, suggestion: 'Increase padding on interactive elements.' });
        }

        if (contrast < 4.5) {
            interactionWaste += 4;
            issues.push({ category: 'design', title: 'Low Text Contrast', detail: `Contrast ratio is ${contrast.toFixed(1)}:1. Below WCAG standard of 4.5:1.`, suggestion: 'Adjust text colors for better readability.' });
        }
        interactionWaste = Math.min(20, interactionWaste);

        // 5. Goal Accessibility Waste (0-20 points)
        let goalWaste = 0;
        if (!goal) {
            goalWaste = 10; // Neutral fallback
        } else {
            const goalKeywords = goal.toLowerCase().split(/\s+/).filter(k => k.length > 2);
            const menuLabels = navigation.allMenuLabels || [];
            
            let foundAtDepth = -1;
            for (const item of this.results.siteMap || []) {
                if (goalKeywords.some(kw => (item.text || '').toLowerCase().includes(kw))) {
                    foundAtDepth = item.depth;
                    break;
                }
            }

            const foundInMenu = menuLabels.some(label => 
                goalKeywords.some(kw => label.toLowerCase().includes(kw))
            );

            if (!foundInMenu && foundAtDepth === -1) {
                goalWaste = 20;
                issues.push({ category: 'goal', title: 'Goal Hidden', detail: `Goal keywords for "${goal}" were not found in navigation.`, suggestion: 'Link the goal directly in the main menu.' });
            } else if (foundAtDepth > 2) {
                goalWaste = 10;
                issues.push({ category: 'goal', title: 'Goal Buried Deeply', detail: `The path to "${goal}" requires too many clicks (${foundAtDepth}).`, suggestion: 'Bring the goal closer to the homepage.' });
            } else {
                goalWaste = 0;
                positives.push(`✅ Goal "${goal}" is easily reachable.`);
            }
        }
        goalWaste = Math.min(20, goalWaste);

        // Final Calculation
        const totalCWS = navigationWaste + visualWaste + contentWaste + interactionWaste + goalWaste;
        
        let gradeLabel = 'Excellent';
        let grade = 'A';
        if (totalCWS > 80) { gradeLabel = 'Severe'; grade = 'F'; }
        else if (totalCWS > 60) { gradeLabel = 'High'; grade = 'D'; }
        else if (totalCWS > 40) { gradeLabel = 'Moderate'; grade = 'C'; }
        else if (totalCWS > 20) { gradeLabel = 'Good'; grade = 'B'; }

        // Populate factors for return
        const factors = {
            navigationWaste,
            visualWaste,
            contentWaste,
            interactionWaste,
            goalWaste
        };

        const suggestions = this.generateSuggestions(totalCWS, issues);

        return {
            url: this.results.url,
            goal,
            cognitiveScore: totalCWS,
            factors,
            grade,
            gradeLabel,
            issues,
            positives,
            aiSuggestionsToOvercomeCognitiveWaste: suggestions,
            metrics: {
                pagesAnalyzed: this.results.pages.length,
                navigationDepth: navDepth,
                menuItems,
                avgLoadTime: this.results.performance.avgLoadTime,
                totalLinks,
                buttonCount,
                hasSearch: this.results.hasSearch,
                isMobileResponsive: this.results.isMobileResponsive,
                imageCount,
                h1Count,
                readabilityGrade: readability.gradeLevel,
                scrollRatio
            },
            annotationTargets: this.results.annotationTargets || [],
            isPartialCrawl,
            partialCrawlReasons,
            siteType,
            timestamp: Date.now(),
            screenshotBase64: this.results.screenshotBase64 || null
        };
    }

    /**
     * Generate AI-style suggestions (Mapped to Frontend Categories)
     */
    generateSuggestions(score, issues) {
        const suggestions = {
            uiUxImprovements: [],       // Navigation, Layout, Mobile
            contentSimplification: [],  // Readability, Visual Clutter, Text
            interactionReduction: []    // Clicks, Forms, Buttons, Speed
        };

        issues.forEach(issue => {
            const suggestion = `${issue.title}: ${issue.suggestion}`;
            
            if (['navigation', 'interaction', 'goal'].includes(issue.category)) {
                suggestions.uiUxImprovements.push(suggestion);
            } else if (['design', 'content', 'seo', 'accessibility'].includes(issue.category)) {
                suggestions.contentSimplification.push(suggestion);
            } else {
                suggestions.interactionReduction.push(suggestion);
            }
        });

        // Fallbacks if categories are empty
        if (suggestions.uiUxImprovements.length === 0) suggestions.uiUxImprovements.push('Maintain consistent navigation across all pages.');
        if (suggestions.contentSimplification.length === 0) suggestions.contentSimplification.push('Use clear headings to break up content sections.');
        if (suggestions.interactionReduction.length === 0) suggestions.interactionReduction.push('Ensure primary buttons are visually distinct from secondary ones.');

        // Limit each list to 5 items for display
        suggestions.uiUxImprovements = suggestions.uiUxImprovements.slice(0, 5);
        suggestions.contentSimplification = suggestions.contentSimplification.slice(0, 5);
        suggestions.interactionReduction = suggestions.interactionReduction.slice(0, 5);

        return suggestions;
    }

    /**
     * Helper: URL depth
     */
    calculateUrlDepth(url, baseUrl) {
        try {
            const urlPath = new URL(url).pathname.replace(/\/$/, '');
            const basePath = new URL(baseUrl).pathname.replace(/\/$/, '');
            const relative = urlPath.replace(basePath, '');
            return relative.split('/').filter(s => s.length > 0).length;
        } catch {
            return 0;
        }
    }

    /**
     * Calculate Flesch-Kincaid Readability
     */
    calculateReadability(text) {
        if (!text || text.length < 10) return { gradeLevel: 0, fleschScore: 100 };

        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        const syllables = this.countSyllables(text);

        if (sentences === 0 || words === 0) return { gradeLevel: 0, fleschScore: 100 };

        // Flesch-Kincaid Grade Level
        // 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
        const gradeLevel = Math.round((0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59);

        // Flesch Reading Ease
        // 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
        const fleschScore = Math.round(206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words)));

        return {
            gradeLevel: Math.max(0, gradeLevel),
            fleschScore: Math.max(0, Math.min(100, fleschScore))
        };
    }

    countSyllables(text) {
        const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        let totalSyllables = 0;

        for (const word of words) {
            if (word.length <= 3) {
                totalSyllables += 1;
                continue;
            }

            const cleanWord = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
                .replace(/^y/, '');
            const matches = cleanWord.match(/[aeiouy]{1,2}/g);
            totalSyllables += matches ? matches.length : 1;
        }

        return totalSyllables;
    }
}
