import { useScheduling } from "../../hooks";

import { PresenceTimeField } from "./PresenceTimeField.tsx";

export function PresenceWindowFields() {
  const windowStart = useScheduling((state) => state.windowStart);
  const windowEnd = useScheduling((state) => state.windowEnd);
  const setWindowStart = useScheduling((state) => state.setWindowStart);
  const setWindowEnd = useScheduling((state) => state.setWindowEnd);

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4"
      aria-labelledby="presence-heading"
    >
      <h2 id="presence-heading" className="text-base font-bold">
        بازه حضور
      </h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <PresenceTimeField
          id="presence-start"
          label="شروع حضور"
          placeholder="09:00"
          value={windowStart}
          onChange={setWindowStart}
        />
        <PresenceTimeField
          id="presence-end"
          label="پایان حضور"
          placeholder="14:00"
          value={windowEnd}
          onChange={setWindowEnd}
        />
      </div>
    </section>
  );
}
