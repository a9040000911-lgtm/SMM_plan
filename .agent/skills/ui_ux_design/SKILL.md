---
name: ui_ux_design
description: Advanced interface design using Google Stitch, Material Design 3, and AI-driven prototyping methodologies.
---

# UI/UX Design & AI Prompting Skill

This skill provides a standardized protocol for creating, auditing, and implementing high-end user interfaces using Google's 2026 design ecosystem.

## 1. Google Stitch: The Core AI Designer

Google Stitch is a generative UI tool that converts intent into production-ready designs and code.

### Operational Modes
*   **Standard (Gemini 2.5 Flash)**:
    *   *Input*: Text only.
    *   *Use Case*: Rapid wireframing, layout exploration, fast iterations (up to 350/mo).
    *   *Output*: Clean HTML/CSS, React, One-click Figma export.
*   **Experimental (Gemini 3.1 Pro)**:
    *   *System*: 1M Token Context, **64K Output Window** (perfect for large React files).
    *   *Input*: Text + Images (up to 900), Audio, Video, Repositories.
    *   *Use Case*: 
        - **Animated SVGs**: Generates production-ready, lightweight code-based animations.
        - **Logic-to-UI**: Converts flowcharts/logic diagrams into multi-step forms.
        - **System Mastery**: Analyzes entire design systems/codebases for 100% consistency.
    *   *Output*: Native React components, Interactive Dashboards, SWE-Bench optimized code.

---

## 2. FAS Prompting Methodology

To get the best results from AI designers like Stitch or Antigravity, use the **FAS (Functional, Aesthetic, Structural)** framework.

### F - Functional (What it DO)
- **User Goal**: "The user needs to deposit funds via Robokassa."
- **Behavior**: "Show a loading spinner after clicking 'Pay'."
- **Responsiveness**: "Stack cards vertically on screens smaller than 768px."

### A - Aesthetic (What it FEEL)
- **Vibe Adjectives**: "Premium, minimalist, trustworthy, vibrant, cyber-punk."
- **Color/Type**: "Use Inter font, #007AFF as primary, dark mode background."
- **Style Boundaries**: "No rounded corners, use 1px glassmorphism borders."

### S - Structural (Where it AT)
- **Hierarchy**: "Headline at top, 3 cards in the middle, sticky footer."
- **Spatial**: "Asymmetric layout with 20% negative space on the right."
- **Components**: "Navbar with logo on left, search center, profile right."

---

## 3. The "Infinite Loop" Workflow

1.  **Generate**: Start in Stitch with a FAS prompt.
2.  **Iterate**: Use conversational editing (e.g., "Make the header smaller," "Add a shadow to the cards").
3.  **Prototype**: Link screens in Stitch to verify the "feel" of the flow.
4.  **Export**: 
    - **Speed**: One-click Figma export.
    - **Precision**: Download `.zip` and use `html.to.design` plugin in Figma for better layer structure.
5.  **Refine**: Apply brand-specific tokens in Figma.
6.  **Implement**: Use Antigravity or Gemini Code Assist to turn the design into React components.

---

## 4. Supplementary Google Tools

*   **Lighthouse 2026**: Run after implementation to check A11y, SEO, and Performance.
*   **Google Font Previewer**: Browser extension for real-time typography testing.
*   **Material Design 3 (M3)**: Reference for "Dynamic Color" (Material You) logic.
*   **Puppeteer**: Automate "Chaos Testing" on the UI to see if it breaks at weird resolutions.

---

## 5. Sample Proactive Prompt

> "Act as a Senior UI Designer. Generate a **vibrant yet professional** Dashboard for an SMM Panel.
> **Structural**: Use a collapsible sidebar, a main grid of stats, and a 'Latest Orders' table.
> **Functional**: Include a real-time 'active status' indicator on each card and a 'View Details' modal.
> **Aesthetic**: Use a deep navy background with neon cyan accents. High contrast, sans-serif typography. 
> **Device**: Desktop first, but ensure mobile scalability."

---

---

## 7. Gemini 3.1 Pro: Deep Reasoning Features

Leverage these advanced capabilities for complex Smmplan tasks:

*   **Logic Extraction**: Paste a business logic snippet and ask: *"Generate a multi-step UI flow that handles this logic with appropriate loading states."*
*   **Repo-Wide Auditing**: Feed the entire `src/components` folder (via 1M context) and ask: *"Find all components that don't satisfy our theme-token standard and generate fixes."*
*   **Animated Dynamics**: Ask for: *"A lightweight SVG loading animation for Smmplan that feels 'premium' and uses our brand colors."*
