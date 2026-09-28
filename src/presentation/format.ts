const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function persianDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => {
    const index = Number(digit);
    return PERSIAN_DIGITS[index] ?? digit;
  });
}

export function serviceTitle(services: readonly { id: string; title: string }[], serviceId: string): string {
  return services.find((service) => service.id === serviceId)?.title ?? serviceId;
}
