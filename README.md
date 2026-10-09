# Prime Inventory

A Warframe Prime parts tracker. Count the parts you own, see which sets are ready to build, and keep track of what you have mastered. Your inventory never leaves your browser.

## Features

- **Inventory at a glance:** every Prime set with its parts, owned vs. required counts and a progress bar.
- **Mastery tracking:** mark sets as mastered; sets you can build again show up as extra sets.
- **Build and Sell:** consume a full set of parts in one click (Build also marks the set as mastered).
- **Search, filters and sorting:** by name, category, status (Ready to Build, Extra Sets, Almost Complete, Incomplete, Mastered) and relic availability (vaulted or not); sort by name, progress, ready first or spare ducats.
- **Missing Parts:** a separate tab lists the parts you still need for the sets you have not mastered, grouped by the relics you can open right now (the ones that drop the most of them first), plus the parts that only drop from vaulted relics.
- **Relics:** every part lists the relics it drops from, with its rarity, and highlights the relics that can be farmed right now.
- **Ducats:** the ducat value of every part and set, plus how many ducats your spare parts are worth (every part of a mastered set, or the parts above what a set needs).
- **Backups:** export your inventory to a small JSON file and import it on any device. Backups from older versions of the app are still accepted.
- **English and Spanish:** the interface follows your browser language, and item names can stay in English (as on warframe.market) or use the game's own translations. Both are in the Preferences menu, next to the theme.
- **Light and dark themes:** follows your system setting by default.
- **Installable and offline:** install it as an app from the browser (Install app / Add to Home Screen). After the first visit it works without a connection; images you have already seen stay available.

## How data works

- **Your inventory** (part counts and mastered sets) is stored in `localStorage`. Nothing is sent to a server.
- **The item catalog** comes from [`@wfcd/items`](https://github.com/WFCD/warframe-items):
  1. A slim catalog (`src/data/primes.json`) is generated from the installed `@wfcd/items` before `dev`, `build` and `test`, and bundled with the app, so it is always available. It is not committed.
  2. Once a day the app checks jsDelivr for a newer `@wfcd/items` release. If there is one, it downloads it and caches it in the browser, so new Primes appear without redeploying.
  3. If the check fails (offline, network errors), the app keeps using the cached or bundled catalog.
- **Vaulted status** combines two `@wfcd/items` sources that each have known errors: a set counts as vaulted only if it is marked vaulted *and* none of its relics currently drop. Relic rarity is derived from the Intact drop chance, because the rarity labels in the data are unreliable.

## Translations

- UI strings live in `src/i18n/messages.js` (English and Spanish side by side). A unit test checks that every language has every key with the same placeholders and plural forms.
- In-game item names come from `@wfcd/items` translations: `scripts/build-catalog.mjs` writes `src/data/names.<lang>.json` (generated, git-ignored), keeping only names that differ from English. Primes newer than the build fall back to English.

## Offline support

`public/sw.js` is a small hand-written service worker, registered in production builds only:

- **Pages:** network first, falling back to the cached page when offline or after 3 seconds.
- **Build assets** (`/_next/static`) and **images** (`/_next/image`): cache first, trimmed to the newest entries. Images never loaded while online are replaced with an empty placeholder.
- The catalog refresh is not handled by the service worker; the app caches it in `localStorage`.

Bump `VERSION` in `sw.js` when its caching logic changes. The app icon and logo are original artwork (`scripts/icon.svg`); the PNGs in `public/icons/` and `src/app/` and the transparent `public/icons/logo.svg` are derived from it.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) and React 19
- Tailwind CSS 4 with [shadcn/ui](https://ui.shadcn.com/) components, restyled with the Orokin theme (`src/app/globals.css`): every color is an `oro-*` token that switches with light/dark, plus `bevel`, `chip` and card-frame utilities
- Cinzel (display) and Geist (body) via `next/font`
- `next-themes` for theming
- JavaScript (no TypeScript)

## Getting started

```bash
git clone https://github.com/umbra-code/prime-inventory.git
cd prime-inventory
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run catalog` | Regenerate `src/data/primes.json` (runs automatically before dev, build and test) |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests once (Vitest) |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run release -- <patch|minor|major>` | Release a new version (see [Releasing](#releasing)) |

To pick up new Primes in the bundled catalog, update the package (Dependabot opens a weekly PR for it):

```bash
npm install -D @wfcd/items@latest
```

## Tests and CI

Unit tests live next to the code they cover (`*.test.js`) and focus on the logic in `src/services` and `src/lib`: the inventory reducer, storage migrations, filters and sorting, and the catalog refresh (with `fetch` and `localStorage` mocked).

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests and a production build on every push to `master` or `development` and on pull requests. Work happens on `development`; `master` only receives tested, tagged releases. Dependabot (`.github/dependabot.yml`) keeps dependencies up to date.

## Releasing

Work happens on `development`; `master` only receives tested, tagged releases. From a clean `development`:

```bash
npm run release -- minor            # or patch / major
npm run release -- minor --dry-run  # show the steps without changing anything
```

The script (`scripts/release.mjs`) pulls, runs lint and tests, asks for confirmation, runs `npm version` (version commit + tag), pushes `development` with the tag, waits for CI on that commit, and only if CI passes fast-forwards `master` to it and pushes. It always switches back to `development`. Set `GITHUB_TOKEN` to raise the GitHub API rate limit while it waits for CI.

The app shows the build's version in the header, the footer and the Preferences menu, computed at build time from `git describe` (`src/lib/buildVersion.mjs`): `v2.3.0` for a release, `v2.3.0-4-gabc1234` for a build 4 commits later, with `-dirty` if it had uncommitted changes. It links to the release or commit on GitHub, so a screenshot tells you exactly which code it shows.

## Project structure

```
scripts/build-catalog.mjs   Generates the bundled catalog
src/data/primes.json        Bundled catalog (generated, git-ignored)
src/lib/slimCatalog.mjs     Raw @wfcd/items data -> app catalog (shared by build and browser)
src/services/catalog.js     Catalog selection and daily refresh
src/services/userInventory.js  User data reducer, storage, migrations, backups
src/services/filters.js     Search, status filters and sorting
src/i18n/                   UI strings, translator and language context
src/lib/itemNames.mjs       In-game item names per language (used by the catalog script)
src/context/InventoryContext.jsx  App state (state + stable actions contexts)
src/components/             UI (inventory cards, layout, shadcn/ui primitives)
src/test/                   Shared test fixtures
```

## License

MIT. See [LICENSE](LICENSE).

Warframe and all related content are trademarks of Digital Extremes Ltd. This project is not affiliated with Digital Extremes.
