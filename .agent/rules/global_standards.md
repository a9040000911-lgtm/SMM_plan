# Global Development Standards

These rules are mandatory for all coding and architectural tasks in the Smmplan project.

## 1. Architectural Integrity
- **SOLID Principles**: Every class/module must have a single responsibility.
- **DRY (Don't Repeat Yourself)**: Abstract common logic into shared services or hooks.
- **KISS (Keep It Simple, Stupid)**: Prioritize readable code over clever optimizations unless performance is critical.

## 2. Technical Precision
- **TypeScript Strictness**: Never use `any` unless absolutely unavoidable (and documented). Ensure null/undefined safety.
- **Database Safety**: Always use transactions for multi-row updates. Never risk data loss.
- **Clean Code**: Use descriptive variable names. Functions should do one thing and do it well.

## 3. Compliance & Security
- **OWASP Compliance**: Protect against SQL injection, XSS, and CSRF in every route.
- **2026 Ready**: Adhere to the established 2026 project vision (Post-Telegram, Ledger-based, PG18).
