import type { MockMode } from "@application/scheduling/ports";

export type MockModeDefinition = {
  mode: MockMode;
  label: string;
  hint: string;
};

export const MOCK_MODE_OPTIONS: readonly MockModeDefinition[] = [
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
