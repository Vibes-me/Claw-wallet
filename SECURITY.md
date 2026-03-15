# Security Policy

## ⚠️ Alpha Software Warning

**This project is in alpha stage.** It has not undergone a formal third-party security audit. Use at your own risk, and:

- **Self-host only** — Never send private keys to an instance you don't control
- **Use testnets first** — Always test with testnet funds before mainnet
- **Start small** — Begin with small amounts on mainnet
- **Audit the code** — It's open source; review it yourself

---

## Supported Scope

This policy covers security issues in:
- The `agent-wallet-service` Node.js backend
- The `agent-wallet-service-python` Python SDK
- Associated documentation and deployment configurations

## Reporting a Vulnerability

### Please **do not** open public GitHub issues for suspected vulnerabilities.

Instead, report privately by emailing: **security@clawwallet.io**

Include:
- A clear description of the issue and impacted component(s)
- Reproduction steps or proof-of-concept
- Potential impact and attack prerequisites
- Suggested mitigations (if known)

### What to Expect

| Step | Timeline |
|------|----------|
| Acknowledgment | Within 3 business days |
| Initial triage | Within 5 business days |
| Fix development | Depends on severity |
| Security advisory | After fix is released |

We take all reports seriously and will keep you informed throughout the process.

---

## Known Security Considerations

### 🔑 Private Key Import Endpoint

**Endpoint:** `POST /wallet/import`

**Risk Level:** High — requires sending private key to server

**Why it exists:** Enables importing existing wallets for migration purposes

**Mitigations:**
- Only use this endpoint on self-hosted instances
- The server runs on your infrastructure; you control the data
- Consider generating new wallets instead of importing

**Recommendation:** Avoid importing wallets. Generate fresh wallets using `/wallet/create` instead.

---

### 💸 Wallet Sweep Endpoint

**Endpoint:** `POST /wallet/:address/sweep`

**Risk Level:** Medium — drains all funds to another address

**Why it exists:** Useful for consolidating funds or emergency drainage

**Mitigations:**
- Requires valid API key authentication
- Subject to policy engine restrictions
- Should be logged and monitored in production

**Recommendation:** 
- Monitor `/wallet/:address/sweep` calls in your logs
- Set up alerts for sweep operations
- Consider requiring additional approval for sweeps in policy

---

### 📦 API Key Storage

| Mode | Storage | Security |
|------|---------|----------|
| JSON (default) | `api-keys.json` file | Suitable for development only |
| Database | PostgreSQL | API keys hashed with HMAC-SHA256 |

**For production:**
- Set `STORAGE_BACKEND=db`
- Configure `DATABASE_URL`
- Set strong `API_KEY_HASH_SECRET`

---

### 🔐 Private Key Encryption

Private keys are encrypted at rest using **AES-256-GCM** with the following characteristics:

- **Encryption key source:** `WALLET_ENCRYPTION_KEY` environment variable
- **If not set:** A deterministic fallback key is generated (development only)
- **IV (Initialization Vector):** Random 12-byte IV per key
- **Key derivation:** None (raw key used)

**For production:**
- Set `WALLET_ENCRYPTION_KEY` to a cryptographically random 32-byte value
- Store this key securely (e.g., HSM, secrets manager, or secure vault)
- Never commit this key to version control

---

### 🌐 RPC URL Security

The service accepts custom RPC URLs via the `X-RPC-URL` header for BYO (Bring Your Own) RPC mode.

**Risks:**
- Untrusted RPC could leak transaction data
- Man-in-the-middle attacks if RPC URL is compromised

**Mitigations:**
- RPC hosts are validated against a configurable allowlist
- Default allowlist includes major providers (Alchemy, Infura, etc.)
- Configure `BYO_RPC_ALLOWED_HOSTS` for your trusted providers

---

## Security Checklist for Deployments

### Before Deploying

- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL storage (`STORAGE_BACKEND=db`, `DATABASE_URL`)
- [ ] Set strong, unique `API_KEY_HASH_SECRET`
- [ ] Set strong, unique `WALLET_ENCRYPTION_KEY`
- [ ] Configure Redis for distributed rate limiting
- [ ] Set up TLS/HTTPS
- [ ] Review firewall rules
- [ ] Disable `SHOW_BOOTSTRAP_SECRET` (if enabled)

### After Deploying

- [ ] Rotate any keys shown in logs
- [ ] Set up log monitoring for suspicious activity
- [ ] Configure alerts for:
  - Multiple failed API key attempts
  - Large transactions
  - Sweep operations
  - New wallet imports
- [ ] Regular backup of encrypted data
- [ ] Regular security updates (`npm audit fix`)

---

## Dependency Security

### npm Packages

We take supply chain security seriously:

| Measure | Status |
|---------|--------|
| No post-install scripts | ✅ We don't use them |
| Regular `npm audit` | ✅ Run before releases |
| Minimal dependencies | ✅ Only essential packages |

**Before running `npm install`:**

```bash
# Check for suspicious scripts
npm query ".scripts.postinstall, .scripts.preinstall" --json

# Run audit
npm audit

# Review lockfile
cat package-lock.json | grep -A5 "resolved"
```

### Python Packages

| Measure | Status |
|---------|--------|
| No `setup.py` execution | ✅ Pure Python package |
| Minimal dependencies | ✅ Only httpx for HTTP |
| Virtualenv recommended | ✅ Isolate from system Python |

---

## Coordinated Disclosure

We follow responsible disclosure practices:

1. **Report** — Contact us privately at security@clawwallet.io
2. **Wait** — Allow reasonable time for remediation (typically 30-90 days)
3. **Coordinate** — We'll work with you on timing for public disclosure
4. **Credit** — With your permission, we'll credit you in the advisory

### What We Ask

- Do not access, modify, or delete other users' data
- Do not perform actions that could harm system availability
- Do not publicly disclose before fix is released
- Provide detailed reproduction steps

### What We Offer

- Acknowledgment in security advisories (with permission)
- Direct communication with our development team
- Timeline updates throughout the process

---

## Security Updates

Security fixes are released as patch versions and documented in:
- GitHub Releases
- SECURITY.md changelog section
- Commit messages with `security:` prefix

---

## Changelog

| Date | Issue | Severity | Fix |
|------|-------|----------|-----|
| - | - | - | No security issues reported yet |

---

## Contact

- **Security Email:** security@clawwallet.io
- **General Issues:** [GitHub Issues](https://github.com/Vibes-me/Claw-wallet/issues)
- **Encrypted Email:** PGP key available upon request
