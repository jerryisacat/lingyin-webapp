---
confidence: 0.85
sources: [structure/_index.md, ui/_index.md]
synthesized_at: '2026-05-23T18:01:20.207Z'
type: synthesis
title: Local-Only API Key & Privacy Posture
summary: API keys and user assets are stored and accessed exclusively on the client or via owner-only presigned URLs; no server-side key management exists.
tags: [privacy, storage, apikey, r2]
related: []
keywords: [localapikey, presignedurl, owneronly, r2, deleteentry]
createdAt: '2026-05-23T18:01:20.207Z'
updatedAt: '2026-05-23T18:01:20.207Z'
---

# Local-Only API Key & Privacy Posture

Privacy and key isolation are architectural invariants enforced at storage, image delivery, and AI client layers.

## Evidence

- **structure**: storage removes public URL fallbacks, enforces getUser() + owner verification on /api/image, deletes assets on diary removal; src_app states 'API keys stored locally only; no server-side management'.
- **ui**: landing/auth highlights emphasize 'local API keys only' alongside PWA offline capability.
