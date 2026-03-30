"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { generateHotp, generateTotp, parseOtpauthUrl } = require("../lib/totp");

test("generateHotp matches RFC 4226 test values", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const expected = [
    "755224",
    "287082",
    "359152",
    "969429",
    "338314",
    "254676",
    "287922",
    "162583",
    "399871",
    "520489"
  ];

  expected.forEach((token, counter) => {
    assert.equal(generateHotp({ secret, counter, digits: 6, algorithm: "SHA1" }), token);
  });
});

test("generateTotp matches RFC 6238 SHA1 test value", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const result = generateTotp({
    secret,
    algorithm: "SHA1",
    digits: 8,
    period: 30,
    timestamp: 59000
  });

  assert.equal(result.token, "94287082");
  assert.equal(result.remainingSeconds, 1);
});

test("parseOtpauthUrl extracts label and issuer", () => {
  const parsed = parseOtpauthUrl(
    "otpauth://totp/Acme:bot?secret=JBSWY3DPEHPK3PXP&issuer=Acme&algorithm=SHA256&digits=8&period=45"
  );

  assert.deepEqual(parsed, {
    secret: "JBSWY3DPEHPK3PXP",
    algorithm: "SHA256",
    digits: 8,
    period: 45,
    issuer: "Acme",
    label: "Acme:bot"
  });
});
