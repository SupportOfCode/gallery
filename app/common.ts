export function formatDate(value: Date): string {
  const date = new Date(value);
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Tháng bắt đầu từ 0
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}
