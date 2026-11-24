// JSON → C# classes/records. Pure functions so they can be tested without a browser.
export type Options = { root: string; records: boolean; attributes: boolean; nullable: boolean };

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Field = { json: string; type: string; optional: boolean };
type Cls = { name: string; fields: Field[] };

const KEYWORDS = new Set("abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while".split(" "));

export const pascal = (s: string) => {
  const p = s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ""))
    .replace(/^[a-z]/, (c) => c.toUpperCase());
  const name = p || "Value";
  return /^[0-9]/.test(name) ? "_" + name : name;
};
const singular = (s: string) => /ies$/i.test(s) ? s.slice(0, -3) + "y" : /(ss|us)$/i.test(s) ? s : /s$/i.test(s) && s.length > 1 ? s.slice(0, -1) : s + "Item";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function jsonToCSharp(text: string, o: Options): string {
  const data = JSON.parse(text) as Json;
  const classes: Cls[] = [];
  const used = new Set<string>();
  const unique = (n: string) => { let x = n, i = 2; while (used.has(x)) x = n + i++; used.add(x); return x; };

  // Type of a set of sample values seen for the same property.
  const typeOf = (samples: Json[], name: string): { type: string; nullable: boolean } => {
    const nonNull = samples.filter((v) => v !== null && v !== undefined);
    const nullable = nonNull.length < samples.length;
    if (!nonNull.length) return { type: "object", nullable: true };
    if (nonNull.every((v) => typeof v === "boolean")) return { type: "bool", nullable };
    if (nonNull.every((v) => typeof v === "number")) {
      const nums = nonNull as number[];
      if (nums.every(Number.isInteger)) return { type: nums.every((n) => Math.abs(n) <= 2147483647) ? "int" : "long", nullable };
      return { type: "double", nullable };
    }
    if (nonNull.every((v) => typeof v === "string")) {
      const strs = nonNull as string[];
      if (strs.every((s) => ISO_DATE.test(s))) return { type: "DateTime", nullable };
      if (strs.every((s) => GUID.test(s))) return { type: "Guid", nullable };
      return { type: "string", nullable };
    }
    if (nonNull.every(Array.isArray)) {
      const items = (nonNull as Json[][]).flat();
      const inner = typeOf(items.length ? items : [null], singular(name));
      return { type: `List<${inner.type}${inner.nullable && items.length ? "?" : ""}>`, nullable };
    }
    if (nonNull.every((v) => typeof v === "object" && !Array.isArray(v))) {
      return { type: build(nonNull as { [k: string]: Json }[], pascal(name)), nullable };
    }
    return { type: "object", nullable };
  };

  // Build one class from all objects seen at this position (merging keys; missing keys become optional).
  function build(objs: { [k: string]: Json }[], name: string): string {
    const cls: Cls = { name: unique(name), fields: [] };
    classes.push(cls);
    const keys = [...new Set(objs.flatMap((x) => Object.keys(x)))];
    for (const k of keys) {
      const samples = objs.map((x) => (k in x ? x[k] : null));
      const t = typeOf(samples, k);
      cls.fields.push({ json: k, type: t.type, optional: t.nullable || objs.some((x) => !(k in x)) });
    }
    return cls.name;
  }

  if (Array.isArray(data)) {
    const objs = data.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as { [k: string]: Json }[];
    if (!objs.length) throw new Error("The array has no objects to turn into a class.");
    build(objs, o.root);
  } else if (data && typeof data === "object") {
    build([data], o.root);
  } else {
    throw new Error("Paste a JSON object or an array of objects.");
  }

  const valueTypes = new Set(["int", "long", "double", "bool", "DateTime", "Guid"]);
  const fieldType = (f: Field) => {
    if (!f.optional) return f.type;
    if (valueTypes.has(f.type) || o.nullable) return f.type + "?";
    return f.type;
  };

  const out: string[] = [];
  const needsAttr = o.attributes;
  if (needsAttr) out.push("using System.Text.Json.Serialization;", "");
  for (const c of classes) {
    const props = c.fields.map((f) => {
      let prop = pascal(f.json);
      if (prop === c.name) prop += "Value";
      if (KEYWORDS.has(prop)) prop = "@" + prop;
      return { f, prop };
    });
    if (o.records) {
      const args = props.map(({ f, prop }) => `${needsAttr ? `[property: JsonPropertyName("${f.json}")] ` : ""}${fieldType(f)} ${prop}`);
      out.push(`public record ${c.name}(`, args.map((a) => "    " + a).join(",\n"), ");", "");
    } else {
      out.push(`public class ${c.name}`, "{");
      props.forEach(({ f, prop }, i) => {
        if (needsAttr) out.push(`    [JsonPropertyName("${f.json}")]`);
        const ty = fieldType(f);
        const ini = !f.optional && o.nullable ? (ty === "string" ? " = \"\";" : ty.startsWith("List<") ? " = [];" : !valueTypes.has(ty) && ty !== "object" ? " = new();" : "") : "";
        out.push(`    public ${ty} ${prop} { get; set; }${ini}`);
        if (needsAttr && i < props.length - 1) out.push("");
      });
      out.push("}", "");
    }
  }
  return out.join("\n").trimEnd() + "\n";
}
