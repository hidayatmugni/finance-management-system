import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Fails the build output check when two emitted chunks import each other.
 *
 * Rollup cannot order a cycle, so whichever chunk loads second reads a binding
 * the first has not defined yet and the app dies at runtime with
 * "Cannot access 'X' before initialization" — a failure that never shows up in
 * `vite build`, only in the browser. A bad `manualChunks` rule is the usual
 * cause, so this guards every future change to it.
 */
const assetsDir = join(process.cwd(), "dist", "assets");

const files = readdirSync(assetsDir).filter((name) => name.endsWith(".js"));
const graph = new Map();

for (const file of files) {
  const source = readFileSync(join(assetsDir, file), "utf8");
  const imports = new Set();

  /*
   * Static imports only — `from"./x.js"` and bare `import"./x.js"`.
   *
   * `import("./x.js")` is deliberately excluded: a dynamic import resolves
   * after the importing chunk has finished evaluating, so a lazy route
   * pointing back at shared code in the entry chunk is correct, not a cycle.
   * Flagging those would bury the real static cycles in noise.
   */
  for (const match of source.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) {
    if (match[1] !== file) imports.add(match[1]);
  }

  graph.set(file, imports);
}

const cycles = [];
for (const [file, imports] of graph) {
  for (const target of imports) {
    // Report each pair once.
    if (graph.get(target)?.has(file) && file < target) {
      cycles.push([file, target]);
    }
  }
}

if (cycles.length > 0) {
  console.error(`\n✖ ${cycles.length} circular chunk dependency(ies) found:\n`);
  for (const [a, b] of cycles) console.error(`   ${a}  <->  ${b}`);
  console.error(
    "\nThese crash at runtime with 'Cannot access ... before initialization'.\n" +
      "Merge the two chunks in vite.config.js -> build.rollupOptions.output.manualChunks.\n",
  );
  process.exit(1);
}

console.log(`✓ no circular chunk dependencies (${graph.size} chunks checked)`);
