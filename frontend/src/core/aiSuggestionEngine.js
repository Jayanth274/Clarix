/**
 * AI Suggestion Engine
 * Generates improvement recommendations based on cognitive metrics
 */

/**
 * Generate AI-powered suggestions for website improvement
 * @param {Object} metrics - The cognitive metrics from analysis
 * @param {string} websiteUrl - The website URL
 * @returns {Object} Suggestions object with categories
 */
export function generateAISuggestions(metrics, websiteUrl = '') {
    const suggestions = {
        uxImprovements: [],
        navigationOptimizations: [],
        trafficBoost: [],
        salesOptimization: [],
        overallScore: 0,
        priority: 'medium'
    };

    const { fatigue, backtracks, confusion, hesitations, steps, totalSteps } = metrics;

    // Determine priority level
    if (fatigue > 70 || confusion > 70) {
        suggestions.priority = 'critical';
    } else if (fatigue > 50 || confusion > 50) {
        suggestions.priority = 'high';
    } else if (fatigue > 30) {
        suggestions.priority = 'medium';
    } else {
        suggestions.priority = 'low';
    }

    // Calculate overall UX score (0-100, higher is better)
    suggestions.overallScore = Math.max(0, 100 - fatigue);

    // UX Improvements based on fatigue
    if (fatigue > 70) {
        suggestions.uxImprovements.push({
            title: "Critical: Simplify Information Architecture",
            description: "Your website has extremely high cognitive load (Fatigue: " + Math.round(fatigue) + "). Users are struggling to find information.",
            action: "Reorganize navigation with clear categories and reduce menu depth to 2-3 levels maximum.",
            impact: "high",
            effort: "medium"
        });
    } else if (fatigue > 50) {
        suggestions.uxImprovements.push({
            title: "Reduce Visual Clutter",
            description: "Moderate cognitive load detected. Users may feel overwhelmed by too many options.",
            action: "Implement progressive disclosure - show only essential information first, with 'Show More' options.",
            impact: "medium",
            effort: "low"
        });
    } else if (fatigue > 30) {
        suggestions.uxImprovements.push({
            title: "Optimize Visual Hierarchy",
            description: "Your UX is decent but can be improved with better visual prioritization.",
            action: "Use size, color, and spacing to create clear visual hierarchy. Make primary actions stand out.",
            impact: "low",
            effort: "low"
        });
    } else {
        suggestions.uxImprovements.push({
            title: "Excellent UX!",
            description: "Your website has low cognitive load. Users can navigate efficiently.",
            action: "Maintain current design patterns and test with real users regularly.",
            impact: "low",
            effort: "low"
        });
    }

    // Navigation Optimizations based on backtracks
    if (backtracks && backtracks > 3) {
        suggestions.navigationOptimizations.push({
            title: "Fix Navigation Confusion",
            description: `Users backtracked ${backtracks} times, indicating unclear navigation paths.`,
            action: "Add breadcrumbs, improve menu labels, and provide search functionality. Consider adding a 'Quick Links' section for common tasks.",
            impact: "high",
            effort: "medium"
        });
    } else if (backtracks && backtracks > 1) {
        suggestions.navigationOptimizations.push({
            title: "Clarify Navigation Labels",
            description: "Some backtracking detected. Menu labels may be ambiguous.",
            action: "Use clear, descriptive labels. Test with users to ensure labels match their mental models.",
            impact: "medium",
            effort: "low"
        });
    }

    if ((totalSteps || steps) > 5) {
        suggestions.navigationOptimizations.push({
            title: "Shorten User Journey",
            description: `Users needed ${totalSteps || steps} steps to reach their goal. Optimal is 3-4 steps.`,
            action: "Create direct paths to popular content. Add prominent CTAs on homepage for common user goals.",
            impact: "high",
            effort: "medium"
        });
    }

    if (confusion > 60) {
        suggestions.navigationOptimizations.push({
            title: "Implement Guided Navigation",
            description: "High confusion probability suggests users don't know where to go next.",
            action: "Add contextual help tooltips, onboarding tours for first-time visitors, and clear next-step indicators.",
            impact: "high",
            effort: "medium"
        });
    }

    // Traffic Boost Strategies
    if (fatigue > 50) {
        suggestions.trafficBoost.push({
            title: "Improve SEO with Better UX",
            description: "High cognitive load correlates with high bounce rates, hurting SEO rankings.",
            action: "Google prioritizes user experience. Reducing fatigue will improve Core Web Vitals and dwell time.",
            impact: "high",
            effort: "high"
        });
    }

    suggestions.trafficBoost.push({
        title: "Optimize Page Speed",
        description: "Hesitations may indicate slow loading times.",
        action: "Compress images, minimize JavaScript, use CDN, and implement lazy loading to reduce wait times.",
        impact: "high",
        effort: "medium"
    });

    if ((totalSteps || steps) > 4) {
        suggestions.trafficBoost.push({
            title: "Create Landing Pages for Key Goals",
            description: "Users take too many steps. Create dedicated landing pages.",
            action: "Build SEO-optimized landing pages for common user intents. Link directly from ads/social media.",
            impact: "medium",
            effort: "medium"
        });
    }

    // Sales Optimization
    if (fatigue > 60) {
        suggestions.salesOptimization.push({
            title: "Reduce Checkout Friction",
            description: "High cognitive load likely extends to checkout process, causing cart abandonment.",
            action: "Simplify forms (ask only essential info), add guest checkout, show progress indicators, enable autofill.",
            impact: "critical",
            effort: "medium"
        });
    }

    if (backtracks && backtracks > 2) {
        suggestions.salesOptimization.push({
            title: "Add Trust Signals",
            description: "Backtracks suggest hesitation. Users may lack confidence to purchase.",
            action: "Display security badges, customer reviews, money-back guarantees, and clear return policies.",
            impact: "high",
            effort: "low"
        });
    }

    suggestions.salesOptimization.push({
        title: "Implement Exit-Intent Popups",
        description: "Capture leaving visitors with targeted offers.",
        action: "Show discount codes or free resources when users show exit intent. Personalize based on browsing behavior.",
        impact: "medium",
        effort: "low"
    });

    if (fatigue < 40) {
        suggestions.salesOptimization.push({
            title: "Upsell Opportunities",
            description: "Your smooth UX creates trust. Leverage this for upsells.",
            action: "Add 'Customers Also Bought' sections, bundle deals, and post-purchase upsells.",
            impact: "medium",
            effort: "low"
        });
    }

    return suggestions;
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority) {
    const colors = {
        critical: 'from-red-600 to-red-700',
        high: 'from-orange-600 to-orange-700',
        medium: 'from-yellow-600 to-yellow-700',
        low: 'from-green-600 to-green-700'
    };
    return colors[priority] || colors.medium;
}

/**
 * Get impact icon
 */
export function getImpactIcon(impact) {
    const icons = {
        critical: '🔴',
        high: '🔶',
        medium: '🟡',
        low: '🟢'
    };
    return icons[impact] || icons.medium;
}
