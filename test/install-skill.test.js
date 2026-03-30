"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { installSkill } = require("../scripts/install-skill");

test("installSkill copies bundled skill into Codex skills directory", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "totp-skill-"));

  try {
    const installedPath = await installSkill({
      codexHome: tempDir,
      skillName: "totp-agent-test"
    });

    const skillPath = path.join(installedPath, "SKILL.md");
    const contents = await fs.readFile(skillPath, "utf8");

    assert.equal(installedPath, path.join(tempDir, "skills", "totp-agent-test"));
    assert.match(contents, /name:\s*"totp-agent"/);
    assert.match(contents, /totp-agent --secret-env TOTP_SECRET --quiet/);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
