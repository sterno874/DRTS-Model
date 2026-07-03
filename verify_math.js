#!/usr/bin/env node
import { spawnSync } from "node:child_process";
const r = spawnSync(process.execPath, ["--test", "tests/math.test.js"], { stdio: "inherit" });
process.exit(r.status === null ? 1 : r.status);
