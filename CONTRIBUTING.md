# 🦞 Contributing to Claw Wallet

First off, thanks for taking the time to contribute! 🙏

Claw Wallet is an open-source project, and we welcome contributions from everyone. Whether you're fixing a bug, adding a feature, improving documentation, or just asking questions — you're helping make this project better.

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Community](#community)

---

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you're expected to uphold this code. Please report unacceptable behavior to conduct@clawwallet.io.

---

## How Can I Contribute?

### 🐛 Report Bugs

Found a bug? Please [open an issue](https://github.com/Vibes-me/Claw-wallet/issues/new?template=bug_report.md) with:

- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node.js version, OS, etc.)

### 💡 Suggest Features

Have an idea? [Open a feature request](https://github.com/Vibes-me/Claw-wallet/issues/new?template=feature_request.md) with:

- A clear description of the feature
- Why it would be useful
- Possible implementation approach (if you have one)

### 📖 Improve Documentation

Documentation improvements are always welcome! This includes:

- Fixing typos or unclear explanations
- Adding examples
- Improving API documentation
- Translating documentation

### 🔧 Submit Pull Requests

We love PRs! See [Pull Request Process](#pull-request-process) below.

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or bun
- Git
- (Optional) PostgreSQL
- (Optional) Redis

### Getting Started

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Claw-wallet.git
cd Claw-wallet/agent-wallet-service

# 3. Install dependencies
npm install

# 4. Create a branch for your changes
git checkout -b feature/my-awesome-feature

# 5. Make your changes and test
npm test

# 6. Commit your changes
git commit -m "feat: add my awesome feature"

# 7. Push to your fork
git push origin feature/my-awesome-feature

# 8. Open a Pull Request
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:wallet
npm run test:auth
npm run test:policy

# Run with coverage
npm run test:coverage
```

### Code Style

We use standard JavaScript conventions:

```bash
# Check code style
npm run lint

# Fix style issues automatically
npm run lint:fix
```

---

## Pull Request Process

### Before Submitting

1. **Test your changes**: Make sure all tests pass
2. **Update documentation**: If you change behavior, update the README
3. **Add tests**: New features should include tests
4. **One feature per PR**: Keep PRs focused

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Code style is correct (`npm run lint`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear
- [ ] PR description explains the change

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for Avalanche chain
fix: resolve balance calculation bug
docs: update API examples
test: add tests for policy engine
refactor: simplify wallet creation logic
chore: update dependencies
```

### Review Process

1. Maintainers will review your PR
2. We may ask for changes — this is normal!
3. Once approved, we'll merge it
4. Your contribution will be in the next release 🎉

---

## Coding Standards

### JavaScript

- Use ES modules (`import`/`export`)
- Use `const` and `let`, never `var`
- Use async/await over callbacks
- Handle errors properly with try/catch
- Add JSDoc comments for public functions

```javascript
/**
 * Creates a new wallet for an AI agent
 * @param {string} agentName - Name of the agent
 * @param {string} chain - Blockchain to create wallet on
 * @returns {Promise<Wallet>} The created wallet
 */
export async function createWallet(agentName, chain) {
  // Implementation
}
```

### Python (SDK)

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for all public functions
- Use async/await for async functions

```python
async def create_wallet(
    agent_name: str,
    chain: str = "base-sepolia"
) -> Wallet:
    """Create a new wallet for an AI agent.
    
    Args:
        agent_name: Name of the agent
        chain: Blockchain to create wallet on
        
    Returns:
        The created wallet object
    """
    pass
```

---

## Project Structure

```
claw-wallet/
├── agent-wallet-service/          # Main Node.js backend
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── routes/               # API handlers
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Auth, validation
│   │   └── repositories/         # Data access
│   ├── tests/                    # Test suites
│   └── docs/                     # API docs
│
├── agent-wallet-service-python/   # Python SDK
│   └── claw_wallet/
│
└── agent-wallet-service-dashboard/ # React UI
```

---

## Community

### Get Help

- 💬 [GitHub Discussions](https://github.com/Vibes-me/Claw-wallet/discussions) - Ask questions, share ideas
- 🐛 [GitHub Issues](https://github.com/Vibes-me/Claw-wallet/issues) - Bug reports and feature requests

### Stay Updated

- ⭐ Star the repo to show your support
- 👀 Watch the repo for updates
- 🍴 Fork it and make it your own

---

## Recognition

Contributors are recognized in:

- Our [CONTRIBUTORS.md](CONTRIBUTORS.md) file
- Release notes for significant contributions
- GitHub's contributor graph

---

## Questions?

Feel free to open a [Discussion](https://github.com/Vibes-me/Claw-wallet/discussions) or reach out:

- Email: hello@clawwallet.io
- GitHub: @Vibes-me

---

**Thank you for contributing! 🦞❤️**

*Every contribution, no matter how small, makes a difference.*
