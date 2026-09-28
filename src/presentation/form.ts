import { MAX_SERVICES, MIN_SERVICES } from '../domain/constants.ts';
import { parseClock } from '../domain/time.ts';

export function validateForm(input: {
  readonly selectedIds: readonly string[];
  readonly windowStart: string;
  readonly windowEnd: string;
}): string | null {
  if (input.selectedIds.length < MIN_SERVICES || input.selectedIds.length > MAX_SERVICES) {
    return 'دو یا سه خدمت انتخاب کنید.';
  }
  if (new Set(input.selectedIds).size !== input.selectedIds.length) {
    return 'خدمت‌ها باید متمایز باشند.';
  }

  const start = parseClock(input.windowStart);
  const end = parseClock(input.windowEnd);
  if (start == null || end == null) return 'ساعت شروع و پایان را وارد کنید.';
  if (start >= end) return 'پایان حضور باید بعد از شروع باشد.';
  return null;
}
