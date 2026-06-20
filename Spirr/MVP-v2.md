# MyGarden MVP v2 — Test User Readiness Document

## 1. Purpose
MVP v2 should make the app safe and simple for external test users, especially around setup/reset/import, while keeping the product lightweight.

## 2. Primary outcome
A tester should be able to:
1. Start from clean state or known template.
2. Import a garden safely.
3. Edit without breaking layout accidentally.
4. Recover from mistakes quickly.
5. Use it confidently on mobile.

## 3. Must-have features for MVP v2

| Feature | Why it matters | Acceptance criteria |
|---|---|---|
| **Clear garden / reset data** | Essential for trying multiple setups and user demos | Button in Settings: “Nullstill hage”. Confirm dialog + second confirmation. Clears boxes + plantings. Optional “behold språk/innstillinger”. |
| **Import modes with explicit behavior** | Prevents confusion/data loss | Import options: “Erstatt alt”, “Slå sammen”, “Avbryt”. Show preview count (boxes/plantings) before confirm. |
| **Source import clarity** | Testers need to trust what they load | Separate cards for: Local file, Standard setup, GitHub preset. Show source + last updated timestamp. |
| **Undo last layout action** | Reduces fear while editing | One-step undo for drag/resize in edit mode. |
| **Autosave + restore notice** | Better reliability perception | After reload, show “Sist lagret: [time]”. |
| **Mobile editing polish** | Test users will use phones first | Pinch zoom + controls remain stable; no accidental cascades; tap targets ≥44px. |

## 4. High-value improvements (recommended next)

| Improvement | Value |
|---|---|
| **First-run onboarding** (“Ny tom hage”, “Importer fil”, “Standardoppsett”) | Faster setup for first-time testers |
| **Read-only share mode** (`?view=1`) | Easy demo links without accidental edits |
| **Simple activity log** (“Imported from GitHub”, “Reset garden”, “Last edited”) | Better support/debug during testing |
| **Input validation + friendly errors** | Fewer support issues |
| **Quick duplicate box / rename inline** | Faster garden setup |

## 5. Proposed v2 scope (what to build now)
1. Reset/Clear garden with safe confirmations.
2. Improved import flow with replace/merge and preview.
3. Source cards with timestamps and clearer wording.
4. Undo last move/resize.
5. First-run onboarding choice screen.

## 6. Explicit out-of-scope for v2
1. Multi-user collaboration.
2. Cloud sync/auth system.
3. Full backend/database migration.
4. Advanced analytics.

## 7. Suggested rollout
1. **v2.0-alpha**: Reset + new import flow + source cards.
2. **v2.1-beta**: Undo layout + onboarding.
3. **v2.2-test**: Read-only share mode + activity log.

## 8. Success criteria for test users
1. 90% of testers complete setup in under 3 minutes.
2. Zero accidental destructive actions without explicit confirmation.
3. No reported “lost layout due to drag cascade”.
4. At least 80% rate mobile editing as “easy” or better.
