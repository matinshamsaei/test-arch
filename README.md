# Multi-service visit planner

A single-page planner for booking **two or three medical services on the same day**, in a **fixed order**, inside a **presence window**. The product returns at most **three valid itineraries**, ranked by how early the visit finishes and how little idle time it leaves, then books one of them atomically.

The planning day is fixed to `2026-10-03` in `Asia/Tehran`. All times are local, minute-precise.

This README is the decision record for the task: what the product does, how the code is structured, why the search algorithm is exhaustive rather than heuristic, and what those choices cost in time and memory. For the dependency graph, see [`project-structure.puml`](project-structure.puml) alongside this document.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm test` covers ranking rules, the mock contract, stale search responses, capacity conflicts, and the path from selection to booking. Worst-case search time is printed with a `[bench]` tag.

## Product rules

The user supplies:

1. Two or three **distinct** services, in visit order.
2. A presence window (start and end clock times).

A schedule is valid only if:

- each slot matches the requested service in that position
- remaining capacity is greater than zero
- every slot lies fully inside the presence window
- consecutive slots respect travel/buffer rules:
  - **10 minutes** when both slots are in the same clinic
  - **30 minutes** when clinics differ
  - equality with the bound is allowed

Ranking among valid schedules:

1. Earlier last-slot end time.
2. Then smaller total gap (sum of idle minutes between consecutive slots only).
3. Then ASCII order of slot ids, so ranking is stable even if the input list is shuffled.

At most three schedules are shown. Booking is all-or-nothing: if any chosen slot has no capacity, none of them are decremented.

### Sample ranking

For `S1 → S2 → S3` and `09:00–14:00`:

| Rank | Slots      | Ends  | Total gap |
| ---- | ---------- | ----- | --------- |
| 1    | a2, b1, c1 | 10:55 | 20 min    |
| 2    | a3, b3, c2 | 11:20 | 30 min    |
| 3    | a2, b1, c2 | 11:20 | 45 min    |

`a2, b3, c2` also ends at 11:20 with 45 minutes of gap; it stays out of the top three because of slot-id order. If `c1` has zero capacity, rank 1 becomes `a3, b3, c2`. The window `09:00–10:50` yields no schedule.

## Architecture (Clean Architecture)

Dependencies point **inward**. Domain rules do not import React, the DOM, Zustand, or the mock API. Presentation never calls infrastructure directly. Wiring lives in one composition root.

| Layer          | Path                           | Responsibility                                                                                  |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Domain         | `src/domain`                   | Slot eligibility, clinic gaps, exhaustive search, ranking. Pure functions, no I/O, no UI state. |
| Application    | `src/application`              | Use cases (`search`, `book`), outbound ports, stale-request handling via a request id.          |
| Infrastructure | `src/infrastructure`           | In-memory mock: latency, independent snapshot copies, atomic booking, scenario modes.           |
| Presentation   | `src/presentation`             | Form, page phases, results, mock controls, Zustand store.                                       |
| Composition    | `src/composition/container.ts` | Instantiates the mock API and use cases; `src/main.tsx` injects them into React.                |

**How to read the diagram:** open `[project-structure.puml](project-structure.puml)`. Arrows point toward the dependency. Domain sits at the center; the mock implements ports; the store talks to use cases, not to slot arrays or HTTP.

### Why this split

- **Rules can be tested without rendering.** Ranking, gaps, and query validation live in domain tests. The mock contract and stale-response behavior live in application/infrastructure tests. UI tests only cover what the user can see and click.
- **The backend can change without rewriting ranking.** Today the adapter is in-memory. An HTTP client that implements `CatalogPort`, `CapacityPort`, and `BookingPort` would reuse the same search and book use cases. HTTP 409 maps to `SLOT_UNAVAILABLE` only once a real transport exists; the domain does not know about status codes.
- **Stale UI is an application concern.** The mock does not cancel in-flight reads. `createScheduleSearch` increments a request id so a slower first search cannot overwrite a newer result. The store has a parallel epoch for user-driven resets.
- **UI state stays out of the domain.** Catalog, form fields, phase, selected itinerary, and receipt live in Zustand. Domain functions remain stateless. Context only injects the store instance; it is not a second business layer.

This is Clean Architecture scaled to one screen: ports and adapters, a composition root, and a domain that would still be valid if the UI were replaced.

## Search algorithm

**Name:** exhaustive depth-first search with gap pruning and a bounded top-3 buffer. Not greedy, not DP, not a shortest-path graph.

### How it runs

1. **Validate the query** (`assertQuery`): service count in `{2, 3}`, distinct ids, window end after start.
2. **Filter** (`eligibleSlots`): one list per requested service. Drop slots with wrong service, zero capacity, inverted times, or any part outside the window.
3. **Search** (`searchLevel`): recurse in service order. After picking a slot, require `next.start − previous.end ≥ requiredGap(clinicA, clinicB)`. If not, skip that branch (prune).
4. **Rank** (`toRanked` / `insertTop`): a complete path becomes a candidate. Insert it into a buffer of size `MAX_SCHEDULES = 3`. Duplicates (same slot-id sequence) are ignored.

Entry point: `findTopSchedules` in `src/domain/scheduling/services/index.ts`.

| Step           | File                                                | Function                |
| -------------- | --------------------------------------------------- | ----------------------- |
| Orchestrate    | `src/domain/scheduling/services/index.ts`           | `findTopSchedules`      |
| Validate       | `src/domain/scheduling/services/assert-query.ts`    | `assertQuery`           |
| Filter         | `src/domain/scheduling/services/eligible-slots.ts`  | `eligibleSlots`         |
| DFS + prune    | `src/domain/scheduling/services/search-level.ts`    | `searchLevel`           |
| Score + keep 3 | `src/domain/scheduling/services/ranked-schedule.ts` | `toRanked`, `insertTop` |
| Compare        | `src/domain/scheduling/utils/compare.ts`            | `compareSchedules`      |
| Gap rule       | `src/domain/scheduling/utils/required-gap.ts`       | `requiredGapMinutes`    |

Use-case wrapper: `src/application/use-cases/search-schedules.ts` loads a capacity snapshot, then calls `findTopSchedules`. Booking is a separate use case; it does not re-run ranking.

### Why not a heuristic

“Always take the earliest next slot” is cheaper and wrong. An early slot in the middle service can force a late last slot, or a larger total gap. The product asks for the **true** top three, not a plausible three. With at most three services and a practical cap around 50 eligible slots per service, exhaustive search is both correct and cheap enough to run on the UI thread after the snapshot arrives.

Gap pruning is not an extra heuristic; it is the same clinic-buffer rule the product already requires. Branches that could never be booked are never ranked.

### Complexity

Let:

- `N` = slots in the snapshot
- `k` = number of requested services (`2` or `3`)
- `gᵢ` = eligible slots for service `i` after filtering
- `P = g₁ · g₂ · … · gₖ` = complete combinations if nothing is pruned

| Phase                         | Time                                   | Extra memory       |
| ----------------------------- | -------------------------------------- | ------------------ |
| Filter                        | `O(kN)`                                | `O(Σ gᵢ)` ≤ `O(N)` |
| Search (worst case, no prune) | `O(g₁ + g₁g₂ + … + P)`                 | recursion `O(k)`   |
| Rank each complete candidate  | `O(k)` per candidate; buffer size is 3 | `O(1)` for results |

Dominant term: `**O(kN + kP)**`. With `k ≤ 3` that is `**O(N²)**` for two services and `**O(N³)**` for three.

Worst-case evaluation bound used in the bench: `50³ = 125_000` combinations. Result memory is constant because only three ranked schedules are kept. On this machine, that exhaustive case has typically finished in tens of milliseconds in `npm test` (see the `[bench]` line). That is below the mock’s 300 ms slot-read delay, which is why search runs on the same thread after the snapshot; a Worker would be the next step if `n` grew well past 50, not a switch to an approximate algorithm.

## Mock data and scenarios

Base data lives in `sample-data.json`. Scenario controls are at the bottom of the page under **Mock control**. Changing a mode resets that mode’s counters. **Reset data** restores capacity, booking sequence, and mode without clearing the form.

| Mode                 | Mock                                             | App                                                                      |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Normal               | Slots 300 ms, book 500 ms                        | Show results; successful book                                            |
| Out of order         | First search 1500 ms, second 200 ms, then 300 ms | Newest search wins; a late response does not replace it                  |
| Transient read error | Next slot read fails, the one after succeeds     | Error + retry; form inputs stay                                          |
| Capacity conflict    | At book time, `c1` capacity becomes 0            | `SLOT_UNAVAILABLE`; `a2` and `b1` are not decremented; search runs again |

Out-of-order check: select the mode, search `S1, S2, S3` with `09:00–14:00`, then change the end to `10:50` and search again before the first response. The UI should end with no schedules.

The mock is behavioral, not HTTP. Snapshots are independent copies. Booking is atomic. Ports keep a later `fetch` adapter from leaking into domain or UI.

## Tooling choices

| Choice                                   | Reason                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Vite                                     | One page, no SEO requirement, fast local loop.                                                                                       |
| Tailwind                                 | UI styling without a component library tax.                                                                                          |
| Vitest                                   | Same toolchain as the build; domain tests stay cheap.                                                                                |
| Zustand (vanilla store + React bindings) | Page-local state; the store is testable without rendering. Redux would add actions/reducers without a second screen to justify them. |
| In-memory mock, not MSW                  | The brief is latency, copies, all-or-nothing book, and `SLOT_UNAVAILABLE` — not a wire protocol.                                     |
| No router                                | Single screen.                                                                                                                       |

Domain has no runtime state. Mock capacity lives in infrastructure for the lifetime of the page. Presentation holds what the user is looking at.
