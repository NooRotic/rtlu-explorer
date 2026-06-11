# RTLU Explorer

The public, static front-end for the **Rip The Lyrical Universe** project — a
transformative 3D map of the entities and references woven through hip-hop verse.

**The graph is the work. There are no lyrics here.** Every artifact this site
loads is an entity/relationship snapshot exported from a local, private
Hindsight knowledge graph. Lyrics are copyrighted; the network of people,
places, and references *about* them is transformative work, and that is all
this site ever ships.

## Architecture

This is the **public** half of a two-repo split:

| Repo | Visibility | Role |
|---|---|---|
| `RipTheLyricalUniverse` | private | source data, ingestion pipeline, **export script** |
| `rtlu-explorer` (this) | public | static viz, deployed to IONOS |

No live Hindsight process is ever exposed. The private repo's
`src/export-bank.js` is the only thing that talks to the graph; it writes
versioned JSON into this repo's `public/data/<artist>/`, and the site loads
those files. Nothing else crosses the boundary.

### Stack

- **Vite** + **React**
- Desktop (Phase 2+): **react-three-fiber** + **react-force-graph-3d** — a 3D
  force-directed galaxy per artist
- Mobile (Phase 3+): scrollytelling trailer that funnels toward desktop

> The interactive 3D viz is gated behind an art-direction sprint. The current
> landing page confirms the export pipeline is wired end-to-end and previews
> the snapshot. The galaxy lands in Phase 2.

## Data

`public/data/<artist>/` holds one snapshot per artist:

| File | Contents |
|---|---|
| `entities.json` | `{ id, name, type, artist_source, count, categories }` |
| `links.json` | `{ source, target, edge_type, weight }` |
| `bank-stats.json` | aggregate counts and breakdowns |
| `version.json` | snapshot provenance (date, totals) |
| `themes.json`, `wordplay-patterns.json`, `aliases.json` | curated views (populated in later phases) |

To regenerate, from the private `RipTheLyricalUniverse` repo with the bank running:

```bash
node src/export-bank.js --artist wu-tang-clan --output ../rtlu-explorer/public/data/wu-tang-clan
```

## Develop

```bash
pnpm install
pnpm dev        # local dev server
pnpm build      # static build into dist/
pnpm preview    # serve the production build locally
```

## Deploy

Static build (`dist/`) is deployed manually to IONOS Webhosting after each new
artist snapshot or visualization change.

## License

MIT © NooRotic

## Disclaimer

This is an **unofficial fan tribute** and is **not affiliated with, authorized, or endorsed by Wu-Tang Clan** or its members. The Wu-Tang name and "W" mark are trademarks of their respective owners and are used here for identification in a noncommercial, transformative work. The site contains no song lyrics — only entity names, reference counts, and co-occurrence weights derived from a private analysis pipeline.
