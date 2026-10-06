# Where the logic lives

Each feature (`scheduling`, `in-person-booking`) is a folder inside these layers. Dependencies point inward: presentation and composition call application, application calls domain. Domain imports none of them.

## Domain — the rules

`src/domain/<feature>`

Pure decisions. No React, no store, no API.

`isListedOnActiveBoard` hides a reserved service booking and any finished visit. `actionsFor` is what the screen may offer. `assertCancellationReason` requires a known reason. `findTopSchedules` ranks visit plans.

## Application — one action, in order

`src/application/<feature>`

Use cases call domain rules, then a repository. The repository is an interface the use case owns (`InPersonBookingRepository`). Scheduling still uses narrower interfaces for slots and the catalog (`CapacityPort`). This layer does not choose the in-memory API or render a button.

`createCancelInPersonBooking` loads the booking, asks the domain for the cancelled booking, then `repository.save`. `createListActiveInPersonBookings` asks the repository for rows and keeps only the ones the domain lists. `createScheduleSearch` drops a slow response when a newer search already won.

## Composition — which adapter implements a repository

`src/composition`

`in-person-booking.ts` builds the in-memory API and passes it into the use cases. `scheduling.ts` does the same for search and book. `container.ts` only returns both:

```ts
return {
  scheduling: createSchedulingContainer(options),
  inPersonBooking: createInPersonBookingContainer(),
};
```

A new feature adds its own file here and one field on `AppContainer`.

## Presentation — what the user sees and the screen state

`src/presentation`

`features/in-person-booking` holds the page, the Zustand store, and Persian error text. پذیرش and لغو render only when `actions` from the use case says so.

`features/scheduling` holds the planner form, results, and mock controls. `shared/` is cross-feature UI (`styles`, `StatusNotice`). `app/features.ts` is the screen list; `app/providers.tsx` mounts each feature store.

## One cancel, four stops

1. **Presentation** — لغو submits an order code and a reason. It does not decide if that booking may be cancelled.
2. **Application** — `cancel` loads the booking, asks the domain for the next state, then `repository.save`.
3. **Domain** — `assertAllowed` rejects a hidden booking. `assertCancellationReason` rejects an unknown reason.
4. **Composition** — the in-memory adapter stores `cancelled` and the reason. Another adapter could post the same command over HTTP without a change in the other three layers.
