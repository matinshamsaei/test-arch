# Architecture Overview

## Goals

- Keep **business rules** independent of React, HTTP, and UI libraries.
- Make features **testable** without rendering screens or hitting real APIs.
- Allow **transport and UI platform changes** without rewriting core behavior.

## Dependency rule

Dependencies point **inward**:

```text
Presentation  →  Application  →  Domain
Composition   →  Application + Infrastructure (wiring only)
Infrastructure → Application ports / Domain types (adapters)
```

- **Domain** imports nothing from presentation, application orchestration, infrastructure.
- **Application** depends on domain and on **ports** (interfaces) it owns; it does not know which adapter is plugged in.
- **Presentation** talks to application through use cases / containers, never to HTTP clients or adapters directly.
- **Composition** is the only place that chooses concrete adapters and injects them into use cases.

Features are sliced **vertically** across layers. Each feature appears as a folder under domain, application, and (where needed) infrastructure; presentation groups UI by feature inside its own structure below.

---

## Layers — what each one handles

### Domain (`src/domain`)

**Owns pure business meaning.** No React, no store, no fetch, no Dependency, no env vars.

| Responsibility | Examples of what lives here |
| --- | --- |
| Types and models | Booking status, kind, cancellation reasons, schedules, slots, presence windows |
| Invariants and rules | Who may appear on the active board, which actions are allowed, valid cancellation reasons, visit-order / gap rules |
| Pure domain services | Ranking and search algorithms, eligibility filters, comparisons |
| Domain errors | Rule violations that mean “this operation is not allowed in the business sense” |

**Guideline:** put as much typing and rule vocabulary as possible in domain so outer layers speak the same language.

Domain answers *“is this valid / allowed / ranked correctly?”* — not *“how do we call the API?”* or *“what does the button look like?”*.

### Application (`src/application`)

**Owns use cases and orchestration.** One use case ≈ one user intention, executed in order.

| Responsibility | Examples of what lives here |
| --- | --- |
| Use cases | Search schedules, book schedule, list active bookings, complete booking, cancel booking |
| Outbound ports / repository contracts | Catalog, capacity, booking, mock control; in-person booking repository |
| Application-level concerns | Stale-request / race handling, loading then applying a domain transition, then saving |
| Application errors | Failures that belong to the workflow, not to UI copy |

Use cases call domain rules, then persist or load through ports. They do **not** choose in-memory vs HTTP, and they do **not** render UI.

Application answers *“in what order do we load, decide, and save?”*.

### Infrastructure (`src/infrastructure`)

**Owns the outside world.** Implements application ports.

| Responsibility | Examples of what lives here |
| --- | --- |
| Adapters | HTTP adapters for real backends |
| Transport | HTTP client, auth token attachment, base URL handling |
| Mapping | DTO / API payload ↔ domain types |
| Infra utilities | Artificial latency, dataset loading, response helpers |

Infrastructure answers *“how do we talk to storage or the network?”*. Domain and application stay unchanged when swapping memory ↔ HTTP.

### Composition (`src/composition`)

**Owns wiring only.** Not a business layer.

| Responsibility | Examples of what lives here |
| --- | --- |
| Build feature containers | Wire adapters into use cases for scheduling and in-person booking |
| Transport selection | Memory vs HTTP based on config / env |

Composition answers *“which concrete implementation does this run use?”*.

### Presentation (`src/presentation`)

**Owns what the user sees and how the screen talks to the rest of the app.**

| Responsibility | Examples of what lives here |
| --- | --- |
| Screens and feature UI | Forms, lists, results, controls, page layout composition |
| Screen / feature state | Local UI state that is not a business rule |
| User-facing copy and formatting | Messages, labels, display formatting |
| Form validation for UX | Field-level checks before calling a use case |
| Server-state hooks (via services) | Wrappers that call use cases |

Presentation answers *“what does the user interact with, and how is loading/error/success shown?”*. It must not embed domain invariants or call infrastructure directly.

---

## Presentation structure (decided shape)

Presentation is organized as a **layered shell** with a **feature-based** interior:

```text
src/presentation/
  pages/         # route-level page composition (thin)
  components/        # cross-feature UI primitives used only in presentation
  containers/    # feature-based UI ownership
  services/      # bridge between containers and inner layers
  types/         # shared types used in presentation
  utils/         # shared utilities used in presentation
  hooks/         # shared hooks used in presentation
  styles/        # shared styles used in presentation
  constants/     # shared constants used in presentation
  ...            # other shared resources used in presentation
```

## Platform decision

Until we are forced to vendor or re-implement them locally, we **reuse the same Synapse packages and patterns as Physician Panel**:

| Package | Role in this project |
| --- | --- |
| `@synapse/query` | Server-state boundary in presentation `services/` (queries, mutations, cache) |
| `@synapse/design-system` | Base UI components, shared UI hooks/utilities exposed |
| `@synapse/form` | Form state and validation flows in presentation |
| `@synapse/map` | Map-related UI when a feature needs geospatial UI |

**Decision:** one shared frontend platform across physician and OMS; faster delivery; consistent UX; no parallel design system or query layer.

**Boundary:** Synapse stays at the **presentation** edge (containers, services, shared UI). Domain, application, and infrastructure remain Dependency-free.

---

## How concerns are split (quick reference)

| Concern | Layer |
| --- | --- |
| Business types, statuses, allowed actions | Domain |
| Ranking, eligibility, cancellation/completion transitions | Domain |
| “Load → apply rule → save” workflows | Application |
| Port / repository interfaces | Application |
| HTTP, auth headers, DTO mapping, mocks | Infrastructure |
| Choosing memory vs HTTP and injecting use cases | Composition |
| Screens, feature components, UX validation, copy | Presentation `containers/` |
| Hooks calling use cases | Presentation `services/` |
| Design-system, form, map primitives | Presentation only |
