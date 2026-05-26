# UI Baker Management — Design Document

**Date:** 2026-02-24
**Status:** Approved

## Problem

Baker addresses, aliases, and monitoring settings can only be managed by manually editing a TOML config file and restarting the service. This is cumbersome for day-to-day operations.

## Solution

Add a Settings page in the UI that allows full management of baker addresses, aliases, and monitoring parameters with immediate effect (hot reload).

## Architecture

### Storage: JSON Overlay

- **Baseline:** `~/.config/pyrometer/pyrometer.toml` (read-only by UI)
- **Overrides:** `~/.config/pyrometer/overrides.json` (written by UI)
- **Merge rule:** `effective config = deepMerge(TOML, overrides.json)`
- `baker_monitor.bakers` array: JSON **replaces** TOML (no array merge)
- `alias` map: merge by key (add/update/delete)
- If `overrides.json` doesn't exist, TOML alone is used (current behavior preserved)

### overrides.json format

```json
{
  "baker_monitor": {
    "bakers": ["tz3RDC3...", "tz3bvNMQ..."],
    "rpc": "https://mainnet.api.tez.ie/",
    "max_catchup_blocks": 120,
    "head_distance": 1,
    "missed_threshold": 3
  },
  "alias": {
    "tz3RDC3...": "My Baker 1",
    "tz3bvNMQ...": "My Baker 2"
  }
}
```

### ConfigManager

New class in backend that centralizes config read/write:

```typescript
class ConfigManager extends EventEmitter {
  getEffectiveConfig(): Config
  getBakers(): string[]
  getAliases(): TzAddressAliasMap

  addBaker(address: string): void       // save + emit "bakers-changed"
  removeBaker(address: string): void    // save + emit "bakers-changed"
  updateAlias(address: string, alias: string | null): void  // null = delete
  updateSettings(partial: Partial<BakerMonitorConfig>): void

  // Events: "bakers-changed", "aliases-changed", "settings-changed"
}
```

### Hot Reload

- `BakerMonitor` listens to `ConfigManager` events
- On "bakers-changed": adds/removes bakers from monitoring without restart
- On "aliases-changed": API context refreshed
- On "settings-changed": monitoring parameters updated

### GraphQL Mutations

```graphql
type Mutation {
  authenticate(token: String!): AuthResult!
  addBaker(address: String!): BakerMutationResult!
  removeBaker(address: String!): BakerMutationResult!
  setAlias(address: String!, alias: String!): AliasMutationResult!
  removeAlias(address: String!): AliasMutationResult!
  updateBakerMonitorSettings(input: BakerMonitorSettingsInput!): SettingsMutationResult!
}

input BakerMonitorSettingsInput {
  rpc: String
  max_catchup_blocks: Int
  head_distance: Int
  missed_threshold: Int
}
```

### Authentication

- Token defined in TOML: `[ui] admin_token = "secret"`
- Frontend sends `Authorization: Bearer <token>` header
- Middleware checks header on mutations only (queries remain public)
- UI stores token in `localStorage` after successful `authenticate` mutation

### UI — Settings Page

- New tab "Settings" (gear icon) in app header
- Auth gate: if not authenticated, fields are read-only with "Unlock" button
- **Bakers section:** table with address, alias, edit/delete actions, "Add baker" form
- **Settings section:** form for RPC, max_catchup_blocks, head_distance, missed_threshold
- Uses Chakra UI components: Tabs, Table, Input, IconButton, Modal, useToast
- Client-side address validation (tz* format) before mutation
- Confirmation dialog on baker removal
- Toast feedback for success/error

## Data Flow

```
UI Settings Page
    │ GraphQL Mutations (+ Auth header)
    ▼
GraphQL Resolvers (auth middleware)
    │
    ▼
ConfigManager
    ├── Writes overrides.json
    ├── Emits events
    │
    ▼
BakerMonitor (hot reload)
    │
    ▼
Updated monitoring state
```

## Migration

- Zero migration needed: if `overrides.json` doesn't exist, behavior is unchanged
- Existing TOML configs continue to work as baseline
- First UI edit creates `overrides.json` with current effective config as starting point
