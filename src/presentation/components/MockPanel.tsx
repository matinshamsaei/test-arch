import type { MockMode } from "../../application/ports/index.ts";
import { useScheduling } from "../hooks";
import { secondaryButtonClass } from "../styles.ts";

const MODES: readonly { mode: MockMode; label: string; hint: string }[] = [
  {
    mode: "normal",
    label: "عادی",
    hint: "دریافت نوبت‌ها حدود ۳۰۰ میلی‌ثانیه و ثبت حدود ۵۰۰ میلی‌ثانیه طول می‌کشد.",
  },
  {
    mode: "out-of-order",
    label: "پاسخ خارج از ترتیب",
    hint: "جستجوی اول ۱۵۰۰ و دومی ۲۰۰ میلی‌ثانیه است. با بازه ۰۹:۰۰–۱۴:۰۰ جستجو کنید، قبل از رسیدن پاسخ پایان را ۱۰:۵۰ بگذارید و دوباره جستجو کنید. نتیجه نهایی باید بدون برنامه بماند.",
  },
  {
    mode: "transient-error",
    label: "خطای موقت دریافت",
    hint: "دریافت بعدی خطا می‌دهد و دریافت بعد از آن موفق است. ورودی‌ها حفظ می‌شوند.",
  },
  {
    mode: "capacity-conflict",
    label: "تعارض ظرفیت",
    hint: "هنگام ثبت، ظرفیت c1 صفر می‌شود. برنامه اول (a2, b1, c1) را انتخاب و ثبت کنید.",
  },
];

export function MockPanel() {
  const mockMode = useScheduling((state) => state.mockMode);
  const phase = useScheduling((state) => state.phase);
  const setMockMode = useScheduling((state) => state.setMockMode);
  const resetData = useScheduling((state) => state.resetData);

  const locked = phase === "booking";
  const hint = MODES.find((item) => item.mode === mockMode)?.hint;

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
          {MODES.map((item) => (
            <label
              key={item.mode}
              className="flex min-h-11 cursor-pointer items-center gap-3"
            >
              <input
                type="radio"
                name="mock-mode"
                className="size-4 accent-teal-800"
                checked={mockMode === item.mode}
                onChange={() => setMockMode(item.mode)}
              />
              {item.label}
            </label>
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
