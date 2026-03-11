---
name: link_service_rules
description: Strict rules for mapping SMM Link Types to Service Categories
---

# Rules for Link-to-Service Category Analysis

This skill defines the rigorous, mathematically precise relationship between user-provided links and the SMM services that can be ordered for them. Disobeying these rules leads to logical errors (e.g., ordering "Subscribers" for a "Post" link, which is technically impossible and causes provider API failures).

Always reference this document when modifying Link Analyzers (e.g., `src/utils/link-analyzer/platforms/*`) or filtering logic in the frontend `InstantOrder.tsx`.

## 1. Telegram (TG) Rules
| Link Type (objectType) | Link Format Examples | Allowed Categories (possibleCategories) | targetType (DB) |
| --- | --- | --- | --- |
| **TG_CHANNEL / TG_GROUP** | `t.me/durov` | `SUBSCRIBERS`, `GROUPS`, `BOOSTS`, `VIEWS`, `REACTIONS` | `CHANNEL` |
| **TG_POST** | `t.me/durov/123`, `t.me/c/123/456` | `VIEWS`, `REACTIONS`, `REPOSTS`, `COMMENTS` | `POST` |
| **TG_STORY** | `t.me/durov/s/1` | `STORIES` | `STORY` |
| **TG_BOT** | `t.me/bot?start=1` | `BOTS`, `REFERRALS`, `OTHER` | `CUSTOM` |
| **TG_STARS** | `t.me/channel/stars` | `STARS` | `CUSTOM` |
| **TG_INVITE** | `t.me/+AbCdEfG` | `SUBSCRIBERS`, `GROUPS` | `CHANNEL` |
| **TG_BOOST / TG_PROXY / TG_FOLDER** | `/boost/`, `/proxy`, `/addlist/` | Context-specific (e.g., `BOOSTS` or `OTHER`) |

## 2. VKontakte (VK) & VK Play Rules
VK has a complex link structure. Services must strictly belong to these exact combinations:

| Object Type | Link Patterns (Examples) | Allowed Categories | targetType (DB) |
| --- | --- | --- | --- |
| **VK_PROFILE** | `id123`, `username` | `FRIENDS`, `SUBSCRIBERS`, `OTHER` | `PROFILE` |
| **VK_GROUP** | `club123`, `public123`, `name` | `GROUPS`, `SUBSCRIBERS`, `OTHER` | `CHANNEL` |
| **VK_WALL** | `wall-123_456`, `wall123_456` | `LIKES`, `REPOSTS`, `VIEWS`, `COMMENTS`, `SAVES` | `POST` |
| **VK_VIDEO / VK_CLIP** | `video-123...`, `clip-123...` | `VIEWS`, `LIKES`, `COMMENTS`, `REPOSTS` | `POST` |
| **VK_PHOTO / VK_ALBUM** | `photo...`, `album...` | `LIKES`, `COMMENTS`, `SAVES` | `POST` |
| **VK_PLAY_CHANNEL** | `live.vkvideo.ru/...` | `SUBSCRIBERS`, `OTHER` | `CHANNEL` |
| **VK_PLAY_LIVE** | `live.vkvideo.ru/...` | `STREAMS`, `VIEWS`, `OTHER` | `POST` |
| **VK_STORY** | `story...`, `narrative...` | `VIEWS`, `LIKES`, `REACTIONS` | `STORY` |
| **VK_ARTICLE** | `vk.com/@...` | `VIEWS`, `LIKES`, `REPOSTS` | `POST` |
| **VK_MARKET** | `market-...`, `product-...` | `LIKES`, `REPOSTS`, `COMMENTS` | `POST` |
| **VK_TOPIC** | `topic-...` | `COMMENTS`, `VIEWS` | `COMMENT` |
| **VK_POLL** | `poll-...`, `app7198399` | `POLLS` | `CUSTOM` |
| **VK_PLAYLIST** | `music/playlist...`, `audio_playlist` | `PLAYS`, `VIEWS`, `OTHER` | `CUSTOM` |
| **VK_AUDIO** | `vk.com/audio...` | `PLAYS`, `LIKES`, `REPOSTS` | `CUSTOM` |
| **VK_PODCAST** | `vk.com/podcast...` | `PLAYS`, `VIEWS`, `OTHER` | `POST` |
| **VK_APP** | `vk.com/app...` | `SUBSCRIBERS`, `OTHER` | `CUSTOM` |
| **VK_CALL** | `vk.com/call/...` | `VIEWS`, `OTHER` | `CUSTOM` |
| **VK_COMMENT** | `reply=`, `thread=` | `LIKES` | `COMMENT` |
| **VK_DM** | `vk.me/username` | `REFERRALS`, `OTHER` | `EXTERNAL` |

## 3. Instagram (IG) Rules
| Object Type | Description | Allowed Categories | targetType (DB) |
| --- | --- | --- | --- |
| **IG_PROFILE** | User Profile | `SUBSCRIBERS`, `STORIES`, `OTHER` | `PROFILE` |
| **IG_POST** | Feed Post / Photo | `LIKES`, `VIEWS`, `COMMENTS`, `REPOSTS`, `SAVES` | `POST` |
| **IG_REEL** | Reels Video | `VIEWS`, `LIKES`, `COMMENTS`, `REPOSTS`, `SAVES` | `VIDEO` |
| **IG_STORY** | Active Story | `VIEWS`, `REACTIONS` | `STORY` |
| **IG_HIGHLIGHT**| Saved Highlight | `VIEWS` | `STORY` |

## Mandatory Architecture Principles
1. **Frontend Filtering**: `InstantOrder.tsx` relies heavily on `analysisResult.objectType`. The UI translates this objectType via `mapObjectTypeToTargetType` to `detectedTargetType` and filters explicit `service.targetType` from the DB.
2. **Fallback / Fallthrough**: If a service's DB `targetType` is not accurately mapped, but the category matches `possibleCategories`, do not hide the service entirely if it has a generic targetType like `ALL`.
3. **Privacy UI Toggle**: Private links (`isPrivate: true`) trigger a special UI toggle ("Public vs Private") to prevent hiding legitimate public services that users might want to force-order onto an invite link.

When importing or creating a service for a platform, **this matrix dictates what `targetType` the admin should select.**
