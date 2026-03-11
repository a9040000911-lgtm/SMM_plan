---
name: multi_project_architecture
description: Smmplan's Multi-Project Architecture, Database Isolation, and Admin Panel role access rules
---

# Rules for Multi-Project Architecture

This skill defines the rules for interacting with the Smmplan database and understanding the isolation of data across multiple "Projects" (tenants) operating under a single super-admin backend. 

Always reference this document when modifying any Admin Panel pages, API routes, or querying the Database (`prisma`).

## 1. Project Isolation Principle
Smmplan is a multi-tenant platform. One installation of Smmplan serves MULTIPLE independent projects (e.g., Smmgold, PrimeLike, Smmplan). 
Virtually every key model in `schema.prisma` is linked to a `projectId`:
- `User` (projectId)
- `Order` (projectId)
- `ProjectServiceOverride` (projectId)
- `LegalDocument` (projectId)
- `News`, `PromoCode`, etc.

**Rule M1**: Whenever you query the database for users, orders, documents, overrides, etc., you **MUST ALWAYS** include `projectId` in the `where` clause. Do not fetch global lists unless you are building a generic Super-Admin dashboard that explicitly intends to cross boundaries.

## 2. Admin Panel Architecture
The Admin Panel (`src/app/admin`) serves two distinct groups:
1. **Global Admins (Super-Admins)**: Can see ALL projects, ALL users, and ALL settings globally.
2. **Project Admins/Staff**: Have access ONLY to the data of the project(s) they are assigned to, and ONLY the tabs defined in their `allowedTabs` array.

**Rule A1**: The Sidebar navigation (`sidebar-nav.tsx`) filters items using:
\`\`\`ts
const visibleItems = isGlobalAdmin
    ? group.items
    : group.items.filter(item => allowedTabs.includes(item.id));
\`\`\`
If you add a new page (e.g. `legal` or `notifications`) to the Admin Panel, you must assign it an `id` in `navGroups` and remember that non-global admins will NOT see it unless that exact `id` is added to their `allowedTabs` via the Staff Management page (`/admin/employees`).

**Rule A2**: Admin API Routes or Server Actions must ALWAYS verify project access:
\`\`\`ts
const projectId = await getAdminProjectId(); // Fetches the project the admin is currently managing.
// or
if (!isGlobalAdmin && targetProjectId !== user.projectId) throw new Error('Forbidden');
\`\`\`

## 3. Override vs Global Models
- `InternalService` and `ServiceCategory` are **GLOBAL**. They do not have a `projectId`. All projects share the same base list of services fetched from providers.
- `ProjectServiceOverride` is **PROJECT-SPECIFIC**. Projects can change the `customPrice`, `isActive`, and `customName` of a base `InternalService`. 
- Prices displayed to the end-users must ALWAYS be calculated based on the project's Overrides or the project's default `markup`. 

Whenever creating features inside the admin panel, always ask yourself: "Is this a global setting (applying to all projects) or a local setting (applying only to the currently selected project)?".
