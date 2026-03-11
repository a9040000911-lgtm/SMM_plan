# Software Requirements Specification (SRS): SMMPlan Admin Enterprise

## 1. Introduction
This document defines the functional and non-functional requirements for the SMMPlan Web Administration Panel. The goal is to provide a scalable, high-performance, and interactive interface for managing orders, users, transactions, and analytics.

## 2. Architectural Principles
- **Hyper-Interactivity:** Every entity (User, Order, Service, Transaction) must be clickable, leading to its respective detail view or filtered context.
- **Deep Linking:** Every filter state and view must be representable via URL parameters for easy sharing and bookmarking.
- **Optimistic UI:** State changes (e.g., toggling a service) should reflect immediately in the UI.
- **Auditability:** Every manual write operation must be logged in the `AdminLog` table.

## 3. Module: Unified Data Grid (Tables)
All primary tables (Orders, Users, Transactions) must support:
- **Column Visibility:** Toggle columns on/off.
- **Advanced Filtering:**
    - `String`: Contains, Equals, Starts with.
    - `Number`: Range (min/max), Greater than, Less than.
    - `Date`: Preset ranges (Today, 7d, 30d) or Custom Picker.
    - `Enum`: Multi-select checkboxes for Statuses, Platforms, etc.
- **Export:** Export currently filtered view to CSV/Excel.

## 4. Functional Modules

### 4.1. Global Dashboard (Analytics)
- **Real-time KPI Cards:** Total Revenue, Net Profit, Active Orders, New Users (with % change vs previous period).
- **Revenue Charts:** Area charts for revenue/profit trends.
- **Provider Health:** Real-time balance status of all integrated providers (VexBoost, Stream-Promotion, etc.).
- **Incident Monitor:** List of latest failed orders or Margin Guard triggers.

### 4.2. User Management (User 360°)
- **Search:** Universal search by TG ID, Username, or Internal UUID.
- **Profile View:**
    - Total Spent vs. Total Balance.
    - Referral stats (Direct count, earnings).
    - **Interactive History:** Nested tables for "User's Orders" and "User's Transactions" with local search.
- **Actions:** 
    - Manual balance adjustment (increment/decrement) with reason logging.
    - Role management (User/Reseller/Admin).
    - Ban/Unban.

### 4.3. Order Management (Command Center)
- **Status Tracking:** Visual progress bars for Drip-feed orders.
- **Link Analysis:** Show platform icon and target object type directly in the row.
- **Interaction:** Clicking an Order ID opens a detailed side-panel:
    - **Provider Logs:** Raw JSON responses from the provider API.
    - **Margin Guard Info:** Cost price at the time of order vs current cost price.
    - **Action Buttons:** Cancel & Refund, Manual Complete, Re-try with alternative provider.

### 4.4. Financial Ledger (Transactions)
- **Type Differentiation:** Clear visual color coding for Deposits, Withdrawals, and Refunds.
- **Balance Integrity:** One-click "Audit" button to verify user's balance consistency against transaction history.
- **Fee Accounting:** Show payment gateway fees vs net incoming amount.

### 4.5. Service Catalog & Margin Guard
- **Bulk Editor:** Select multiple services to update descriptions, categories, or price multipliers.
- **Margin Alert System:** Services with < 500% markup highlighted in RED.
- **Provider Mapping:** Drag-and-drop priority management for multi-provider services.

## 5. UI/UX Standard
- **Design System:** Based on Tailwind CSS and Radix UI.
- **Themes:** Dark/Light mode support.
- **Responsiveness:** Fully functional on tablets and desktops.
- **Command Palette:** `Ctrl+K` or `Cmd+K` for global search and navigation.

## 6. Security & Access Control

### 6.1. Authentication
- Telegram Web App authentication (initData verification).
- Persistent sessions with automatic expiry.

### 6.2. Role-Based Access Control (RBAC)
| Feature | Super Admin (`ADMIN`) | Support Admin (`SUPPORT`) | SEO Admin (`SEO`) |
| :--- | :---: | :---: | :---: |
| Dashboard (Financials) | Full | View Only | No Access |
| Order Management | Full | Full (Refund/Cancel) | View Only |
| User Management | Full | View + Balance Adj. | No Access |
| Service Catalog (Descriptions) | Full | View Only | Full |
| Service Catalog (Pricing) | Full | No Access | No Access |
| News & Content | Full | Full | Full |
| System Settings | Full | No Access | No Access |
| Admin Audit Logs | Full | View Only | No Access |

## 7. Performance Requirements
- **Table Loading:** Initial data-grid load < 500ms.
- **Filtering:** Complex filters must execute < 200ms using database indexing.
- **Real-time:** Auto-refresh for provider balances every 60s.
