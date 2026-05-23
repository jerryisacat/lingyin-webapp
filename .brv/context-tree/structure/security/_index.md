---
children_hash: f307aaa343b0b4db0fafd6715efdf67d3cd0704b0b92c9ad99dc3c9621bdaee1
compression_ratio: 0.23509369676320271
condensation_order: 1
covers: [security_hardening.md]
covers_token_total: 587
summary_level: d1
token_count: 138
type: summary
---
## Security Hardening

**Entry:** `structure/security/security_hardening.md` (2026-05-23; consolidated from `.abstract.md` and `.overview.md` due to high overlap)

### Key Changes
- Added security response headers to `next.config.mjs`
- Fixed AI endpoint error leakage: generic client messages + server-side logging only
- Removed OpenRouter preflight network check from API test endpoint

### Files
- `next.config.mjs`

### Highlights
- Prevents information leakage; eliminates unnecessary preflight checks; Next.js config updates for header hardening.