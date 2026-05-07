# Clarix — Cognitive Waste Score (CWS) Formula Documentation

## Overview

The Cognitive Waste Score (CWS) measures the invisible mental friction on a website. Scores range from 0 to 100. **Higher score = more cognitive waste = worse UX.** Lower is better.

The formula is grounded in established UX research, cognitive psychology, and accessibility standards. Each of the five categories is scored 0–20, giving a total maximum of 100.

---

## The Five Categories

### 1. Navigation Waste (0–20 pts)

**Grounded in: Hick's Law (Hick & Hyman, 1952)**

Hick's Law states that the time taken to make a decision increases logarithmically with the number of available choices:

```
RT = a + b log₂(n + 1)
```

Where `RT` = reaction time, `n` = number of choices, `a` and `b` = empirically derived constants.

Applied to navigation menus, more items directly increase the time users need to find what they want. Industry guidelines from CorsoUX and Nielsen Norman Group recommend 5–7 items for primary navigation menus.

| Condition | Points |
|---|---|
| Menu items > 20 | +10 pts |
| Menu items > 12 | +7 pts |
| Menu items ≥ 8 | +3 pts |
| Nav depth > 5 levels | +10 pts |
| Nav depth ≥ 4 levels | +5 pts |

**References:**
- Hick, W.E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1), 11–26.
- Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3), 188–196.
- Nielsen Norman Group — Navigation guidelines
- CorsoUX — Common guidelines: 5–7 for primary menus

---

### 2. Visual Clarity Waste (0–20 pts)

**Grounded in: Miller's Law, Visual Complexity Research**

Miller's Law (1956) states that the average person can hold 7 (±2) items in working memory. Excessive links, buttons, and page length overload working memory and increase cognitive load.

| Condition | Points |
|---|---|
| Total links > 150 | +8 pts |
| Total links > 80 | +4 pts |
| Button count > 30 | +7 pts |
| Button count ≥ 15 | +3 pts |
| Scroll ratio > 10× viewport | +5 pts |
| Scroll ratio ≥ 5× viewport | +2 pts |

**References:**
- Miller, G.A. (1956). The magical number seven, plus or minus two. *Psychological Review*, 63(2), 81–97.
- Geissler, G., et al. (2001). Web page aesthetics, performance, and usability. *Journal of Advertising*, 30(4).

---

### 3. Content Readability Waste (0–20 pts)

**Grounded in: Flesch-Kincaid Readability Formula (1975)**

The Flesch-Kincaid Grade Level formula calculates reading difficulty:

```
FKGL = 0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59
```

Developed by Rudolf Flesch and J. Peter Kincaid for the US Navy in 1975. Widely adopted as the standard readability metric in UX, journalism, and government communications.

| Condition | Points |
|---|---|
| Reading grade > 12 (College+) | +8 pts |
| Reading grade ≥ 9 (High School) | +4 pts |
| >50% images missing alt text | +4 pts |
| No H1 heading | +5 pts |
| More than 3 H1 headings | +3 pts |
| No meta description | +3 pts |

**References:**
- Kincaid, J.P., et al. (1975). Derivation of new readability formulas for Navy enlisted personnel. *Research Branch Report 8-75*. Naval Air Station, Memphis.
- W3C WCAG 2.1 — Success Criterion 1.1.1 (Alt Text)

---

### 4. Interaction Design Waste (0–20 pts)

**Grounded in: WCAG 2.1 Standards, Fitts's Law**

**Touch Target Size (44px):**
WCAG 2.1 Success Criterion 2.5.5 mandates that interactive elements must be at least 44×44 CSS pixels. This is confirmed by Apple HIG and Google Material Design guidelines.

**Contrast Ratio (4.5:1):**
WCAG 2.1 Success Criterion 1.4.3 mandates a minimum contrast ratio of 4.5:1 for normal text.

**Fitts's Law:**
The time to acquire a target is a function of distance and target size. Small buttons require more precise motor control, increasing error rates and cognitive effort.

| Condition | Points |
|---|---|
| No search bar | +8 pts |
| Not mobile responsive | +8 pts |
| No CTA detected | +7 pts |
| >20% buttons under 44px | +5 pts |
| Contrast ratio < 4.5:1 | +4 pts |

**References:**
- W3C (2018). WCAG 2.1 — Success Criterion 2.5.5: Target Size. https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- W3C (2018). WCAG 2.1 — Success Criterion 1.4.3: Contrast (Minimum).
- Fitts, P.M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47(6), 381–391.
- Apple Human Interface Guidelines — Minimum tappable area: 44×44 points
- Google Material Design — Minimum touch target: 48×48dp

---

### 5. Goal Accessibility Waste (0–20 pts)

**Grounded in: Information Scent Theory (Pirolli & Card, 1999)**

Information Scent Theory describes how users follow "scent" — textual and visual cues — to navigate toward their goal. If goal-relevant keywords are absent from navigation, users cannot follow the scent and abandon the site.

| Condition | Points |
|---|---|
| Goal keywords not found in nav or sitemap | +20 pts |
| Goal found but at nav depth > 2 | +10 pts |
| Goal found in main navigation | 0 pts |

**References:**
- Pirolli, P., & Card, S. (1999). Information foraging. *Psychological Review*, 106(4), 643–675.
- Nielsen Norman Group — Information Scent research

---

## Site-Type Adjusted Scoring

Clarix automatically detects the site type and adjusts penalty weights accordingly. A personal blog is not penalized for missing CTAs the same way an e-commerce site would be.

| Site Type | Detection Signals | Key Adjustments |
|---|---|---|
| **Blog/Personal** | No prices, blog/posts in nav, low button count | CTA penalty removed, search penalty halved |
| **Portfolio** | Single column, no forms, few links | CTA and search penalties removed |
| **E-commerce** | Prices detected, add-to-cart buttons | Full formula, stricter CTA/search |
| **Corporate** | Contact forms, multiple nav sections | Standard formula |
| **Educational** | .edu domain, dense links, many nav items | Nav penalty reduced, readability weighted higher |
| **Unknown** | Default | Standard formula |

---

## Summary of Research Sources

| Law / Standard | Author / Body | Year | Applied To |
|---|---|---|---|
| Hick-Hyman Law | Hick & Hyman | 1952–1953 | Navigation item count |
| Miller's Law | George A. Miller | 1956 | Link and button density |
| Flesch-Kincaid Grade Level | Kincaid et al. (US Navy) | 1975 | Content readability |
| Fitts's Law | Paul Fitts | 1954 | Touch target sizing |
| Information Scent Theory | Pirolli & Card | 1999 | Goal accessibility |
| WCAG 2.1 SC 2.5.5 | W3C | 2018 | 44px touch target minimum |
| WCAG 2.1 SC 1.4.3 | W3C | 2018 | 4.5:1 contrast ratio |
| WCAG 2.1 SC 1.1.1 | W3C | 2018 | Alt text on images |

---

*Penalty thresholds (e.g. menu > 20 items) are calibrated based on industry guidelines from Nielsen Norman Group and CorsoUX research, applied on top of the theoretical foundations above.*
