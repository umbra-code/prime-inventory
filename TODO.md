# Roadmap

Prime Inventory is a client-side app for tracking Warframe Prime parts. User data stays in the browser; the item catalog ships with the app and refreshes from new `@wfcd/items` releases.

## Done

- [x] Upgrade to Next.js 16, migrate ESLint to flat config
- [x] Fix dev-mode data loss (StrictMode wiped localStorage)
- [x] Theme handling with `next-themes` (no flash, follows system theme)
- [x] Slim catalog generated at build time (`npm run catalog`), no Server Action
- [x] Daily catalog refresh from jsDelivr with cached and bundled fallbacks
- [x] User data separated from the catalog (`useReducer`), versioned storage with v1 migration
- [x] Compact export; import accepts current and legacy formats with visible notices
- [x] Memoized cards so editing one set does not re-render the whole grid
- [x] Remove dead code, unused files and dependencies

## UX and accessibility

- [x] Responsive header and filters
- [x] `aria-label` on icon-only buttons (+/−, clear search, GitHub, theme)
- [x] Toasts with undo for Build/Sell/Import/Reset
- [x] Replace `window.confirm` on reset with an in-app dialog
- [x] Persist category and status filters
- [x] Sync inventory across tabs (`storage` event)
- [x] Use `next/image` for local images (`wf.png`)

## Features

- [x] Ducat values per part and set, spare ducats per set and in total, sort by spare ducats
- [x] Vaulted marker and relic availability filter
- [x] Relics that drop each part, with rarity and which relics drop now
- [x] Sorting (name, progress, ready first), progress and missing parts on each card
- [x] Distinct card states (ready, extra set, progress-scaled accent) and "Almost Complete" filter
- [x] Theme selector (System / Light / Dark)
- [x] Missing Parts tab: parts of non-mastered sets grouped by the relics available now
- [ ] warframe.market prices (needs a proxy because of CORS)
- [ ] Installable PWA with full offline support
- [ ] i18n
- [ ] Visual identity rework (after features settle)

## Tooling

- [x] Vitest for `src/services` and `src/lib` (reducer, migrations, filters, catalog)
- [x] GitHub Actions: lint + test + build
- [x] Dependabot to keep `@wfcd/items` and other dependencies current
