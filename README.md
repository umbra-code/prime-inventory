# Prime Inventory

A Warframe Prime parts tracker. Count the parts you own, see which sets are ready to build, and keep track of what you have mastered. Your inventory never leaves your browser.

## Features

- **Inventory at a glance:** every Prime set with its parts, owned vs. required counts and a progress bar.
- **Mastery tracking:** mark sets as mastered; sets you can build again show up as extra sets.
- **Build and Sell:** consume a full set of parts in one click (Build also marks the set as mastered).
- **Search and filters:** by name, category and status (Buildable, Incomplete, Mastered, Extra Sets).
- **Backups:** export your inventory to a small JSON file and import it on any device. Backups from older versions of the app are still accepted.
- **Light and dark themes:** follows your system setting by default.

## How data works

- **Your inventory** (part counts and mastered sets) is stored in `localStorage`. Nothing is sent to a server.
- **The item catalog** comes from [`@wfcd/items`](https://github.com/WFCD/warframe-items):
  1. A slim catalog (`src/data/primes.json`) is generated at build time and bundled with the app, so it is always available.
  2. Once a day the app checks jsDelivr for a newer `@wfcd/items` release. If there is one, it downloads it and caches it in the browser, so new Primes appear without redeploying.
  3. If the check fails (offline, network errors), the app keeps using the cached or bundled catalog.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) and React 19
- Tailwind CSS 4 with [shadcn/ui](https://ui.shadcn.com/) components
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
| `npm run build` | Regenerate the catalog and build for production |
| `npm run start` | Serve the production build |
| `npm run catalog` | Regenerate `src/data/primes.json` from the installed `@wfcd/items` |
| `npm run lint` | Run ESLint |

To pick up new Primes in the bundled catalog, update the package and regenerate:

```bash
npm install -D @wfcd/items@latest
npm run catalog
```

## Project structure

```
scripts/build-catalog.mjs   Generates the bundled catalog
src/data/primes.json        Bundled catalog (generated, committed)
src/lib/slimCatalog.mjs     Raw @wfcd/items data -> app catalog (shared by build and browser)
src/services/catalog.js     Catalog selection and daily refresh
src/services/userInventory.js  User data reducer, storage, migrations, backups
src/context/InventoryContext.jsx  App state (state + stable actions contexts)
src/components/             UI (inventory cards, layout, shadcn/ui primitives)
```

## License

MIT. See [LICENSE](LICENSE).

Warframe and all related content are trademarks of Digital Extremes Ltd. This project is not affiliated with Digital Extremes.
