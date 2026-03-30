#!/usr/bin/env node

const { installSkillCli } = require("../scripts/install-skill");

installSkillCli(process.argv.slice(2)).catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`totp-agent-install-skill: ${message}`);
  process.exitCode = 1;
});
