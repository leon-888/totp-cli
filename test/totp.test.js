"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { generateHotp, generateTotp, parseOtpauthUrl } = require("../lib/totp");
const {
  FRESH_CODE_WAIT_MS,
  generateCurrentTotp,
  parseArgs
} = require("../lib/cli");

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

test("parseArgs enables fresh-code waiting by default and allows disabling it", () => {
  assert.equal(parseArgs(["--secret", "ABC"]).waitForFreshCode, true);
  assert.equal(parseArgs(["--secret", "ABC", "--no-wait"]).waitForFreshCode, false);
});

test("generateCurrentTotp waits for a fresh code when the current code is about to expire", async () => {
  const secret = "JBSWY3DPEHPK3PXP";
  const calls = [];
  let sleepCalls = 0;
  const timestamps = [56000, 61000];

  const result = await generateCurrentTotp(
    { secret },
    {
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      waitForFreshCode: true
    },
    {
      now() {
        const value = timestamps[calls.length];
        calls.push(value);
        return value;
      },
      async sleep(ms) {
        sleepCalls += 1;
        assert.equal(ms, FRESH_CODE_WAIT_MS);
      }
    }
  );

  assert.equal(sleepCalls, 1);
  assert.equal(calls.length, 2);
  assert.equal(result.token, "602287");
  assert.equal(result.remainingSeconds, 29);
});

test("generateCurrentTotp skips waiting when --no-wait is used", async () => {
  const secret = "JBSWY3DPEHPK3PXP";
  let sleepCalled = false;

  const result = await generateCurrentTotp(
    { secret },
    {
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      waitForFreshCode: false
    },
    {
      now() {
        return 56000;
      },
      async sleep() {
        sleepCalled = true;
      }
    }
  );

  assert.equal(sleepCalled, false);
  assert.equal(result.remainingSeconds, 4);
});
