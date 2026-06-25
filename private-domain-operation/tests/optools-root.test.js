const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectDir = path.resolve(__dirname, "..");
const scriptPath = path.join(projectDir, "optools.sh");

function run(args = [], env = {}) {
  return spawnSync(scriptPath, args, {
    cwd: projectDir,
    env: {
      ...process.env,
      ...env
    },
    encoding: "utf8"
  });
}

assert.ok(fs.existsSync(scriptPath), "optools.sh should exist at project root");

const syntax = spawnSync("bash", ["-n", scriptPath], {
  cwd: projectDir,
  encoding: "utf8"
});
assert.equal(syntax.status, 0, syntax.stderr);

const help = run(["help"]);
assert.equal(help.status, 0, help.stderr);
["init", "start", "stop", "restart", "status", "logs", "smoke"].forEach((command) => {
  assert.match(help.stdout, new RegExp(`\\b${command}\\b`), `help should mention ${command}`);
});

const dryStart = run(["start"], { OPTOOLS_DRY_RUN: "1" });
assert.equal(dryStart.status, 0, dryStart.stderr);
assert.match(dryStart.stdout, /backend\/scripts\/optools start/);
assert.match(dryStart.stdout, /DAEMON_MODE=nohup/);
assert.match(dryStart.stdout, /LOG_DIR=.*private-domain-operation\/log/);
assert.match(dryStart.stdout, /GOMODCACHE=.*private-domain-operation\/\.cache\/go-mod/);

const dryLogsFollow = run(["logs", "-f", "40"], { OPTOOLS_DRY_RUN: "1" });
assert.equal(dryLogsFollow.status, 0, dryLogsFollow.stderr);
assert.match(dryLogsFollow.stdout, /FOLLOW=1/);
assert.match(dryLogsFollow.stdout, /backend\/scripts\/optools logs 40/);

const dryInit = run(["init"], { OPTOOLS_DRY_RUN: "1" });
assert.equal(dryInit.status, 0, dryInit.stderr);
assert.match(dryInit.stdout, /go mod download/);
assert.match(dryInit.stdout, /private-domain-operation\/log/);
assert.match(dryInit.stdout, /private-domain-operation\/\.cache\/go-mod/);
