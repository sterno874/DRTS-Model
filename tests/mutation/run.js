#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MUTATION_TARGETS, MUTATION_TEST_FILES } from "./mutations.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const testsDir = path.join(root, "tests");
const backups = new Map();

function backup(fileRel) {
  const abs = path.join(root, fileRel);
  if (!backups.has(fileRel)) backups.set(fileRel, readFileSync(abs, "utf8"));
}

function restoreAll() {
  for (const [fileRel, content] of backups) {
    writeFileSync(path.join(root, fileRel), content, "utf8");
  }
}

function applyMutation(mut) {
  backup(mut.file);
  writeFileSync(path.join(root, mut.file), mut.apply(backups.get(mut.file)), "utf8");
}

function runTests() {
  const files = MUTATION_TEST_FILES.map((f) => path.join(testsDir, f));
  return spawnSync(process.execPath, ["--test", ...files], { cwd: root, encoding: "utf8" });
}

process.on("exit", restoreAll);
process.on("SIGINT", () => {
  restoreAll();
  process.exit(130);
});

const baseline = runTests();
if (baseline.status !== 0) {
  console.error("Mutation run aborted: baseline tests failed.");
  restoreAll();
  process.exit(1);
}

const killed = [];
const survived = [];

for (const mut of MUTATION_TARGETS) {
  applyMutation(mut);
  const result = runTests();
  restoreAll();
  if (result.status === 0) survived.push(mut);
  else killed.push(mut);
}

const score = Math.round((killed.length / MUTATION_TARGETS.length) * 1000) / 10;
console.log(`\nMutation score: ${score}% (${killed.length}/${MUTATION_TARGETS.length} killed)\n`);
if (survived.length) {
  console.log("Survived:");
  survived.forEach((m) => console.log(`  • ${m.id}`));
}
restoreAll();
process.exit(survived.length ? 1 : 0);
