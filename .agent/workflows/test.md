---
description: Autonomous QA testing — run, analyze, and write tests for the Smmplan project
---

# Autonomous Testing Workflow

// turbo-all

## Prerequisites
Before executing, read the QA Agent skill for full context:

1. Read the QA Agent skill
```
view_file d:\Smmplan\.agent\skills\qa_agent\SKILL.md
```

2. Read the test registry
```
view_file d:\Smmplan\.agent\skills\qa_agent\test-registry.md
```

## Phase 1: Analyze Recent Changes

3. Check what files changed recently
```bash
git log --oneline -10
```

4. Get the diff of recently changed files
```bash
git diff --name-only HEAD~5
```

## Phase 2: Run Existing Tests

5. Run the full test suite
```bash
npx jest --passWithNoTests --forceExit --detectOpenHandles 2>&1
```

6. **Analyze results:**
   - If all tests **PASS** ✅ → proceed to Phase 3
   - If any tests **FAIL** ❌:
     - Determine if the failure is a **broken test** or a **real bug**
     - Fix broken tests. For real bugs, report to the user without blindly fixing
     - Re-run failed tests to confirm the fix

## Phase 3: Coverage Gap Analysis

7. Cross-reference the changed files (from Step 4) with the **test-registry.md**
   - Identify any changed service or action that has **no test coverage** (marked ❌ in the registry)
   - Prioritize by the **Priority Queue** at the bottom of the registry

8. Write new tests for uncovered changed files following conventions from SKILL.md Section 2

## Phase 4: Security Testing (ОБЯЗАТЕЛЬНО)

> Reference: SKILL.md Section 6 — all 5 security vectors must be verified.

9. Run existing security-related tests
```bash
npx jest --testPathPattern="(security|foolproof|double_refund|isolation)" --passWithNoTests --forceExit 2>&1
```

10. Check security coverage against the 5 vectors in the test registry:
    - Server Action RBAC (unauthorized access prevention)
    - Payment webhook verification (signature + API double-check)
    - Financial slippage detection (provider spend tracking)
    - Multi-project data isolation (cross-project data leak prevention)
    - Bot HTML injection prevention (user input escaping)

11. If any security vector has NO test coverage (❌ in registry), write tests for it BEFORE proceeding

## Phase 5: E2E Testing (if applicable)

12. If structural UI or auth changes were made, run E2E tests:
```bash
npx playwright test 2>&1
```

13. If E2E tests are not set up, report this as a recommendation

## Phase 6: Final Verification

9. Run the full test suite again to confirm everything passes
```bash
npx jest --passWithNoTests --forceExit --detectOpenHandles 2>&1
```

## Phase 5: Report

10. Generate a test report following the format in SKILL.md Section 4, including:
    - Total passed/failed/skipped
    - Issues found and their resolution
    - New tests written
    - Recommendations for future coverage improvements
