export function normalizeUaPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const localDigits = digits.startsWith('380')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;

  return localDigits.slice(-9);
}

export function formatUaPhone(value: string): string {
  const digits = normalizeUaPhone(value);
  const areaCode = digits.slice(0, 2).padEnd(2, '_');
  const prefix = digits.slice(2, 5).padEnd(3, '_');
  const line = digits.slice(5, 9).padEnd(4, '_');
  return `+380 (${areaCode}) ${prefix} ${line}`;
}

export function formatCardName(firstName: string, lastName: string, locale: string): string {
  return [firstName.trim(), lastName.trim()]
    .filter(Boolean)
    .join(' ')
    .toLocaleUpperCase(locale);
}
