export function formatDate(value: Date): string {
  const date = new Date(value);
  date.setDate(date.getDate() + 1);
  date.setMonth(date.getMonth());
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${year}-${month}-${day}`;
}

export function parseDate(value: string): Date | null {
  const [dayStr, monthStr, yearStr] = value.split("-");
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);

  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 0 ||
    month > 11 ||
    year < 1000
  ) {
    return null;
  }

  return new Date(Date.UTC(year, month, day));
}
