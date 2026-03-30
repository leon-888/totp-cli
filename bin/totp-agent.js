#!/usr/bin/env node

const { run } = require("../lib/cli");

run(process.argv.slice(2)).catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(`totp-agent: ${message}`);
  process.exitCode = 1;
});
