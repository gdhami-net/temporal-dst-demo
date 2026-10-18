# temporal-dst-demo

"9:00 tomorrow in London", computed from Saturday 24 October 2026 at 09:00, across the night
the UK clocks go back (02:00 on Sunday 25 October 2026 becomes 01:00).

Companion to the post
[Make “same time tomorrow” survive a daylight-saving change with Temporal](https://gdhami.net/blog/make-same-time-tomorrow-survive-a-daylight-saving-change-with-temporal).

## What it proves

- `Temporal.ZonedDateTime#add({ days: 1 })` gives Sunday 09:00 and `add({ hours: 24 })` gives
  Sunday 08:00, whatever time zone the process itself runs in (checked under `UTC`,
  `Europe/London` and `Asia/Dubai`). `until` measures that one day as `PT25H`.
- `Date` plus 86,400,000 ms gives Sunday 08:00 in London, in all three process zones.
- `Date#setDate(getDate() + 1)` gives Sunday 09:00 only when the process runs in
  `Europe/London`. Under `UTC` and `Asia/Dubai` it gives 08:00.
- What to store: an instant plus the zone ID (`{"at":"2026-10-25T09:00:00Z","zone":"Europe/London"}`),
  the `Date` bridges both ways, and `ZonedDateTime.from()` refusing a string with an offset and no zone.
- TypeScript: `lib: ["esnext"]` type-checks everything; `lib: ["es2024"]` fails with
  `TS2304: Cannot find name 'Temporal'`; `lib: ["es2024", "esnext.temporal"]` gets Temporal but not
  `Date#toTemporalInstant` (TS2550, it is declared in `lib.esnext.date.d.ts`). Same on 7.0.2 and 6.0.3.
- Polyfills: `temporal-polyfill`'s global entry keeps a native Temporal, and its own implementation
  type-checks against TypeScript's built-in `Temporal.ZonedDateTime` and gives the same 09:00 and
  08:00. `@js-temporal/polyfill`'s `ZonedDateTime` is not assignable to the built-in type (TS2322).

## Run it

Needs Node 26 or later (Temporal is on by default there, and Node runs the `.ts` files directly by
stripping their types).

```sh
npm ci
node check.ts          # every case, under three TZ values, plus the type checks; exits 1 on any failure
node src/temporal-days-vs-hours.ts
node src/date-setdate.ts
node src/api-in-and-out.ts
npx tsc -p tsconfig.json
```

The check script sets `TZ` in the environment of each child process it starts, so it behaves the
same on Windows, macOS and Linux. Setting `TZ=Europe/London` in front of a command in Git Bash on
Windows did not reach Node in my runs (`TZ=UTC` did); use the check script, or set the variable
from PowerShell / cmd.

## Versions

Run on 2026-10-18 with:

- Node v26.1.0 (V8 14.6.202.34-node.19, ICU 78.3, tzdata 2026b), Windows 11
- TypeScript 7.0.2: the type check of record. It's the current `latest` on npm and ships
  `lib.esnext.temporal.d.ts`. TypeScript 6.0.3 is installed too (as `ts6`) because 6.0 is the
  release that added the Temporal types; the check runs both and they agree.
- @types/node 26.6.5 (declares no Temporal of its own)
- temporal-polyfill 1.0.6, @js-temporal/polyfill 0.5.1

## Edge cases the post leaves out

- Ambiguous and skipped wall times. Adding a day to Saturday 01:30 lands on Sunday 01:30, which
  happens twice; Temporal picks the earlier one by default (`disambiguation: "compatible"`). In
  spring, a time inside the skipped hour moves forward. Both are documented on MDN's
  `ZonedDateTime.add()` page.
- Recurring rules. For "09:00 every day" you may want to store the rule (a wall time plus the zone)
  and compute each occurrence, rather than chaining instants. If a government changes a zone's rules,
  an instant stored months ahead no longer means 09:00; a rule still does.
- `Intl.DateTimeFormat` with `timeZone` lets `Date` *display* any zone; it never does arithmetic.
- `setUTCDate` adds a calendar day in UTC, which has no clock changes, so there it equals 24 hours.
- `ZonedDateTime#toJSON()` writes the RFC 9557 form with the `[Europe/London]` suffix. Most databases
  and many JSON consumers don't parse the suffix, hence the two-field row.
- Browser support (MDN browser-compat-data and caniuse, checked 2026-10-18): Chrome 144, Edge 144,
  Firefox 139, Node 26.0.0, Deno 2.7; Safari and Safari on iOS only in Technology Preview.

## License

MIT, see [LICENSE](LICENSE).
