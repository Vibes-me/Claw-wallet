# Release Checklist

Run every gate in order. A release is blocked on the first **FAIL**.

## Gate 1: Install dependencies

| Package | Command | Pass criteria | Fail criteria |
| --- | --- | --- | --- |
| `agent-wallet-service` | `cd agent-wallet-service && npm ci` | Command exits 0 and lockfile install completes. | Any non-zero exit code or lockfile mismatch. |
| `agent-wallet-service-dashboard` | `cd agent-wallet-service-dashboard && npm ci` | Command exits 0 and lockfile install completes. | Any non-zero exit code or lockfile mismatch. |
| `agent-wallet-service-python` | `cd agent-wallet-service-python && python -m pip install -e .` | Editable install completes with exit 0. | Any non-zero exit code. |

## Gate 2: Build/lint/test per package

| Package | Command | Pass criteria | Fail criteria |
| --- | --- | --- | --- |
| `agent-wallet-service` | `cd agent-wallet-service && npm test` | Test runner starts and exits 0. | Missing modules, runtime errors, or non-zero exit. |
| `agent-wallet-service-dashboard` | `cd agent-wallet-service-dashboard && npm run build` | Production build exits 0. | Build errors or non-zero exit. |
| `agent-wallet-service-python` | `cd agent-wallet-service-python && python - <<'PY'\nfrom claw_wallet import WalletClient\nprint('smoke-ok', WalletClient.__name__)\nPY` | Import smoke check prints `smoke-ok` and exits 0. | Import/runtime error or non-zero exit. |

## Gate 3: Security checks

| Scope | Command | Pass criteria | Fail criteria |
| --- | --- | --- | --- |
| Node packages | `cd agent-wallet-service && npm audit --audit-level=high` | No high/critical vulnerabilities reported. | High/critical vulnerabilities or non-zero exit. |
| Dashboard package | `cd agent-wallet-service-dashboard && npm audit --audit-level=high` | No high/critical vulnerabilities reported. | High/critical vulnerabilities or non-zero exit. |
| Python SDK | `cd agent-wallet-service-python && python -m pip check` | Dependency graph is consistent. | Broken/incompatible dependency resolution. |

## Gate 4: Docs accuracy check

| Scope | Command | Pass criteria | Fail criteria |
| --- | --- | --- | --- |
| Root runbook | `rg -n "How to run release checks locally" README.md` | Section exists and commands are current. | Section missing or stale commands. |
| Release checklist | `cat RELEASE_CHECKLIST.md` | File exists and matches CI gate commands. | File missing or command drift from CI. |

