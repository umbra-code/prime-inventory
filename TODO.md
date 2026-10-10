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
- [x] Use `next/image` for local images

## Features

- [x] Ducat values per part and set, spare ducats per set and in total, sort by spare ducats
- [x] Vaulted marker and relic availability filter
- [x] Relics that drop each part, with rarity and which relics drop now
- [x] Sorting (name, progress, ready first), progress and missing parts on each card
- [x] Distinct card states (ready, extra set, progress-scaled accent) and "Almost Complete" filter
- [x] Theme selector (System / Light / Dark)
- [x] Missing Parts tab: parts of non-mastered sets grouped by the relics available now
- [ ] Platinum prices (deferred). Plan: WFInfo's `https://api.warframestat.us/wfinfo/prices/` covers every set and part in one CORS-enabled JSON; refresh in the browser every few hours with a build-time fallback, credit "warframe.market via WFInfo", keep the app free
- [x] Installable PWA: manifest, original app icon, offline service worker, offline badge
- [x] i18n: English and Spanish interface, item names in English or the game's language
- [x] Original logo and app icon (replaces the official Lotus emblem)
- [x] Orokin visual identity: Prime gold on warm black or white marble, beveled frames, Cinzel display type, Void cyan for relics available now

## From the original PrimeInventory (Laravel)

- [x] Compact table layout (one row per set), switchable with the cards
- [x] In Arsenal flag, separate from Mastered, with its own status filter
- [x] Weapon type sub-filter (melee classes from the Warframe Wiki)
- [x] "Now in Game" panel: newest Primes and Primes back from the vault
- [x] Prime Resurgence panel: Varzia's current Primes and when the rotation ends (warframestat.us); mastered sets fade and go last
- [x] Move Reset out of the header into the Preferences menu (Danger zone)

## Tooling

- [x] Vitest for `src/services` and `src/lib` (reducer, migrations, filters, catalog)
- [x] GitHub Actions: lint + test + build
- [x] Dependabot to keep dependencies current
- [x] Daily workflow that updates the Warframe data and releases a patch when the app would show something new
