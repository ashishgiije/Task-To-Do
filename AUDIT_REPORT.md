# Source Audit — Task-To-Do

Reviewed 4 November 2026 against source commit `23ed6bf6696658697e83f2251c66986072145bac`. This is a focused code/documentation review and selected local validation, not a penetration test or an exhaustive vulnerability scan. Application files and credentials were not changed. Secret values are intentionally omitted.

## Severity summary

| Critical | High | Medium | Low |
|---:|---:|---:|---:|
| 0 | 1 | 2 | 1 |

Critical: direct resource/identity boundary failure. High: serious exposure or a core reproducibility blocker. Medium: correctness, validation, or deployment issue. Low: maintenance or coverage gap. Static findings describe potential impact; only explicitly listed runtime checks were executed.

## Findings

### 1. High — A runtime environment file is tracked by Git; its values are intentionally omitted here

- **Affected file:** [backend/.env](<backend/.env>)
- **Evidence:** A runtime environment file is tracked by Git; its values are intentionally omitted here.
- **Potential impact:** Configuration and any embedded credentials can be copied from repository history.
- **Recommended correction:** Review privately, move configuration to ignored local files, supply a safe example, and rotate real exposed credentials separately.

### 2. Medium — Third-party dependencies and generated coverage assets are tracked

- **Affected file:** [backend/node_modules](<backend/node_modules>)
- **Evidence:** Third-party dependencies and generated coverage assets are tracked.
- **Potential impact:** Large diffs and stale vendored code complicate review and dependency updates.
- **Recommended correction:** In a separate maintenance change, stop tracking dependencies and reinstall from lockfiles.

### 3. Medium — The API URL is fixed to localhost

- **Affected file:** [frontend/src/api.js](<frontend/src/api.js>)
- **Evidence:** The API URL is fixed to localhost.
- **Potential impact:** A deployed client will call the visitor’s own machine.
- **Recommended correction:** Read the API base from supported deployment configuration.

### 4. Low — The root test command always fails and there are no application test scripts

- **Affected file:** [package.json](<package.json>)
- **Evidence:** The root test command always fails and there are no application test scripts.
- **Potential impact:** No automated regression coverage is demonstrated.
- **Recommended correction:** Add account, ownership, task, and reorder tests.

## Validation evidence

Frontend `npm ci` and `npm run build` passed. MongoDB-backed account/task workflows were not run because no usable database connection was supplied. The root `npm test` is a failing placeholder.

## Review scope and limits

Reviewed tracked application source, entry points, manifests/configuration, routes and data models where present, existing documentation, and available test definitions. Generated dependencies and binary artifacts were inventoried rather than treated as authored application logic. Provider calls, cloud deployment, and external data/model claims remain unverified unless explicitly listed above. No secret was rotated and no migration was run against a user database.

## Priorities

Address Critical and High findings before public deployment. Then add regression tests for the affected boundary or workflow, fix Medium issues, and resolve Low maintenance findings. All application corrections require a separate reviewed coding change.
