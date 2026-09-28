import { useScheduling } from '../use-scheduling.ts';
import { fieldClass } from '../styles.ts';

export function PresenceFields() {
  const windowStart = useScheduling((state) => state.windowStart);
  const windowEnd = useScheduling((state) => state.windowEnd);
  const setWindowStart = useScheduling((state) => state.setWindowStart);
  const setWindowEnd = useScheduling((state) => state.setWindowEnd);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4" aria-labelledby="presence-heading">
      <h2 id="presence-heading" className="text-base font-bold">
        بازه حضور
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="presence-start" className="mb-1 block text-sm font-medium">
            شروع حضور
          </label>
          <input
            id="presence-start"
            className={`${fieldClass} text-left`}
            dir="ltr"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="09:00"
            required
            value={windowStart}
            onChange={(event) => setWindowStart(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="presence-end" className="mb-1 block text-sm font-medium">
            پایان حضور
          </label>
          <input
            id="presence-end"
            className={`${fieldClass} text-left`}
            dir="ltr"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="14:00"
            required
            value={windowEnd}
            onChange={(event) => setWindowEnd(event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
