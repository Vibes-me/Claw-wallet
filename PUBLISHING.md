# Publishing Guide

This guide explains how to publish Claw Wallet packages to npm and PyPI.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Publishing to npm](#publishing-to-npm)
- [Publishing to PyPI](#publishing-to-pypi)
- [Automated Publishing (CI/CD)](#automated-publishing-cicd)
- [Version Management](#version-management)

---

## Prerequisites

### npm (Node.js Package)

1. **Create an npm account** at [npmjs.com](https://www.npmjs.com/signup)
2. **Enable 2FA** on your npm account for security
3. **Verify your email** address

### PyPI (Python Package)

1. **Create a PyPI account** at [pypi.org](https://pypi.org/account/register/)
2. **Create an API token** at [pypi.org/manage/account/token/](https://pypi.org/manage/account/token/)
3. **Save the token securely** - you'll only see it once!

---

## Publishing to npm

### Step 1: Login to npm

```bash
cd claw-wallet/agent-wallet-service
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- OTP (if 2FA is enabled)

### Step 2: Verify Package Contents

```bash
# Check what will be published
npm pack --dry-run

# This shows all files that will be included
```

### Step 3: Run Tests

```bash
npm test
```

### Step 4: Publish

```bash
# For public packages
npm publish --access public

# For scoped packages (if using @claw-wallet/sdk)
npm publish
```

### Step 5: Verify Publication

```bash
npm view claw-wallet-sdk
```

---

## Publishing to PyPI

### Step 1: Install Build Tools

```bash
cd claw-wallet/agent-wallet-service-python
pip install build twine
```

### Step 2: Build the Package

```bash
python -m build
```

This creates:
- `dist/claw_wallet-0.2.0.tar.gz` (source distribution)
- `dist/claw_wallet-0.2.0-py3-none-any.whl` (wheel)

### Step 3: Check the Distribution

```bash
twine check dist/*
```

### Step 4: Upload to PyPI

**First time (using token):**
```bash
twine upload dist/*
```

When prompted:
- Username: `__token__` (literally this string)
- Password: Your PyPI API token (starts with `pypi-`)

**Or use environment variable:**
```bash
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-xxxxx...
twine upload dist/*
```

### Step 5: Verify Publication

```bash
pip index versions claw-wallet
```

Or visit: https://pypi.org/project/claw-wallet/

---

## Automated Publishing (CI/CD)

### GitHub Actions for npm

Create `.github/workflows/publish-npm.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        working-directory: agent-wallet-service
        run: npm ci
      
      - name: Run tests
        working-directory: agent-wallet-service
        run: npm test
      
      - name: Publish
        working-directory: agent-wallet-service
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### GitHub Actions for PyPI

Create `.github/workflows/publish-pypi.yml`:

```yaml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install build tools
        run: pip install build twine
      
      - name: Build package
        working-directory: agent-wallet-service-python
        run: python -m build
      
      - name: Publish to PyPI
        working-directory: agent-wallet-service-python
        run: twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}
```

### Required GitHub Secrets

Add these secrets in your repository settings:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm access token (create at npmjs.com) |
| `PYPI_TOKEN` | PyPI API token (create at pypi.org) |

---

## Version Management

### Semantic Versioning

We follow [SemVer](https://semver.org/):
- `MAJOR.MINOR.PATCH` (e.g., `0.2.0`)
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Bumping Versions

**npm:**
```bash
# Patch release (0.2.0 -> 0.2.1)
npm version patch

# Minor release (0.2.0 -> 0.3.0)
npm version minor

# Major release (0.2.0 -> 1.0.0)
npm version major
```

**Python:**
Manually update version in:
- `pyproject.toml`
- `claw_wallet/__init__.py` (`__version__`)

### Release Checklist

- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Run all tests
- [ ] Build and check distribution
- [ ] Create git tag: `git tag v0.2.0`
- [ ] Push tag: `git push origin v0.2.0`
- [ ] Publish to npm
- [ ] Publish to PyPI
- [ ] Create GitHub release

---

## Quick Reference

### npm Commands

```bash
npm login                    # Login to npm
npm pack --dry-run          # Preview package contents
npm publish --access public # Publish public package
npm unpublish pkg@version   # Unpublish (within 72 hours)
npm deprecate pkg@version   # Deprecate a version
```

### PyPI Commands

```bash
python -m build             # Build the package
twine check dist/*          # Check distribution
twine upload dist/*         # Upload to PyPI
twine upload --repository testpypi dist/*  # Test PyPI
```

### Test PyPI

Test publishing without affecting the real index:

```bash
# Register at test.pypi.org
# Upload to TestPyPI
twine upload --repository testpypi dist/*

# Install from TestPyPI
pip install --index-url https://test.pypi.org/simple/ claw-wallet
```

---

## Troubleshooting

### npm: 403 Forbidden

- Ensure you're logged in: `npm whoami`
- Check if package name is taken: `npm view claw-wallet-sdk`
- For scoped packages, verify you own the scope

### PyPI: 403 Invalid or missing authentication credentials

- Use `__token__` as username (not your PyPI username)
- Ensure token starts with `pypi-`
- Check token hasn't expired

### npm: Package name already exists

- Choose a different name
- Use a scope: `@your-org/claw-wallet-sdk`

### PyPI: File already exists

- You cannot re-upload the same version
- Bump the version number and try again
