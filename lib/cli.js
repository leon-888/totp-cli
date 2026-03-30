"use strict";

const { stdin, stdout } = require("node:process");
const {
  DEFAULT_ALGORITHM,
  DEFAULT_DIGITS,
  DEFAULT_PERIOD,
  generateTotp,
  parseOtpauthUrl,
  parsePositiveInteger
} = require("./totp");

async function run(argv) {
  const options = parseArgs(argv);

  if (options.help) {
    stdout.write(`${helpText()}\n`);
    return;
  }

  if (options.version) {
    const { version } = require("../package.json");
    stdout.write(`${version}\n`);
    return;
  }

  const input = await resolveInput(options);
  const result = generateTotp({
    secret: input.secret,
    algorithm: input.algorithm || options.algorithm,
    digits: input.digits || options.digits,
    period: input.period || options.period,
    timestamp: options.timestamp
  });

  const payload = {
    token: result.token,
    expiresAt: result.expiresAt,
    remainingSeconds: result.remainingSeconds,
    period: result.period,
    digits: result.digits,
    algorithm: result.algorithm
  };

  if (input.issuer) {
    payload.issuer = input.issuer;
  }

  if (input.label) {
    payload.label = input.label;
  }

  if (options.json) {
    stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  if (options.quiet) {
    stdout.write(`${result.token}\n`);
    return;
  }

  const lines = [
    `token=${result.token}`,
    `remaining_seconds=${result.remainingSeconds}`,
    `expires_at=${result.expiresAt}`,
    `period=${result.period}`,
    `digits=${result.digits}`,
    `algorithm=${result.algorithm}`
  ];

  if (input.issuer) {
    lines.push(`issuer=${input.issuer}`);
  }

  if (input.label) {
    lines.push(`label=${input.label}`);
  }

  stdout.write(`${lines.join("\n")}\n`);
}

function parseArgs(argv) {
  const options = {
    algorithm: DEFAULT_ALGORITHM,
    digits: DEFAULT_DIGITS,
    period: DEFAULT_PERIOD,
    json: false,
    quiet: false,
    help: false,
    version: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--secret":
      case "-s":
        options.secret = readValue(argv, ++index, arg);
        break;
      case "--otpauth":
        options.otpauth = readValue(argv, ++index, arg);
        break;
      case "--secret-env":
        options.secretEnv = readValue(argv, ++index, arg);
        break;
      case "--digits":
        options.digits = parsePositiveInteger(readValue(argv, ++index, arg), "digits");
        break;
      case "--period":
        options.period = parsePositiveInteger(readValue(argv, ++index, arg), "period");
        break;
      case "--algorithm":
        options.algorithm = readValue(argv, ++index, arg);
        break;
      case "--timestamp":
        options.timestamp = Number(readValue(argv, ++index, arg));
        if (!Number.isFinite(options.timestamp)) {
          throw new Error("timestamp must be a valid number");
        }
        break;
      case "--json":
        options.json = true;
        break;
      case "--quiet":
      case "-q":
        options.quiet = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--version":
      case "-v":
        options.version = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`unknown argument "${arg}"`);
        }
        if (!options.secret) {
          options.secret = arg;
        } else {
          throw new Error(`unexpected positional argument "${arg}"`);
        }
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

async function resolveInput(options) {
  if (options.otpauth) {
    return parseOtpauthUrl(options.otpauth);
  }

  if (options.secret) {
    return { secret: options.secret };
  }

  if (options.secretEnv) {
    const secret = process.env[options.secretEnv];
    if (!secret) {
      throw new Error(`environment variable "${options.secretEnv}" is empty or missing`);
    }
    return { secret };
  }

  if (!stdin.isTTY) {
    const secret = await readStdin();
    if (secret) {
      return { secret };
    }
  }

  throw new Error("missing secret, use --secret, --otpauth, --secret-env, or stdin");
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => chunks.push(chunk));
    stdin.on("end", () => resolve(chunks.join("").trim()));
    stdin.on("error", reject);
  });
}

function helpText() {
  return `totp-agent

Generate TOTP codes for AI agents and automation scripts.

Usage:
  totp-agent --secret JBSWY3DPEHPK3PXP
  totp-agent --otpauth 'otpauth://totp/Acme:bot?secret=JBSWY3DPEHPK3PXP&issuer=Acme'
  totp-agent --secret-env TOTP_SECRET --json
  echo 'JBSWY3DPEHPK3PXP' | totp-agent -q

Options:
  -s, --secret <base32>       Base32-encoded shared secret
      --otpauth <url>         otpauth://totp URL
      --secret-env <name>     Read the secret from an environment variable
      --digits <number>       OTP digits, default ${DEFAULT_DIGITS}
      --period <seconds>      TOTP period, default ${DEFAULT_PERIOD}
      --algorithm <name>      SHA1, SHA256, or SHA512
      --timestamp <ms>        Override current Unix timestamp in milliseconds
      --json                  Emit machine-readable JSON
  -q, --quiet                 Emit token only
  -h, --help                  Show help
  -v, --version               Show version`;
}

module.exports = {
  helpText,
  parseArgs,
  resolveInput,
  run
};
