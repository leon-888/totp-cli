---
name: "totp-agent"
description: "Use when an AI agent needs to generate a current TOTP code from a Base32 secret, an otpauth:// URL, stdin, or an environment variable. Prefer the bundled `totp-agent` CLI and quiet or JSON output for automation."
---

# TOTP Agent Skill

## When to use
- Generate a current TOTP code for login, MFA, or automation.
- Read a secret from an environment variable instead of hardcoding it in prompts.
- Convert an `otpauth://totp/...` URL into a usable code.
- Produce machine-readable JSON for another tool step.

## Workflow
1. Prefer environment variables for secrets when possible.
2. Use `totp-agent --quiet` when another command only needs the code.
3. Use `totp-agent --json` when the next step needs expiry metadata.
4. By default, if a code has less than 5 seconds left, `totp-agent` waits 5.1 seconds and returns a fresh code.
5. If a user shares an `otpauth://totp/...` URL, pass it with `--otpauth`.
6. Do not print or store secrets unless the user explicitly asks you to.

## Commands

Read from an environment variable:
```bash
totp-agent --secret-env TOTP_SECRET --quiet
```

Read from stdin:
```bash
printf '%s' "$TOTP_SECRET" | totp-agent --quiet
```

Read from an otpauth URL:
```bash
totp-agent --otpauth 'otpauth://totp/Acme:bot?secret=JBSWY3DPEHPK3PXP&issuer=Acme' --json
```

Disable the default fresh-code wait:
```bash
totp-agent --secret-env TOTP_SECRET --quiet --no-wait
```

## Output modes
- `--quiet`: prints only the token
- `--json`: prints `token`, `expiresAt`, `remainingSeconds`, `period`, `digits`, `algorithm`
- `--no-wait`: returns the current code immediately, even if it is about to expire

## Safety
- Prefer `--secret-env` or stdin over putting secrets directly on the command line.
- Avoid echoing secrets back into chat or logs.
- Treat generated TOTP codes as short-lived secrets.
