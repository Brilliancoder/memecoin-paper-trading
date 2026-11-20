import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "paper.js");
const run = (args, env = {}) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", timeout: 10000, env: { ...process.env, NO_COLOR: "1", BLIX_NO_FOOTER: "1", BLIX_QUIET: "1", ...env } });

test("paper reset recovers a corrupt portfolio file, as the error message tells you to", () => {
  const file = join(mkdtempSync(join(tmpdir(), "paper-")), "portfolio.json");
  writeFileSync(file, "{broken");
  const bad = run(["history", "--file", file]);
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /run "paper reset"/);
  const r = run(["reset", "5", "--file", file]);
  assert.equal(r.status, 0, r.stderr);
  const book = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(book.cash, 5);
  assert.deepEqual(book.trades, []);
});
