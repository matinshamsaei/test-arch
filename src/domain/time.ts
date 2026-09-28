const CLOCK = /^(\d{2}):(\d{2})(?::\d{2})?$/;

export function parseClock(value: string): number | null {
  const match = CLOCK.exec(value.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function formatClock(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
