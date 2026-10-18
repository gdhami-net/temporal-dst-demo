// Runs every case in a child process with TZ set through the environment
// (works the same on Windows, macOS and Linux) and asserts the exact output.
// Then type-checks the code under three `lib` settings with TypeScript 7 and 6.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

let failed = 0;

function check(name: string, actual: string, expected: string): void {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  const shown = ok ? actual : `expected:\n${expected}\n      actual:\n${actual}`;
  for (const line of shown.split("\n")) console.log(`      ${line}`);
}

function run(script: string, tz: string): string {
  return execFileSync(process.execPath, [script], {
    env: { ...process.env, TZ: tz },
    encoding: "utf8",
  }).trimEnd();
}

// The lines that do not depend on the zone the process runs in.
function body(output: string): string {
  return output.split("\n").filter((l) => !l.startsWith("TZ ")).join("\n");
}

function tsc(bin: string, project: string): string {
  try {
    execFileSync(process.execPath, [bin, "-p", project], { encoding: "utf8" });
    return "no errors";
  } catch (e) {
    const out = String((e as { stdout?: string }).stdout ?? "");
    const codes = [...out.matchAll(/^(\S+?)\(\d+,\d+\): error (TS\d+)/gm)].map(
      (m) => `${m[1].replace(/\\/g, "/")} ${m[2]}`,
    );
    return codes.join("\n");
  }
}

const zones = ["UTC", "Europe/London", "Asia/Dubai"];

console.log(`node ${process.version}, Temporal built in: ${typeof Temporal !== "undefined"}`);
console.log("");

// 1. Temporal: the same answer whatever zone the process runs in.
const temporalExpected = [
  "start      2026-10-24T09:00:00+01:00[Europe/London]",
  "+ 1 day    2026-10-25T09:00:00+00:00[Europe/London]",
  "+ 24 hours 2026-10-25T08:00:00+00:00[Europe/London]",
  "1 day is   PT25H",
  "Sunday has 25 hours",
].join("\n");
for (const tz of zones) {
  check(`Temporal, TZ=${tz}: + 1 day keeps 09:00, + 24 hours lands on 08:00`,
    run("src/temporal-days-vs-hours.ts", tz), temporalExpected);
}

// 2. Date + 86,400,000 ms: 08:00 in London, in every zone.
const msExpected = [
  "start      Sat 09:00 2026-10-24T08:00:00.000Z",
  "+ 86400000 Sun 08:00 2026-10-25T08:00:00.000Z",
].join("\n");
for (const tz of zones) {
  check(`Date + 86400000 ms, TZ=${tz}: Sun 08:00 in London`,
    body(run("src/date-add-ms.ts", tz)), msExpected);
}

// 3. setDate(getDate() + 1): right only when the process runs in London.
const setDate = (london: string, iso: string) => [
  "start      Sat 09:00 2026-10-24T08:00:00.000Z",
  `setDate+1  ${london} ${iso}`,
].join("\n");
check("setDate + 1, TZ=UTC: Sun 08:00 in London",
  body(run("src/date-setdate.ts", "UTC")), setDate("Sun 08:00", "2026-10-25T08:00:00.000Z"));
check("setDate + 1, TZ=Europe/London: Sun 09:00 in London",
  body(run("src/date-setdate.ts", "Europe/London")), setDate("Sun 09:00", "2026-10-25T09:00:00.000Z"));
check("setDate + 1, TZ=Asia/Dubai: Sun 08:00 in London",
  body(run("src/date-setdate.ts", "Asia/Dubai")), setDate("Sun 08:00", "2026-10-25T08:00:00.000Z"));

// 4. In and out: instant + zone ID to store, Date interop, offset-only string refused.
const apiExpected = [
  'store      {"at":"2026-10-25T09:00:00Z","zone":"Europe/London"}',
  'as JSON    {"next":"2026-10-25T09:00:00+00:00[Europe/London]"}',
  "Date       2026-10-25T09:00:00.000Z",
  "and back   2026-10-25T09:00:00Z",
  "no zone    RangeError: Temporal error: Time zone annotation is required for parsing a zoned date time.",
].join("\n");
for (const tz of zones) {
  check(`API in and out, TZ=${tz}`, run("src/api-in-and-out.ts", tz), apiExpected);
}

// 5. temporal-polyfill: keeps native Temporal, and its own code agrees on the date.
check("temporal-polyfill: global entry keeps native, implementation gives 09:00 and 08:00",
  run("polyfill/fullcalendar.ts", "UTC"), [
    "global kept native true",
    "polyfill + 1 day    2026-10-25T09:00:00+00:00[Europe/London]",
    "polyfill + 24 hours 2026-10-25T08:00:00+00:00[Europe/London]",
  ].join("\n"));

// 6. Types: the `lib` setting decides whether `Temporal` exists for the compiler.
const compilers = [
  ["node_modules/typescript/bin/tsc", "node_modules/typescript/package.json"],
  ["node_modules/ts6/bin/tsc", "node_modules/ts6/package.json"],
];
for (const [bin, pkg] of compilers) {
  const v = JSON.parse(readFileSync(pkg, "utf8")).version as string;
  check(`TypeScript ${v}, lib ["esnext"]: whole demo type-checks`,
    tsc(bin, "tsconfig.json"), "no errors");
  check(`TypeScript ${v}, lib ["es2024"]: no Temporal, no toTemporalInstant`,
    tsc(bin, "types/tsconfig.es2024.json"), [
      "src/api-in-and-out.ts TS2304",
      "src/api-in-and-out.ts TS2550",
      "src/api-in-and-out.ts TS2304",
      "src/temporal-days-vs-hours.ts TS2304",
    ].join("\n"));
  check(`TypeScript ${v}, lib ["es2024", "esnext.temporal"]: Temporal yes, Date.toTemporalInstant no`,
    tsc(bin, "types/tsconfig.temporal-only.json"), "src/api-in-and-out.ts TS2550");
  check(`TypeScript ${v}: @js-temporal/polyfill objects don't fit the built-in Temporal types`,
    tsc(bin, "types/tsconfig.js-temporal.json"), "polyfill/js-temporal.ts TS2322");
}

console.log("");
console.log(failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
