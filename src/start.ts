// Saturday 24 October 2026, 09:00 in London, as an API sends it (UTC).
// London is on summer time (UTC+1) until 02:00 on Sunday 25 October,
// when the clocks go back to 01:00 and London is on UTC+0 again.
export const FROM_API = "2026-10-24T08:00:00Z";
export const ZONE = "Europe/London";

// "Sun 09:00" style, always shown in London, whatever zone the process runs in.
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function inLondon(d: Date): string {
  return fmt.format(d).replace(",", "");
}
