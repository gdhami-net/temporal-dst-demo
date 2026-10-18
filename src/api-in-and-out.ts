import { FROM_API, ZONE } from "./start.ts";

// In: the API sends an instant, the user's profile holds a zone ID.
const instant = Temporal.Instant.from(FROM_API);
const start = instant.toZonedDateTimeISO(ZONE);

// The arithmetic happens on the zoned value...
const next = start.add({ days: 1 });

// ...and what goes back to storage is an instant plus the zone ID.
const row = { at: next.toInstant().toString(), zone: next.timeZoneId };
console.log("store     ", JSON.stringify(row));
console.log("as JSON   ", JSON.stringify({ next }));

// Code that still wants a Date can have one, and give one back.
const legacy = new Date(next.epochMilliseconds);
console.log("Date      ", legacy.toISOString());
console.log("and back  ", legacy.toTemporalInstant().toString());

// An offset alone is not a zone: from() refuses a string with no [Zone/ID].
try {
  Temporal.ZonedDateTime.from("2026-10-24T09:00:00+01:00");
} catch (e) {
  console.log("no zone   ", `${(e as Error).name}: ${(e as Error).message}`);
}
