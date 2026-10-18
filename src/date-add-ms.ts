import { FROM_API, inLondon } from "./start.ts";

const start = new Date(FROM_API);
const next = new Date(start.getTime() + 86_400_000);

console.log("TZ        ", process.env.TZ ?? "(not set)");
console.log("start     ", inLondon(start), start.toISOString());
console.log("+ 86400000", inLondon(next), next.toISOString());
