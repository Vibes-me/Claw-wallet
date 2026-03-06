# Contributing to Claw Wallet

First off, thank you for considering contributing to Claw Wallet! It's people like you that make this project better for everyone.

## 🦞 Code of Conduct

This project and everyone participating in it is governed by common sense and mutual respect. By participating, you are expected to uphold this standard. Please be respectful, inclusive, and constructive in all interactions.

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, API calls, etc.)
- **Describe the behavior you observed** and what you expected
- **Include logs and error messages** if applicable
- **Specify your environment**: OS, Node.js version, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating one:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** with clear, descriptive commit messages
3. **Add tests** if applicable
4. **Update documentation** if needed
5. **Ensure tests pass** locally before submitting

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or bun
- Python 3.8+ (for SDK development)
- PostgreSQL (optional, for DB backend testing)
- Redis (optional, for distributed rate limiting)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Claw-wallet.git
cd Claw-wallet

# Install backend dependencies
cd agent-wallet-service
npm install

# Start the service
npm start

# In another terminal, run tests
npm test
```

### Dashboard Development

```bash
cd agent-wallet-service-dashboard
npm install
npm run dev  # Starts Vite dev server on port 4173
```

### Python SDK Development

```bash
cd agent-wallet-service-python
pip install -e ".[dev]"
pytest -v
```

## 📁 Project Structure

```
claw-wallet/
├── agent-wallet-service/          # Node.js backend
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Express middleware
│   │   └── repositories/         # Data access
│   └── tests/                    # Test suites
├── agent-wallet-service-python/   # Python SDK
├── agent-wallet-service-dashboard/ # React UI
└── .github/                      # CI/CD config
```

## 🧪 Testing

### Backend Tests

```bash
cd agent-wallet-service

# Run all tests
npm test

# Run specific test suites
npm run test:wallet
npm run test:auth
npm run test:policy
npm run test:hitl
```

### Python Tests

```bash
cd agent-wallet-service-python

# Run all tests
pytest -v

# Run with coverage
pytest --cov=claw_wallet
```

## 📝 Coding Standards

### JavaScript/TypeScript

- Use ES modules (ESM) syntax
- Use `const` and `let` over `var`
- Use async/await over raw Promises
- Add JSDoc comments for public functions
- Run `npm run lint` before committing

### Python

- Follow PEP 8 style guide
- Use type hints where possible
- Write docstrings for public functions
- Format with Black: `black claw_wallet/`

### Commit Messages

- Use clear, descriptive commit messages
- Start with a type prefix:
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `docs:` - Documentation changes
  - `test:` - Test additions/changes
  - `refactor:` - Code refactoring
  - `chore:` - Maintenance tasks

Example: `feat(wallet): add support for ERC-20 token transfers`

## 🌿 Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring

## 📋 Pull Request Checklist

- [ ] Code compiles without errors
- [ ] Tests pass locally
- [ ] New code has test coverage
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] PR description explains the change

## 🔐 Security

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead, email security concerns to the maintainers privately.

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive configuration
- Validate all user inputs
- Follow the principle of least privilege

## 📚 Resources

- [Viem Documentation](https://viem.sh/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🙏 Recognition

Contributors will be recognized in our README and release notes. Thank you for making Claw Wallet better!

---

*Built with 🦞 by the Claw Wallet community*
