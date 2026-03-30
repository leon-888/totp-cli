# @leonhart538/totp-cli

一个专门给 AI agent、自动化脚本和 CI 任务使用的 TOTP 命令行工具。

特点：

- 零依赖，直接用 Node.js 内置 `crypto`
- 支持全局安装后直接调用
- 支持 `secret`、`otpauth://`、环境变量、`stdin`
- 支持纯 token 输出和 JSON 输出，方便 agent 消费
- 默认会避开仅剩不到 5 秒有效期的 code
- 内置一个 Codex skill，可一键安装到本地 skills 目录

## 安装

```bash
npm install -g @leonhart538/totp-cli
```

安装后命令名为：

```bash
totp-agent
```

Skill 安装命令：

```bash
totp-agent-install-skill
```

## 安装内置 Skill

### 1. 从 npm 包安装 skill

先全局安装包：

```bash
npm install -g @leonhart538/totp-cli
```

再执行：

```bash
totp-agent-install-skill
```

默认会把 skill 安装到：

```bash
~/.codex/skills/totp-agent
```

### 2. 从 GitHub 仓库安装 skill

```bash
git clone git@github.com:leon-888/totp-cli.git
cd totp-cli
node scripts/install-skill.js
```

### 3. 验证安装

安装完成后，你应该能在下面这个文件看到 skill：

```bash
~/.codex/skills/totp-agent/SKILL.md
```

## 用法

### 1. 直接传入 Base32 secret

```bash
totp-agent --secret JBSWY3DPEHPK3PXP
```

### 2. 输出纯 token

```bash
totp-agent --secret JBSWY3DPEHPK3PXP --quiet
```

默认情况下，如果当前 code 剩余有效时间少于 5 秒，CLI 会先等待 5.1 秒，再返回新的一枚 code，避免 agent 拿到即将过期的值。

### 2.1 禁用默认等待

```bash
totp-agent --secret JBSWY3DPEHPK3PXP --quiet --no-wait
```

### 3. 输出 JSON

```bash
totp-agent --secret JBSWY3DPEHPK3PXP --json
```

示例输出：

```json
{
  "token": "123456",
  "expiresAt": 1710000030,
  "remainingSeconds": 12,
  "period": 30,
  "digits": 6,
  "algorithm": "SHA1"
}
```

### 4. 从环境变量读取

```bash
export TOTP_SECRET=JBSWY3DPEHPK3PXP
totp-agent --secret-env TOTP_SECRET --quiet
```

### 5. 从 stdin 读取

```bash
echo 'JBSWY3DPEHPK3PXP' | totp-agent --quiet
```

### 6. 直接使用 otpauth URL

```bash
totp-agent --otpauth 'otpauth://totp/Acme:bot?secret=JBSWY3DPEHPK3PXP&issuer=Acme'
```

## 参数

```text
-s, --secret <base32>       Base32-encoded shared secret
    --otpauth <url>         otpauth://totp URL
    --secret-env <name>     Read the secret from an environment variable
    --digits <number>       OTP digits, default 6
    --period <seconds>      TOTP period, default 30
    --algorithm <name>      SHA1, SHA256, or SHA512
    --timestamp <ms>        Override current Unix timestamp in milliseconds
    --no-wait               Disable the default fresh-code wait behavior
    --json                  Emit machine-readable JSON
-q, --quiet                 Emit token only
-h, --help                  Show help
-v, --version               Show version
```

## 给 AI Agent 的推荐用法

最稳定的两种方式：

```bash
totp-agent --secret-env TOTP_SECRET --quiet
totp-agent --secret-env TOTP_SECRET --json
```

如果你不想把 secret 放进 shell history，推荐环境变量或者 stdin。

默认等待新 code 的行为对 agent 很有用，因为它能减少“刚拿到 code 就过期”的情况；如果你明确想拿当前这一秒的 code，再加 `--no-wait`。

如果这个 skill 已经安装，其他 agent 后续可以直接在任务里使用 `totp-agent` skill，让它优先走环境变量或 stdin 生成 TOTP。

## 本地开发

```bash
npm test
npm run check
```

## 发布到 npm

因为公开包名 `totp-cli` 已经被占用，这个项目默认使用 scoped package：

```bash
@leonhart538/totp-cli
```

首次发布：

```bash
npm login
npm publish --access public
```

后续发布：

```bash
npm version patch
npm publish
```

## GitHub 初始化

```bash
git init
git branch -M master
git remote add origin git@github.com:leon-888/totp-cli.git
git add .
git commit -m "feat: initial totp cli"
git push -u origin master
```
