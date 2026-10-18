// @js-temporal/polyfill ships its own Temporal types as a module export.
// This file is type-checked on its own (types/tsconfig.js-temporal.json)
// to see whether its objects fit TypeScript's built-in Temporal types.
import { Temporal as JsTemporal } from "@js-temporal/polyfill";

export const start: Temporal.ZonedDateTime = JsTemporal.ZonedDateTime.from(
  "2026-10-24T09:00[Europe/London]",
);
