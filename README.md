# @deutschemodelunitednations/world-countries

A **drop-in replacement** for [`world-countries`](https://www.npmjs.com/package/world-countries) that layers DMUN-maintained **data corrections** on top of the upstream dataset.

It exists because `world-countries` merges data fixes to `main` but is slow to cut npm releases — so corrections we need can sit unpublished for a long time. This package lets us ship those corrections now, across all our repos, **without forking the dataset**.

## Why not a fork?

Because this keeps `world-countries` as a **peer dependency** and re-exports it at runtime with corrections applied. We never copy or vendor the dataset. That means:

- **Upstream updates flow through automatically.** New countries, changed fields, and fixes land the moment *your* project updates its own `world-countries` install — **no release of this wrapper required**.
- **No data-license entanglement.** The country data stays in the peer dependency under its own license; this package ships only our small correction layer (MIT).

## Install

```sh
npm install @deutschemodelunitednations/world-countries world-countries
```

`world-countries` is a peer dependency — install it alongside this package (most projects already depend on it).

## Usage

Change the import path; everything else stays the same.

```ts
// before
import countries from 'world-countries';

// after
import countries from '@deutschemodelunitednations/world-countries';

const eswatini = countries.find((c) => c.cca3 === 'SWZ');
eswatini?.translations.deu.common; // -> "Eswatini" (upstream still ships "Swasiland")
```

Types are re-exported too:

```ts
import type { Country } from '@deutschemodelunitednations/world-countries';
```

## The correction model

Corrections live in [`src/corrections.ts`](./src/corrections.ts). There are two kinds:

### Guarded corrections (self-healing)

A guarded correction **only applies while upstream still ships a specific wrong value**:

```ts
{
  kind: 'guarded',
  cca3: 'SWZ',
  locale: 'deu',
  field: 'common',
  whenUpstreamIs: 'Swasiland', // apply only while upstream says this
  replaceWith: 'Eswatini',
  reason: 'Renamed in 2018; upstream still ships the old German name.'
}
```

The instant `world-countries` changes that field — to the fix or anything else — the guard stops matching and the **upstream value passes through untouched**. The correction deactivates itself with no release of this package.

A test (`test/corrections.test.ts`) asserts each guard is *still needed*. When upstream finally fixes the value, that test **turns red** — your signal to delete the now-dead entry. The CI workflow also re-runs weekly against `world-countries@latest`, so an upstream fix is noticed even without any code change here.

### Sticky overrides (intentional)

A sticky override is applied **regardless** of upstream — for deliberate house-style choices, not bugs:

```ts
{
  kind: 'sticky',
  cca3: 'XXX',
  locale: 'deu',
  field: 'common',
  value: 'Our preferred name',
  reason: 'Deliberate deviation we always want.'
}
```

## Adding a correction

1. Add an entry to the `corrections` array in `src/corrections.ts`.
2. Run `npm test` — a guarded entry must currently match `whenUpstreamIs`, or the test tells you it is already obsolete.
3. Open a PR; publish a new version once merged.

## Removing a correction

When the guarded test for an entry fails (upstream caught up), delete that entry and publish a patch release. Consumers drop the correction on their next bump.

## Development

```sh
npm install
npm run typecheck
npm test
npm run build
```

## Publishing

> The `@deutschemodelunitednations` scope must exist on npm and you must be a member with publish rights. Scopes are free for public packages.

```sh
npm version patch   # or minor / major
npm publish         # publishConfig.access is already "public"
git push --follow-tags
```

## License

MIT — see [LICENSE](./LICENSE). The country data itself is provided by the `world-countries` peer dependency under its own license.
