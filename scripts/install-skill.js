"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const DEFAULT_SKILL_NAME = "totp-agent";

async function installSkillCli(argv) {
  const options = parseArgs(argv);
  const installPath = await installSkill(options);
  process.stdout.write(`${installPath}\n`);
}

function parseArgs(argv) {
  const options = {
    skillName: DEFAULT_SKILL_NAME,
    codexHome: process.env.CODEX_HOME || path.join(os.homedir(), ".codex")
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--name":
        options.skillName = readValue(argv, ++index, arg);
        break;
      case "--codex-home":
        options.codexHome = readValue(argv, ++index, arg);
        break;
      case "--help":
      case "-h":
        process.stdout.write(`${helpText()}\n`);
        process.exit(0);
        break;
      default:
        throw new Error(`unknown argument "${arg}"`);
    }
  }

  return options;
}

function readValue(argv, index, flagName) {
  const value = argv[index];
  if (value === undefined) {
    throw new Error(`${flagName} requires a value`);
  }
  return value;
}

async function installSkill({ skillName = DEFAULT_SKILL_NAME, codexHome }) {
  const sourceDir = path.resolve(__dirname, "..", "skill", "totp-agent");
  const targetDir = path.join(path.resolve(codexHome), "skills", skillName);

  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.rm(targetDir, { recursive: true, force: true });
  await copyDirectory(sourceDir, targetDir);

  return targetDir;
}

async function copyDirectory(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

function helpText() {
  return `totp-agent-install-skill

Install the bundled Codex skill into your local Codex skills directory.

Usage:
  totp-agent-install-skill
  totp-agent-install-skill --name totp-agent
  totp-agent-install-skill --codex-home ~/.codex

Options:
      --name <skill-name>     Install under a custom skill directory name
      --codex-home <path>     Override CODEX_HOME (default: ~/.codex)
  -h, --help                  Show help`;
}

module.exports = {
  DEFAULT_SKILL_NAME,
  helpText,
  installSkill,
  installSkillCli,
  parseArgs
};
