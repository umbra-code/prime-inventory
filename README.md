# Prime Inventory

A Warframe Prime parts tracker. Count the parts you own, see which sets are ready to build, and keep track of what you have mastered. Your inventory never leaves your browser.

## Features

- **Inventory at a glance:** every Prime set with its parts, owned vs. required counts and a progress bar.
- **Mastery and arsenal tracking:** mark sets as mastered, and separately whether you still keep them built (In Arsenal). Sets you can build again show up as extra sets.
- **Cards or table:** browse sets as detailed cards, or switch to a compact table (one row per set) to update many counts quickly. The choice is remembered.
- **Build and Sell:** consume a full set of parts in one click (Build also marks the set as mastered and in your arsenal).
- **Now in Game:** a collapsible panel with the newest Primes and the vaulted Primes whose relics drop again, computed from the catalog. Click one to jump to it.
- **Prime Resurgence:** a second panel with the Primes Varzia sells right now and the exact end of the rotation. In both panels, sets you have already mastered get a thin frame and a check, keep their progress, and go last.
- **Search, filters and sorting:** by name, category, weapon type (Rifle, Bow, Nikana, Heavy Blade…), status (Ready to Build, Extra Sets, Almost Complete, Incomplete, Mastered) and relic availability (vaulted or not); sort by name, progress, ready first or spare ducats.
- **Missing Parts:** a separate tab lists the parts you still need for the sets you have not mastered, grouped by the relics you can open right now (the ones that drop the most of them first), plus the parts that only drop from vaulted relics.
- **Relics:** every part lists the relics it drops from, with its rarity, and highlights the relics that can be farmed right now.
- **Ducats:** the ducat value of every part and set, plus how many ducats your spare parts are worth (every part of a mastered set, or the parts above what a set needs).
- **Platinum prices:** the recent average price of every set and part on warframe.market, next to its ducat value, so you can tell what is worth selling for platinum and what for ducats. Each price links to the item's page there.
- **Reset** lives in the Preferences menu under Danger zone, behind a confirmation and with undo.
- **Backups:** export your inventory to a small JSON file and import it on any device. Backups from older versions of the app are still accepted.
- **Send to another device:** copy your inventory to another device with a short link or a QR code. The copy is encrypted in your browser and the link works for 15 minutes; afterwards each device keeps its own inventory.
- **English and Spanish:** the interface follows your browser language, and item names can stay in English (as on warframe.market) or use the game's own translations. Both are in the Preferences menu, next to the theme.
- **Light and dark themes:** follows your system setting by default.
- **Installable and offline:** install it as an app from the browser (Install app / Add to Home Screen). After the first visit it works without a connection; images you have already seen stay available.

## How data works

- **Your inventory** (part counts and mastered sets) is stored in `localStorage`. Nothing is sent to a server.
- **The item catalog** comes from [`@wfcd/items`](https://github.com/WFCD/warframe-items):
  1. A slim catalog (`src/data/primes.json`) is generated from the installed `@wfcd/items` before `dev`, `build` and `test`, and bundled with the app, so it is always available. It is not committed.
  2. Once a day the app checks jsDelivr for a newer `@wfcd/items` release. If there is one, it downloads it and caches it in the browser, so new Primes appear without redeploying.
  3. If the check fails (offline, network errors), the app keeps using the cached or bundled catalog.
- **Weapon types** come from `@wfcd/items`, except melee classes, which it does not provide: those come from the [Warframe Wiki](https://wiki.warframe.com/w/Module:Weapons/data/melee) into the committed `src/data/meleeClasses.json`. New melee Primes show as "Other Melee" until it is updated.
- **Vaulted status** combines two `@wfcd/items` sources that each have known errors: a set counts as vaulted only if it is marked vaulted *and* none of its relics currently drop. Relic rarity is derived from the Intact drop chance, because the rarity labels in the data are unreliable.
- **Prime Resurgence** (Varzia's current offer and its end date) comes live from the [warframestat.us](https://docs.warframestat.us/) world state API and is cached until the rotation ends. Offline or when the API is down, the panel is simply hidden.

- **Platinum prices** are the averages [WFInfo](https://wfinfo.warframestat.us) computes from [warframe.market](https://warframe.market) orders, served by the warframestat.us API as one small file (`/wfinfo/prices/`). The app downloads it at most every 6 hours, keeps it in the browser, and never calls warframe.market itself; the links to it are plain links. Prices are an extra: when they cannot be loaded, they are simply not shown. The footer credits both sources.

## Send to another device

Your inventory only lives in your browser; this copies it to another one without accounts. It is a one-time copy, not a sync: afterwards the two inventories are independent, exactly as with Export and Import.

1. **Create link** compresses the inventory and encrypts it in the browser (AES-GCM, with a random key made for that link), then uploads the result.
2. The server keeps it for 15 minutes in a private [Vercel Blob](https://vercel.com/docs/vercel-blob) store and answers with an id. The link is `…/#t=<id>.<key>`: the key sits after the `#`, which browsers never send to a server, so what is stored cannot be read by the server or by anyone without the link.
3. Opening the link downloads and decrypts the inventory, asks before replacing the one in that browser (with undo), and then deletes the stored copy. The key is removed from the address bar right away.

Blobs have no expiry of their own, so each stored copy carries its expiry time and saving a new one deletes those that ran out. Uploads are limited to 64 KB, to requests from the site itself, and to 200 copies waiting at once.

The feature needs a Blob store: create a private one in the Vercel project (Storage → Blob), which sets `BLOB_STORE_ID`, and add `BLOB_READ_WRITE_TOKEN` for local development (see `.env.example`). Without one, everything else works and sending reports that it is not available.

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
- Two small route handlers and Vercel Blob for [Send to another device](#send-to-another-device); everything else is static
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
| `npm run melee-classes` | Update `src/data/meleeClasses.json` from the Warframe Wiki (the data update workflow runs it daily) |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit tests once (Vitest) |
| `npm run test:watch` | Run the unit tests in watch mode |
| `npm run release -- <patch|minor|major>` | Release a new version (see [Releasing](#releasing)) |

### Data updates

Nothing needs to be done by hand when Warframe adds Primes. Users get them the same day through the daily catalog check, and the **Update Warframe data** workflow (`.github/workflows/update-data.yml`) keeps the repository current: every day it updates `@wfcd/items` and the melee classes, and when something the app shows changed (new Primes, vaulted status, relics, translated names…) it runs lint, tests and a build and releases a patch version to `master`, with release notes listing the changes. When nothing changed, it does nothing.

It only releases while `development` has nothing unreleased; otherwise it waits for your next release. If the wiki changes its format, the melee classes step fails and the run is marked as failed (GitHub emails you), but the rest of the update still goes out. It can also be run by hand from the Actions tab.

GitHub disables scheduled workflows in public repositories after 60 days without activity (it emails a warning first); re-enable it from the Actions tab.

## Tests and CI

Unit tests live next to the code they cover (`*.test.js`) and focus on the logic in `src/services` and `src/lib`: the inventory reducer, storage migrations, filters and sorting, and the catalog refresh (with `fetch` and `localStorage` mocked).

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests and a production build on every push to `master` or `development` and on pull requests. Work happens on `development`; `master` only receives tested, tagged releases. Dependabot (`.github/dependabot.yml`) keeps the other dependencies up to date.

## Releasing

Work happens on `development`; `master` only receives tested, tagged releases. From a clean `development`:

```bash
npm run release -- minor "Prime Resurgence"  # or patch / major; the title is optional
npm run release -- minor --dry-run           # show the steps without changing anything
```

The script (`scripts/release.mjs`) pulls, runs lint and tests, asks for a title if none was given and for confirmation, creates the version commit and tag (both named like `2.9.0 · Prime Resurgence`), pushes `development` with the tag, waits for CI on that commit, and only if CI passes fast-forwards `master` to it and pushes. It always switches back to `development`. Set `GITHUB_TOKEN` to raise the GitHub API rate limit while it waits for CI.

At the end it prints a link to GitHub's new release page with the tag, the title and a draft of the notes (the `feat`, `fix` and `perf` commits since the last release) already filled in: rewrite the notes for users if needed and publish. The data update workflow creates its releases on its own.

The app shows the build's version in the header, the footer and the Preferences menu, computed at build time from `git describe` (`src/lib/buildVersion.mjs`): `v2.3.0` for a release, `v2.3.0-4-gabc1234` for a build 4 commits later, with `-dirty` if it had uncommitted changes. It links to the release or commit on GitHub, so a screenshot tells you exactly which code it shows.

## Project structure

```
scripts/build-catalog.mjs   Generates the bundled catalog
src/data/primes.json        Bundled catalog (generated, git-ignored)
src/lib/slimCatalog.mjs     Raw @wfcd/items data -> app catalog (shared by build and browser)
src/services/catalog.js     Catalog selection and daily refresh
src/services/userInventory.js  User data reducer, storage, migrations, backups
src/services/filters.js     Search, status filters and sorting
src/services/prices.js      Platinum prices: download, cache, matching to sets and parts
src/lib/transferCodec.js    Send to another device: compression, encryption and link format
src/services/transfer*.js   Its browser side (transfer.js) and Blob storage (transferStore.js)
src/app/api/transfer/       Its route handlers
src/i18n/                   UI strings, translator and language context
src/lib/itemNames.mjs       In-game item names per language (used by the catalog script)
src/context/InventoryContext.jsx  App state (state + stable actions contexts)
src/components/             UI (inventory cards, layout, shadcn/ui primitives)
src/test/                   Shared test fixtures
```

## License

MIT. See [LICENSE](LICENSE).

Warframe and all related content are trademarks of Digital Extremes Ltd. This project is not affiliated with Digital Extremes.
