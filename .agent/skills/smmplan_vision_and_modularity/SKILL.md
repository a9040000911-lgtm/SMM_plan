---
name: smmplan_vision_and_modularity
description: Smmplan Core Product Vision, Growth Strategy, and Pluggable Module Architecture
---

# SMMPlan: Core Vision & Modularity Rules

This skill defines the overarching product strategy and architectural principles for SMMPlan. Always consult this document when designing new features, writing marketing copy, or structuring database models.

## 1. Product Philosophy: "Growth Planning, Not Just Orders"
SMMPlan is fundamentally different from a standard "SMM Panel". 
- **The Problem:** Typical panels force users to log in daily to buy 100 likes or 50 subscribers, leading to jagged, unnatural growth and manual tracking exhaustion.
- **The SMMPlan Solution (The "Plan"):** Users top up their balance, log in once a week/month, and *schedule* their resource growth. 
- **Key Mechanics:**
  - **Scheduled Orders (Отложенные заказы):** Users plan orders for a week/month ahead.
  - **Smart Drip-Feed:** Growth is distributed smoothly and naturally over time, avoiding social media shadowbans.
  - **Automated Tracking:** SMMPlan uses external bots (e.g., Telegram bots acting as admins/trackers) to monitor real-time execution (actual subscribers joined vs. planned) and displays this on beautiful, comparative graphs in the user dashboard.

## 2. Marketing & User Experience (UX)
- All copy, tooltips, and ad materials must emphasize "Consistent, natural, and planned growth" over "Cheap, fast likes".
- **Smart Hints (Умные подсказки):** The UI must dynamically educate the user. Instead of generic text, hints must be platform-specific (e.g., explaining why Telegram views need to be dripped differently than YouTube views).
- The Link Analyzer acts as a safety net to prevent user errors, ensuring the user feels guided and protected.

## 3. Pluggable Module Architecture (Strict Requirement)
SMMPlan is designed as a multi-tenant platform where some clients might want the advanced "Growth Planner" features, while others just want a "Simple SMM Panel".
- **Rule of Modularity:** EVERY advanced feature (Loyalty, Churn Prediction, AI Hints, Scheduled Orders, Bot Tracking) **MUST BE A TOGGLEABLE MODULE**.
- If a module breaks, requires maintenance, or a tenant doesn't want it, it must be instantly disable-able via the Admin Panel WITHOUT breaking the core ordering flow.
- **Implementation:** Use feature flags or boolean toggles in the `Project` or `Settings` database models (e.g., `isScheduledOrdersEnabled`, `isSmartHintsEnabled`). The UI and backend logic must gracefully fall back to basic behavior if a module is OFF.

## 4. Analytical Approach to Tracking
Before implementing automated tracking bots:
1. Analyze the technical feasibility (API limits, bot rights).
2. Analyze the market standard.
3. Build a decoupled microservice or robust queue system for tracking, ensuring it doesn't overload the main web server.
4. Display the delta: "Planned Growth Curve" vs "Actual Verified Growth Curve".
