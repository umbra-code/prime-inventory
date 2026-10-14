# Prime Inventory

A Warframe Prime parts tracker. Count the parts you own, see which sets are ready to build, and keep track of what you have mastered. Your inventory never leaves your browser.

**Use it at [prime-inventory-lovat.vercel.app](https://prime-inventory-lovat.vercel.app).** There is nothing to install and no account to create; the rest of this page is for people who want to see how it works, run their own copy or contribute.

## Features

- **Inventory at a glance:** every Prime set with its parts, owned vs. required counts and a progress bar.
- **Mastery and arsenal tracking:** mark sets as mastered, and separately whether you still keep them built (In Arsenal). Sets you can build again show up as extra sets.
- **Cards or table:** browse sets as detailed cards, or switch to a compact table (one row per set) to update many counts quickly. The choice is remembered.
- **Full width:** on a wide screen, switch the page from a centered column to the full width of the window (Preferences → Page width) to fit more cards per row.
- **Build and Sell:** consume a full set of parts in one click (Build also marks the set as mastered and in your arsenal).
- **Now in Game:** a collapsible panel with the newest Primes and the vaulted Primes whose relics drop again, computed from the catalog. Click one to jump to it.
- **Prime Resurgence:** a second panel with the Primes Varzia sells right now and the exact end of the rotation. In both panels, sets you have already mastered get a thin frame and a check, keep their progress, and go last.
- **Search, filters and sorting:** by name, category, weapon type (Rifle, Bow, Nikana, Heavy Blade…), status (Ready to Build, Extra Sets, Almost Complete, Incomplete, Mastered, Not Mastered, In Arsenal) and relic availability (vaulted or not); sort by name, progress, ready first or spare ducats.
- **Missing Parts:** a separate tab lists the parts you still need for the sets you have not mastered, grouped by the relics you can open right now (the ones that drop the most of them first), plus the parts that only drop from vaulted relics.
- **Relics:** every part lists the relics it drops from, with its rarity, and highlights the relics that can be farmed right now.
- **Ducats:** the ducat value of every part and set, plus how many ducats your spare parts are worth (every part of a mastered set, or the parts above what a set needs).
- **Platinum prices:** the recent average price of every set and part on warframe.market, next to its ducat value, so you can tell what is worth selling for platinum and what for ducats. Each price links to the item's page there, and the summary shows what your spare parts add up to.
- **Reset** lives in the Preferences menu under Danger zone, behind a confirmation and with undo.
- **History and undo:** the History button lists your recent changes (edits, Build, Sell, imports, resets) and undoes them one step at a time or back to any point, also with Ctrl+Z / Ctrl+Y. It survives reloads, so a mistake noticed later can still be fixed.
- **Backups:** export your inventory to a small JSON file and import it on any device. Backups from older versions of the app are still accepted.
- **Sync between devices:** pair your phone and your computer with a QR code, no account needed, and a change on one shows up on the other. The inventory is encrypted on your devices; if sync is ever unavailable, each device keeps working on its own.
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

## Change history

Every change to the inventory is recorded so it can be undone later, not only from the "Undo" in its toast. The inventory and its history are one reducer state (`src/services/history.js`): an action produces the new inventory and, in the same step, its history entry, so there is nothing pending that closing the page could lose.

- **Entries hold only what changed**, with the value before and after (`{ counts: { part: [from, to] }, mastered, arsenal }`), not a copy of the inventory: about 100 bytes each, and the last 50 are kept in `localStorage`.
- **Quick edits are grouped:** changes to the same set less than 5 seconds apart join one entry (ten clicks on "+" read "Barrel 0 → 10"), and edits that end where they started leave none. Build, Sell, Import, Reset and receiving from another device always get their own entry.
- **Undo is a position in the list:** undo moves it back, redo forward, and the History menu jumps straight to any entry. Undone entries stay, dimmed, until a new change is made.
- The history belongs to the device: it is not part of backups or of "Send to another device". Other open tabs share it.

## Sync between devices

Optional, and an extra on top of the local inventory: every device keeps its own full copy in `localStorage`, and when the server cannot be reached (offline, no database, the free tier paused) the app works exactly as it does without sync and catches up later. The cloud in the header shows the state: off, syncing, up to date, or not available.

- **Pairing instead of accounts.** Turning sync on creates a random secret; another device joins by opening `…/#s=<secret>` (a QR code). Nothing identifies the user, so there is no personal data to keep.
- **The server cannot read it.** From the secret each device derives two things: the id its group is stored under, and the key that encrypts the inventory (`src/lib/syncCodec.js`). The database holds one row per group: `id`, an encrypted `payload`, a `version` and a date.
- **Writes name the version they replace.** `PUT /api/sync/<id>` stores a payload only if `baseVersion` is the stored version; otherwise it answers `409` with the newer copy for the device to merge.
- **Merging is per value.** Each device keeps the last copy it agreed on with the server (`base`). What it changed since is the difference between `base` and its inventory, which is put back on top of the downloaded copy inside the reducer (`mergeSynced` in `src/services/history.js`). Edits to different parts on two devices both survive; when both changed the same part, the device that syncs last wins. A merge is a History entry, so it can be undone.
- **When it syncs:** on opening the app, on coming back to the tab, when the connection returns, and a moment after the inventory changes. It never polls on a timer, because the free database sleeps when idle and a tab checking every few minutes would keep it awake all month. With several tabs open only one of them syncs (Web Locks); the others share the inventory through `localStorage` as before.

It needs a [Neon](https://neon.com/) Postgres database in `DATABASE_URL` (the free plan is enough; this deployment gets it through Vercel). It has to be Neon: the driver talks to Neon's HTTPS endpoint, not to Postgres directly, so another Postgres server would need `src/services/syncStore.js` changed to use a different client. The table is created on first use, so there are no migrations to run. If the database does not answer within 8 seconds (a wrong address, an outage), the server reports sync as unavailable and the devices try again later. Groups not written to for over a year are removed; a device that comes back simply uploads its copy again.

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
- A few small route handlers, with Vercel Blob for [Send to another device](#send-to-another-device) and Postgres ([Neon](https://neon.com/)) for [Sync between devices](#sync-between-devices); everything else is static
- JavaScript (no TypeScript)

## Running it on your computer

You only need this to change the code or to keep a private copy; to use the app, open the link at the top.

**What you need**

- [Node.js](https://nodejs.org/) 20.9 or newer (the LTS version from the website is fine). It includes `npm`. To check, open a terminal and run `node --version`.
- The code: either install [Git](https://git-scm.com/) and clone the repository as shown below, or use the green **Code** button on GitHub → **Download ZIP** and unzip it.

**Steps**, in a terminal (on Windows: PowerShell or the terminal of your editor):

```bash
git clone https://github.com/umbra-code/prime-inventory.git   # skip if you downloaded the ZIP
cd prime-inventory        # the folder with package.json
npm install               # downloads the dependencies; takes a minute the first time
npm run dev               # starts the app
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. Leave the terminal open while you use it and press Ctrl+C there to stop it. Changes to the code show up in the browser as you save.

Nothing else has to be configured. The item catalog is generated on its own when the app starts, and your inventory is stored by the browser for that address, so the copy on `localhost` starts empty: use Export on the public site and Import here to bring your data. The only features that need setup are [Send to another device](#send-to-another-device) and [Sync between devices](#sync-between-devices); without it, they say they are not available and everything else works.

**If something fails**

- `npm` or `node` "is not recognized" / "command not found": Node.js is not installed, or the terminal was open before installing it. Install it and open a new terminal.
- An error about the Node version or unsupported syntax: update Node.js to 20.9 or newer.
- "Port 3000 is in use": another program is using it. Run `npm run dev -- -p 3001` and open `http://localhost:3001`.

## Deploying your own copy

The app is a regular Next.js project, so any host that runs Next.js works. With [Vercel](https://vercel.com/), which is free for personal, non-commercial projects:

1. Fork this repository on GitHub (the **Fork** button).
2. In Vercel, choose **Add New → Project**, import your fork and press **Deploy**. No settings need to change.
3. Optional, for "Send to another device": in the Vercel project, open **Storage**, create a **Blob** store with **Private** access and connect it to the project, then redeploy. See [Send to another device](#send-to-another-device).
4. Optional, for sync between devices: in **Storage**, create a **Neon** Postgres database (the free plan is enough) and connect it, then redeploy. See [Sync between devices](#sync-between-devices).

Things in the code that point to this deployment and should be changed in yours:

- `SITE_URL` in `src/lib/site.js`: the address used in link previews, `robots.txt` and `sitemap.xml`.
- `public/google*.html`: this site's Google Search Console verification; delete it.
- The GitHub links in `src/components/layout/Header.jsx` and `src/lib/buildVersion.mjs`, if you want them to point to your fork.
- `.github/workflows/update-data.yml` updates the Warframe data daily and releases on its own, following this repository's `development` → `master` flow (see [Releasing](#releasing)). Keep the two branches, or delete the workflow and update `@wfcd/items` by hand.

Warframe content belongs to Digital Extremes, whose [content policy](https://www.warframe.com/contentpolicy) asks fan projects to stay non-commercial: do not charge for access to your copy.

## Development

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

The script (`scripts/release.mjs`) pulls, runs lint and tests, asks for a title if none was given and for confirmation, creates the version commit and tag (both named like `2.9.0 · Prime Resurgence`), pushes `development` with the tag, waits for CI on that commit, and only if CI passes fast-forwards `master` to it and pushes. If CI fails for a reason unrelated to the code (a download error, an outage), re-run the job on GitHub and press Enter in the script to check again; do not run the release a second time, since the version already exists. If you stop there, the script prints the commands that finish the release by hand. It always switches back to `development`. Set `GITHUB_TOKEN` to raise the GitHub API rate limit while it waits for CI.

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
src/services/history.js     Change history: recording, grouping, undo/redo, storage
src/services/prices.js      Platinum prices: download, cache, matching to sets and parts
src/lib/transferCodec.js    Send to another device: compression, encryption and link format
src/services/transfer*.js   Its browser side (transfer.js) and Blob storage (transferStore.js)
src/app/api/transfer/       Its route handlers
src/lib/syncCodec.js        Sync between devices: pairing secret, derived id and key, encryption
src/services/sync*.js       Its browser side (sync.js) and database (syncStore.js)
src/context/SyncContext.jsx When it syncs, and the state shown by the header's cloud
src/app/api/sync/           Its route handler
src/i18n/                   UI strings, translator and language context
src/lib/itemNames.mjs       In-game item names per language (used by the catalog script)
src/context/InventoryContext.jsx  App state (state + stable actions contexts)
src/components/             UI (inventory cards, layout, shadcn/ui primitives)
src/test/                   Shared test fixtures
```

## License

MIT. See [LICENSE](LICENSE).

Warframe and all related content are trademarks of Digital Extremes Ltd. This project is not affiliated with Digital Extremes.
