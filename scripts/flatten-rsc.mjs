// After `next build` (static export): Next writes per-segment prefetch data as nested folders
// (courses/csharp/__next.courses/$d$slug/__PAGE__.txt) but the client requests the flat, dot-joined name
// (courses/csharp/__next.courses.$d$slug.__PAGE__.txt). Without a copy at that name every menu prefetch 404s and
// navigation waits for a full fetch. Copy each nested file to the flat name next to its page.
import { readdirSync, statSync, copyFileSync } from "node:fs";
import { join } from "node:path";

let copied = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) flatten(p, dir, [name]);
    else walk(p);
  }
}
function flatten(dir, pageDir, parts) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) flatten(p, pageDir, [...parts, name]);
    else { copyFileSync(p, join(pageDir, [...parts, name].join("."))); copied++; }
  }
}
walk("out");
console.log(`flatten-rsc: ${copied} segment files copied`);
