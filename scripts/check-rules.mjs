import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const LIMITS = { code: 250, css: 300 };
const OVERRIDES = [
  { match: (file) => file.replaceAll(path.sep, "/").includes("src/features/og/cards/"), code: 480 },
];
const ROOTS = ["src", "scripts", "tests"];
const ROOT_FILES = [
  "next.config.ts",
  "eslint.config.mjs",
  "postcss.config.mjs",
  "playwright.config.ts",
  "vitest.config.mts",
  "pnpm-workspace.yaml",
  ".env.example",
];
const SKIP = new Set(["node_modules", ".next", ".audit", "test-results"]);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function codeComments(file, text) {
  const kind = file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const found = new Set();
  const visit = (node) => {
    for (const range of ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [])
      found.add(range.pos);
    for (const range of ts.getTrailingCommentRanges(text, node.getEnd()) ?? [])
      found.add(range.pos);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return [...found].map((pos) => source.getLineAndCharacterOfPosition(pos).line + 1);
}

const problems = [];
const files = [
  ...ROOTS.filter((r) => statSync(r, { throwIfNoEntry: false })?.isDirectory()).flatMap(walk),
  ...ROOT_FILES.filter((f) => statSync(f, { throwIfNoEntry: false })),
];

for (const file of files) {
  const ext = path.extname(file);
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).length;

  if ([".ts", ".tsx", ".mjs"].includes(ext)) {
    const max = OVERRIDES.find((entry) => entry.match(file))?.code ?? LIMITS.code;
    if (lines > max && !file.endsWith(".d.ts"))
      problems.push(`${file}: ${lines} lines (max ${max})`);
    for (const line of codeComments(file, text)) problems.push(`${file}:${line}: comment`);
  } else if (ext === ".css") {
    if (lines > LIMITS.css) problems.push(`${file}: ${lines} lines (max ${LIMITS.css})`);
    if (/\/\*/.test(text)) problems.push(`${file}: comment`);
  } else if (ext === ".yaml" || file.endsWith(".env.example")) {
    text
      .split(/\r?\n/)
      .forEach(
        (line, index) => /^\s*#/.test(line) && problems.push(`${file}:${index + 1}: comment`),
      );
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`rules ok (${files.length} files)`);
