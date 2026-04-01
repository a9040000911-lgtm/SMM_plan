# Provider Intelligence Skill

## Overview
This skill documents the "intelligence" layer used to ingest, analyze, and synchronize services from external SMM providers (e.g., Perfect Panel APIs) into the Smmplan Internal Catalog.

## Core Concepts
- **ProviderService**: Raw data from external APIs (IDs, names, rates).
- **InternalService**: Normalized services in the Smmplan database, categorized and priced for users.
- **Smart Analysis**: The weighted scoring engine that converts "unstructured" provider service names into structured metadata.

## 1. Transport Layer (`UniversalProvider`)
Located in `src/services/providers/universal.provider.ts`.
-   **Configurable**: Uses a `metadata` JSON field in the `Provider` model to handle different API quirks.
-   **Actions**: Standard actions include `balance`, `services`, `add` (create order), and `status`.
-   **Request Formatting**: Supports both JSON and Form-Data via `axios` or native `fetch`.

## 2. Analysis Layer (`SmartAnalyzerLogic`)
Located in `src/services/providers/smart-analyzer.logic.ts`.

### Weighted Scoring System
The analyzer detects the **Platform** by searching for keywords in the Name, Category, and Description.
-   **Category Match**: +10 points.
-   **Name Match**: +5 points.
-   **Description Match**: +1 point.

The platform with the highest score is selected.

### Target Type Mapping
The analyzer reconciles the service category with the platform's requirements:
-   **CHANNEL/PROFILE**: Used for Followers, Subscribers, Members, and Groups.
-   **POST/VIDEO**: Used for Likes, Views, Reactions, and Comments.
-   **CHANNEL_POSTS**: Used for "Auto" services (Last X posts).
-   **STORY**: Used for Story Views/Interactions.

> [!IMPORTANT]
> Some platforms have specific target type overrides (e.g., VK Friends -> CHANNEL, YouTube Subscribers -> CHANNEL).

### Geo & Warranty Detection
-   Uses regex to extract warranty days (e.g., "30 days").
-   Uses `GEO_MAP` to detect audience countries (RU, USA, KZ, etc.) from flags or keywords.

## 3. Synchronization Flow (`ProviderSyncService`)
Located in `src/services/providers/provider-sync.service.ts`.
-   **Transaction-Safe**: Uses Prisma transactions to ensure data integrity during upserts.
-   **Pricing Engine**: Calls `PricingService` to calculate retail prices based on provider cost + markups.
-   **Mapping Persistence**: Updates `InternalServiceMapping` to allow failover/switching between providers for the same internal service.

## 💡 Best Practices
- **Platform Guards**: If a service name contains explicit keywords of a different platform (e.g., "YouTube" in a VK category), the analyzer uses a +20 "Explicit Match" boost to override the category-level tag.
- **Authority**: The Intelligence layer (`SmartAnalyzerLogic`) is the final authority for `platform`, `category`, and `targetType` during synchronization, surpassing raw provider labels.
- **Normalization**: Always use uppercase for platform enums but lowercase for slugs/URLs to prevent matching errors.
- **Sanitization**: Descriptions from providers often contain HTML or links to other panels; always use `DescriptionSanitizer` before saving.

## 🛠 Maintenance
To add a new platform:
1.  Update `PLATFORM_KEYWORDS` and `PLATFORM_LABELS` in `smart-analyzer.logic.ts`.
2.  Add the platform to the `PLATFORMS` array.
3.  (Optional) Add a custom banner/icon in `CATEGORY_ICONS`.
