"use strict";

const crypto = require("node:crypto");

const DEFAULT_PERIOD = 30;
const DEFAULT_DIGITS = 6;
const DEFAULT_ALGORITHM = "SHA1";
const SUPPORTED_ALGORITHMS = new Set(["SHA1", "SHA256", "SHA512"]);

function normalizeAlgorithm(input) {
  const algorithm = String(input || DEFAULT_ALGORITHM).trim().toUpperCase();
  if (!SUPPORTED_ALGORITHMS.has(algorithm)) {
    throw new Error(`unsupported algorithm "${input}"`);
  }
  return algorithm;
}

function decodeBase32(input) {
  const normalized = String(input || "")
    .trim()
    .replace(/^otpauth-migration:\/\//i, "")
    .replace(/\s+/g, "")
    .replace(/=+$/g, "")
    .toUpperCase();

  if (!normalized) {
    throw new Error("secret is empty");
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error(`invalid base32 character "${char}"`);
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

function parseOtpauthUrl(otpauth) {
  let url;
  try {
    url = new URL(String(otpauth));
  } catch {
    throw new Error("invalid otpauth URL");
  }

  if (url.protocol !== "otpauth:") {
    throw new Error("otpauth URL must start with otpauth://");
  }

  if (url.hostname.toLowerCase() !== "totp") {
    throw new Error("only otpauth://totp URLs are supported");
  }

  const secret = url.searchParams.get("secret");
  if (!secret) {
    throw new Error("otpauth URL is missing secret");
  }

  const algorithm = normalizeAlgorithm(url.searchParams.get("algorithm") || DEFAULT_ALGORITHM);
  const digits = parsePositiveInteger(url.searchParams.get("digits") || DEFAULT_DIGITS, "digits");
  const period = parsePositiveInteger(url.searchParams.get("period") || DEFAULT_PERIOD, "period");
  const issuer = url.searchParams.get("issuer") || "";
  const label = decodeURIComponent(url.pathname.replace(/^\//, ""));

  return {
    secret,
    algorithm,
    digits,
    period,
    issuer,
    label
  };
}

function parsePositiveInteger(value, fieldName) {
  const number = Number.parseInt(String(value), 10);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return number;
}

function generateHotp({ secret, algorithm = DEFAULT_ALGORITHM, digits = DEFAULT_DIGITS, counter }) {
  const normalizedAlgorithm = normalizeAlgorithm(algorithm);
  const key = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);
  let current = BigInt(counter);

  for (let index = 7; index >= 0; index -= 1) {
    counterBuffer[index] = Number(current & 0xffn);
    current >>= 8n;
  }

  const digest = crypto
    .createHmac(normalizedAlgorithm.toLowerCase(), key)
    .update(counterBuffer)
    .digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const token = String(codeInt % 10 ** digits).padStart(digits, "0");
  return token;
}

function generateTotp({
  secret,
  algorithm = DEFAULT_ALGORITHM,
  digits = DEFAULT_DIGITS,
  period = DEFAULT_PERIOD,
  timestamp = Date.now()
}) {
  const normalizedDigits = parsePositiveInteger(digits, "digits");
  const normalizedPeriod = parsePositiveInteger(period, "period");
  const counter = Math.floor(Number(timestamp) / 1000 / normalizedPeriod);
  const token = generateHotp({
    secret,
    algorithm,
    digits: normalizedDigits,
    counter
  });
  const epochSeconds = Math.floor(Number(timestamp) / 1000);
  const expiresAt = (Math.floor(epochSeconds / normalizedPeriod) + 1) * normalizedPeriod;

  return {
    token,
    counter,
    algorithm: normalizeAlgorithm(algorithm),
    digits: normalizedDigits,
    period: normalizedPeriod,
    generatedAt: epochSeconds,
    expiresAt,
    remainingSeconds: Math.max(0, expiresAt - epochSeconds)
  };
}

module.exports = {
  DEFAULT_ALGORITHM,
  DEFAULT_DIGITS,
  DEFAULT_PERIOD,
  decodeBase32,
  generateHotp,
  generateTotp,
  normalizeAlgorithm,
  parseOtpauthUrl,
  parsePositiveInteger
};
