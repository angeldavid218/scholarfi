export function formatRelativeDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return date.toISOString();
  const diffMs = date.getTime() - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (Math.abs(diffMs) < hour)
    return rtf.format(Math.round(diffMs / minute), "minute");
  if (Math.abs(diffMs) < day)
    return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}
