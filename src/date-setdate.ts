import { FROM_API, inLondon } from "./start.ts";

const start = new Date(FROM_API);
const next = new Date(start);
next.setDate(next.getDate() + 1); // "tomorrow" in the zone this process runs in

console.log("TZ        ", process.env.TZ ?? "(not set)");
console.log("start     ", inLondon(start), start.toISOString());
console.log("setDate+1 ", inLondon(next), next.toISOString());
