// temporal-polyfill, the one I'd ship to browsers without Temporal (Safari today).
// Its "global" entry leaves a native Temporal alone and fills the gap otherwise.
const native = globalThis.Temporal;
await import("temporal-polyfill/global");
console.log("global kept native", globalThis.Temporal === native);

// The non-native implementation, to see the polyfill's own answer on this date.
// Typed with TypeScript's built-in Temporal types: no extra type package.
import { Temporal as Poly } from "temporal-polyfill/implementation";

const start: Temporal.ZonedDateTime = Poly.ZonedDateTime.from(
  "2026-10-24T09:00[Europe/London]",
);
console.log("polyfill + 1 day   ", start.add({ days: 1 }).toString());
console.log("polyfill + 24 hours", start.add({ hours: 24 }).toString());
