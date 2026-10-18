import { FROM_API, ZONE } from "./start.ts";

const start = Temporal.Instant.from(FROM_API).toZonedDateTimeISO(ZONE);
const oneDay = start.add({ days: 1 });
const hours24 = start.add({ hours: 24 });

console.log("start     ", start.toString());
console.log("+ 1 day   ", oneDay.toString());
console.log("+ 24 hours", hours24.toString());
console.log("1 day is  ", start.until(oneDay).toString());
console.log("Sunday has", oneDay.hoursInDay, "hours");
