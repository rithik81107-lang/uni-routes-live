# SmartWaste AI

A modern, mobile-friendly web app that helps communities tackle improper waste disposal:
scan waste with AI, report dumping sites, find nearby bins and recycling centres, and
track each cleanup from **Submitted → Verified → Assigned → Cleaning → Resolved**.

## Tech stack

- **TanStack Start v1** (React 19, file-based routing, server functions) on Vite 8
- **Tailwind CSS v4** with a semantic eco-green design-token theme (light/dark)
- **shadcn/ui** (Radix) components, **lucide-react** icons, **sonner** toasts
- **Lovable AI Gateway** (`openai/gpt-6-astra`) for image-based waste classification
- **Google Maps JavaScript API** for the live map (graceful list fallback without a key)
- Demo state persists in `localStorage` — no login required, works offline

## Architecture

```
src/
├── routes/            TanStack file routes (one file per screen)
│   ├── __root.tsx         app shell metadata, fonts, <Toaster/>
│   ├── index.tsx          Home: 4 action cards, impact stats, recent reports
│   ├── scan.tsx           AI Waste Scanner (camera/upload + classification)
│   ├── report.tsx         Report form (photo, category, location, description)
│   ├── map.tsx            Nearby bins / recycling centres / reported spots
│   ├── reports.index.tsx  My Reports list (search + status filters)
│   ├── reports.$reportId.tsx  Report detail: status track, timeline, advance
│   └── profile.tsx        Local profile, impact dashboard, reset demo data
├── components/
│   ├── AppShell.tsx       responsive nav, notification bell, theme toggle,
│   │                      store hydration + 2.5s lifecycle tick
│   ├── WasteMap.tsx       Google Maps loader, place/report markers, fallback
│   ├── report-ui.tsx      StatusBadge, StatusTrack, ReportCard
│   └── Markdown.tsx       safe markdown renderer
├── lib/
│   ├── waste.ts           domain store: types, categories, demo seed data,
│   │                      localStorage hydration, lifecycle actions, stats,
│   │                      geodesic distance, image compression
│   ├── scan.functions.ts  server function `classifyWaste` (AI endpoint)
│   └── ai.server.ts       server-only AI Gateway client (SSE, JSON schema)
├── start.ts               request middleware: error handler + CSRF (serverFn)
└── server.ts              workerd entry; recovers SSR 500s swallowed by h3
```

Data flow: routes read state via `useSyncExternalStore` in `waste.ts`; mutations
(`createReport`, `advanceReport`, `markNotificationsRead`, …) update the store and
broadcast to every mounted component. `AppShell` ticks the clock that auto-advances
reports through the status pipeline (8s/10s/12s/14s per transition) and emits
notifications at each step.

## API endpoints

### `POST classifyWaste` (TanStack server function, `src/lib/scan.functions.ts`)

Internal server function — called from `scan.tsx`; not a public HTTP route.

| | |
|---|---|
| **Input** (zod-validated) | `{ image: string }` — a compressed JPEG data URL, 32–6,000,000 chars (≤ ~4.5 MB binary) |
| **Output** | `ScanResult { category: "plastic"\|"paper"\|"glass"\|"metal"\|"food"\|"ewaste"\|"mixed", item: string, confidence: number (0–1), unclear: boolean, disposal: string, tips: string[], recyclable: boolean }` |
| **Behaviour** | Dynamically imports the server-only `ai.server.ts` client, sends text + `input_image` to `openai/gpt-6-astra` on the Lovable AI Gateway with a strict JSON schema, clamps `confidence` to [0,1] and caps `tips` at 4 |
| **Errors** | Model/gateway failures surface as a friendly toast in the UI; the scanner then offers manual category selection (the `unclear` path) |

Client-side image compression (canvas → JPEG, ~1280px max edge) happens before the
call so uploads stay small and fast.

## Data model ("database schema")

The demo build persists to `localStorage` (key `smartwaste-ai:v1`); shapes below are
the contract for a future cloud migration.

### `WasteReport`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | unique report ID, e.g. `SW-XXXXXX` |
| `category` | one of 7 categories | see `WASTE_CATEGORIES` |
| `locationName` | `string` | free-text or reverse-geocoded label |
| `lat`, `lng` | `number` | geolocation or jittered city-centre default |
| `description` | `string` | user note |
| `photo` | `string \| null` | compressed data URL |
| `status` | `submitted → verified → assigned → cleaning → resolved` | see `REPORT_STATUSES` |
| `createdAt`, `statusUpdatedAt` | ISO timestamp | drives timeline + auto-advance |
| `notifiedStatuses` | `string[]` | prevents duplicate notifications |

### `AppNotification`

`{ id, title, message, reportId?, status?, read, createdAt }` — one per lifecycle
transition the user has already seen.

### `Profile`

`{ name, email, area }` plus derived impact stats on the Profile screen.

### Seeded demo data

- `Place[]` — bins, recycling centres and compost points around Kolkata
  (`{ id, kind: "bin"\|"recycling"\|"compost", name, area, lat, lng }`)
- Seeded `WasteReport[]` in mixed statuses so lists, map and stats are populated
- `IMPACT_STATS` derived live: reports submitted/resolved, waste collected,
  recycling locations

## Error handling & boundaries

Three coordinated layers, plus guidance for React error boundaries:

1. **Server-function errors** — `src/start.ts` wraps every request with
   `errorMiddleware`: known framework errors rethrow; anything unexpected is logged
   with full stack/cause chain and rendered as a friendly HTML page (`error-page.ts`).
   A CSRF middleware guards serverFn RPCs.
2. **SSR 500 normalisation** — `src/server.ts` detects h3 responses that swallow a
   throw into a bodyless `{"unhandled":true}` 500 and re-renders the error page with
   the real cause.
3. **Error capture** — `src/lib/error-capture.ts` wraps `console.error` and hooks
   `error`/`unhandledrejection` so the original `Error` (stack + cause chain, depth
   ≤ 5, 8 KB cap) is recoverable even when the framework serialises only a message.
4. **React error boundaries** — not yet wired per-route. Recommended pattern: a
   `RouteErrorBoundary` component that catches render errors, reports via
   `console.error` (so layer 3 captures it) and offers Reset/Reload, wrapped around
   each route's component via `errorComponent` on the route definition.

## Testing strategy

No unit-test runner is wired into the build yet. Recommended setup (kept out of the
production bundle):

```sh
bun add -d vitest
```

- **Unit-test targets (pure, framework-free — highest value first):**
  - `waste.ts`: `advanceReport` order and delays, `deriveImpact` totals,
    `haversine`/`distanceKm` edge cases (same point, antipodes), `relativeTime`
    boundaries, notification de-duplication via `notifiedStatuses`,
    `compressImage` output type/size caps
  - `scan.functions.ts`: zod `ScanInput` accepts/rejects boundaries (empty, >6 MB)
  - localStorage hydration: corrupt/missing JSON must fall back to seed data
- **Example test:**

```ts
// src/lib/waste.test.ts
import { describe, expect, it } from "vitest";
import { distanceKm } from "./waste";

describe("distanceKm", () => {
  it("returns 0 for the same point", () => {
    expect(distanceKm(22.57, 88.36, 22.57, 88.36)).toBeCloseTo(0, 5);
  });
  it("computes a sane city distance", () => {
    expect(distanceKm(22.57, 88.36, 22.62, 88.43)).toBeGreaterThan(5);
    expect(distanceKm(22.57, 88.36, 22.62, 88.43)).toBeLessThan(15);
  });
});
```

Run with `bunx vitest run`. Store-backed tests should reset the store module's
internal cache between cases (export a `__resetForTests()` or use `vi.resetModules`).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | dev server (http://localhost:8080) |
| `npm run build` | production build |
| `npm run lint` / `npm run format` | ESLint / Prettier |
