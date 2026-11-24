// Cron parser, plain-English description and next-run calculator.
// 5 fields: minute hour day-of-month month day-of-week. 6 fields: seconds first (Hangfire, Quartz-style, .NET Cronos).
export type Field = { values: number[]; any: boolean; raw: string };
export type Cron = { second: Field; minute: Field; hour: Field; dom: Field; month: Field; dow: Field; hasSeconds: boolean };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *",
};

function parseField(raw: string, min: number, max: number, label: string, names?: string[]): Field {
  const src = raw.toUpperCase();
  if (src === "*" || src === "?") return { values: range(min, max), any: true, raw };
  const out = new Set<number>();
  const num = (s: string) => {
    const i = names ? names.indexOf(s) : -1;
    const n = i >= 0 ? i + (label === "month" ? 1 : 0) : Number(s);
    if (!/^\d+$/.test(s) && i < 0) throw new Error(`"${s}" is not valid in the ${label} field.`);
    return n;
  };
  for (const part of src.split(",")) {
    const [base, stepS] = part.split("/");
    const step = stepS === undefined ? 1 : Number(stepS);
    if (!Number.isInteger(step) || step < 1) throw new Error(`Bad step "/${stepS}" in the ${label} field.`);
    let lo: number, hi: number;
    if (base === "*") { lo = min; hi = max; }
    else if (base.includes("-")) { const [a, b] = base.split("-"); lo = num(a); hi = num(b); }
    else { lo = num(base); hi = stepS === undefined ? lo : max; }
    if (lo < min || hi > max || lo > hi) throw new Error(`"${part}" is out of range for the ${label} field (${min}-${max}).`);
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  if (out.delete(7)) out.add(0); // 7 is also Sunday in day-of-week
  return { values: [...out].sort((a, b) => a - b), any: false, raw };
}
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function parseCron(expr: string): Cron {
  let text = expr.trim().replace(/\s+/g, " ");
  if (MACROS[text.toLowerCase()]) text = MACROS[text.toLowerCase()];
  const parts = text.split(" ");
  if (parts.length !== 5 && parts.length !== 6) throw new Error(`A cron expression has 5 fields (or 6 with seconds); this one has ${parts.length}.`);
  const hasSeconds = parts.length === 6;
  const [s, mi, h, d, mo, w] = hasSeconds ? parts : ["0", ...parts];
  return {
    second: parseField(s, 0, 59, "second"), minute: parseField(mi, 0, 59, "minute"), hour: parseField(h, 0, 23, "hour"),
    dom: parseField(d, 1, 31, "day-of-month"), month: parseField(mo, 1, 12, "month", MONTHS),
    dow: parseField(w, 0, 7, "day-of-week", DAYS), hasSeconds,
  };
}

const list = (xs: string[]) => xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1];
const two = (n: number) => String(n).padStart(2, "0");
const stepOf = (f: Field) => { const m = f.raw.match(/^(\*|\d+)\/(\d+)$/); return m ? Number(m[2]) : 0; };

function unitPhrase(f: Field, unit: string, fmt: (n: number) => string = String): string {
  if (f.any) return `every ${unit}`;
  const step = stepOf(f);
  if (step) return `every ${step} ${unit}s` + (f.raw.startsWith("*") || f.raw.startsWith("0/") ? "" : ` starting at ${unit} ${f.values[0]}`);
  if (/^\d+-\d+$/.test(f.raw)) return `every ${unit} from ${fmt(f.values[0])} through ${fmt(f.values[f.values.length - 1])}`;
  return `at ${unit}${f.values.length > 1 ? "s" : ""} ${list(f.values.map(fmt))}`;
}

export function describe(c: Cron): string {
  const parts: string[] = [];
  const fixedTime = !c.minute.any && !c.hour.any && c.minute.values.length === 1 && !stepOf(c.minute) && !stepOf(c.hour) && !/-/.test(c.hour.raw);
  if (fixedTime) {
    const sec = c.hasSeconds && !(c.second.values.length === 1 && c.second.values[0] === 0) ? `, ${unitPhrase(c.second, "second")}` : "";
    const sTxt = c.hasSeconds && c.second.values.length === 1 ? ":" + two(c.second.values[0]) : "";
    parts.push(`At ${list(c.hour.values.map((h) => `${two(h)}:${two(c.minute.values[0])}${sTxt}`))}${sTxt ? "" : sec}`);
  } else {
    if (c.hasSeconds && !(c.second.values.length === 1 && c.second.values[0] === 0)) parts.push(unitPhrase(c.second, "second"));
    if (c.minute.any) { if (!parts.length) parts.push("every minute"); }
    else parts.push(unitPhrase(c.minute, "minute") + (c.hour.any && !stepOf(c.minute) && !/-/.test(c.minute.raw) ? " past every hour" : ""));
    if (!c.hour.any) parts.push(/^\d+-\d+$/.test(c.hour.raw)
      ? `between ${two(c.hour.values[0])}:00 and ${two(c.hour.values[c.hour.values.length - 1])}:59`
      : stepOf(c.hour) ? `every ${stepOf(c.hour)} hours` : `past hour${c.hour.values.length > 1 ? "s" : ""} ${list(c.hour.values.map(two))}`);
  }
  if (!c.dom.any) parts.push(stepOf(c.dom) ? `every ${stepOf(c.dom)} days of the month` : `on day${c.dom.values.length > 1 ? "s" : ""} ${list(c.dom.values.map(String))} of the month`);
  const dayName = (s: string) => { const u = s.toUpperCase(); const i = DAYS.indexOf(u); return DAY_NAMES[i >= 0 ? i : Number(u) % 7]; };
  const dowRange = c.dow.raw.match(/^([A-Z0-9]+)-([A-Z0-9]+)$/i);
  if (!c.dow.any) parts.push(`${c.dom.any ? "on" : "or on"} ${dowRange ? `${dayName(dowRange[1])} through ${dayName(dowRange[2])}` : list(c.dow.values.map((d) => DAY_NAMES[d]))}`);
  if (!c.month.any) parts.push(`in ${list(c.month.values.map((m) => MONTH_NAMES[m - 1]))}`);
  const text = parts.join(", ") + ".";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Next `count` run times after `from`. Standard cron rule: if both day fields are restricted, either one matching is enough. */
export function nextRuns(c: Cron, from: Date, count: number, utc: boolean): Date[] {
  const runs: Date[] = [];
  const has = (f: Field, v: number) => f.values.includes(v);
  const d = new Date(from.getTime());
  if (utc) d.setUTCSeconds(0, 0); else d.setSeconds(0, 0);
  const get = (k: "Month" | "Date" | "Day" | "Hours" | "Minutes") => (utc ? d[`getUTC${k}`]() : d[`get${k}`]());
  for (let i = 0; i < 60 * 24 * 366 * 2 && runs.length < count; i++) {
    const dayOk = c.dom.any && c.dow.any ? true
      : c.dom.any ? has(c.dow, get("Day")) : c.dow.any ? has(c.dom, get("Date"))
      : has(c.dom, get("Date")) || has(c.dow, get("Day"));
    if (has(c.month, get("Month") + 1) && dayOk && has(c.hour, get("Hours")) && has(c.minute, get("Minutes"))) {
      for (const s of c.second.values) {
        const t = new Date(d.getTime() + s * 1000);
        if (t > from && runs.length < count) runs.push(t);
      }
    }
    d.setTime(d.getTime() + 60000);
  }
  return runs;
}
