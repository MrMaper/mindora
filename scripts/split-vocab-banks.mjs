import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, "..");
const banksDir = path.join(repo, "src/features/language/decks/banks");
const srcPath = path.join(banksDir, "generated.ts");
let src = fs.readFileSync(srcPath, "utf8");
const marker = "GENERATED_BANKS";
const eq = src.indexOf("=", src.indexOf(marker));
const idx = src.indexOf("{", eq);
// Find matching closing brace for the top-level object (not nested).
let depth = 0;
let last = -1;
for (let i = idx; i < src.length; i++) {
  const ch = src[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) {
      last = i;
      break;
    }
  }
}
if (idx < 0 || last < 0) throw new Error("object bounds not found");
const objSrc = src.slice(idx, last + 1);
const banks = vm.runInNewContext("(" + objSrc + ")");

const keys = Object.keys(banks);
const partsDir = path.join(banksDir, "parts");
fs.mkdirSync(partsDir, { recursive: true });
const fnName = (k) => "loadBank_" + k.replace(/[^a-z0-9]/gi, "_");

for (const k of keys) {
  fs.writeFileSync(
    path.join(partsDir, `${k}.ts`),
    `export default ${JSON.stringify(banks[k], null, 2)} as Array<{ front: string; back: string }>;\n`,
  );
  console.log(k, banks[k].length, "words");
}

const lines = [];
for (const k of keys) {
  lines.push(`export async function ${fnName(k)}() {`);
  lines.push(`  return (await import("./parts/${k}")).default;`);
  lines.push(`}`);
  lines.push("");
}
lines.push(
  `export type BankKey = ${keys.map((k) => JSON.stringify(k)).join(" | ")};`,
);
lines.push("");
lines.push("export async function loadBank(");
lines.push("  key: string,");
lines.push("): Promise<Array<{ front: string; back: string }>> {");
lines.push("  switch (key) {");
for (const k of keys) {
  lines.push(`    case ${JSON.stringify(k)}:`);
  lines.push(`      return ${fnName(k)}();`);
}
lines.push("    default:");
lines.push("      return [];");
lines.push("  }");
lines.push("}");
lines.push("");

fs.writeFileSync(path.join(banksDir, "load-bank.ts"), lines.join("\n"));
console.log("wrote", keys.length, "parts + load-bank.ts");
