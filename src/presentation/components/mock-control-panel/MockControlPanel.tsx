import { useScheduling } from "../../hooks";
import { secondaryButtonClass } from "../../styles.ts";

import { MOCK_MODE_OPTIONS } from "./mock-mode-options.ts";
import { MockModeOption } from "./MockModeOption.tsx";

export function MockControlPanel() {
  const mockMode = useScheduling((state) => state.mockMode);
  const phase = useScheduling((state) => state.phase);
  const setMockMode = useScheduling((state) => state.setMockMode);
  const resetData = useScheduling((state) => state.resetData);

  const locked = phase === "booking";
  const hint = MOCK_MODE_OPTIONS.find((item) => item.mode === mockMode)?.hint;

  return (
    <section
      className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4"
      aria-labelledby="mock-heading"
    >
      <h2 id="mock-heading" className="text-base font-bold">
        کنترل Mock
      </h2>

      <fieldset className="mt-3 border-0 p-0" disabled={locked}>
        <legend className="text-sm text-stone-700">حالت داده</legend>

        <div className="mt-2 flex flex-col gap-2">
          {MOCK_MODE_OPTIONS.map((item) => (
            <MockModeOption
              key={item.mode}
              mode={item.mode}
              label={item.label}
              checked={mockMode === item.mode}
              onSelect={() => setMockMode(item.mode)}
            />
          ))}
        </div>
      </fieldset>

      {hint && <p className="mt-3 text-sm leading-6 text-stone-700">{hint}</p>}

      <button
        type="button"
        className={`${secondaryButtonClass} mt-3`}
        disabled={locked}
        onClick={() => void resetData()}
      >
        بازنشانی داده‌ها
      </button>
    </section>
  );
}
