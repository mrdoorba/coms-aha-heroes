# TODOS

## Comprehensive API Test Suite
**What:** Add tests for all 17 existing route files (users, teams, points, rewards, redemptions, etc.)
**Why:** Zero test coverage on all existing endpoints. Testing debt that grows with each feature.
**Pros:** Catch regressions, enable confident refactoring, CI gates bad code.
**Cons:** Large effort if done manually (~1 week human, ~45min CC).
**Context:** Once `bun test` is set up as part of the infra deployment plan, extending to existing endpoints follows the same patterns. Start with the most critical routes (auth, points, uploads) and expand outward.
**Depends on:** Infra deployment plan completing (sets up bun test framework + CI test step).

## Terraform CI Validation
**What:** Add `tofu validate` + `tofu plan` job to ci.yml for PRs touching `infra/`.
**Why:** Catches syntax errors and resource conflicts before merge. Currently only caught on `tofu apply`.
**Pros:** Prevents broken Terraform from merging. Fast feedback loop.
**Cons:** Requires GCP auth in PR context (read-only WIF or separate SA). Adds CI complexity.
**Context:** The WIF module being added supports attribute conditions — could allow `tofu plan` from PRs with a read-only SA. Implement after WIF is stable.
**Depends on:** WIF module (Step 1 of infra plan).
