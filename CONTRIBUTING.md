# Contributing to AEL Reference Platform

> How to contribute to the AEL Reference Platform.

## Welcome

Thank you for your interest in contributing to the AEL Reference Platform! This document provides guidelines for contributing.

## Ways to Contribute

### 1. Report Issues

- Use GitHub Issues
- Include steps to reproduce
- Include expected vs actual behavior
- Include browser/OS information

### 2. Suggest Features

- Use GitHub Issues with "feature-request" label
- Describe the use case
- Describe the expected behavior
- Be open to discussion

### 3. Submit Plugins

1. Fork the repository
2. Create a plugin following the Plugin Specification
3. Add tests
4. Add documentation
5. Submit a Pull Request

### 4. Submit Themes

1. Fork the repository
2. Create a theme following the Theme Specification
3. Add preview image
4. Add documentation
5. Submit a Pull Request

### 5. Submit References

1. Fork the repository
2. Create reference using the Engine
3. Add data.json
4. Add README
5. Submit a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 14
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/aymanelmasryael/ael-reference-engine.git

# Navigate to directory
cd ael-reference-engine

# Install dependencies
npm install

# Run tests
npm test
```

## Pull Request Process

### 1. Create Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

- Follow coding standards
- Add tests if applicable
- Update documentation

### 3. Test

```bash
npm test
```

### 4. Commit

```bash
git commit -m "feat: add new feature"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

### 5. Push

```bash
git push origin feature/my-feature
```

### 6. Create Pull Request

- Fill out the PR template
- Link related issues
- Request review

## Review Process

### For Plugins

1. Compliance with Plugin Specification
2. Code quality
3. Test coverage
4. Documentation
5. Performance
6. Accessibility

### For Themes

1. Compliance with Theme Specification
2. Visual quality
3. Accessibility
4. Documentation
5. Performance

## Code of Conduct

Be respectful, inclusive, and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions?

- GitHub Discussions for questions
- GitHub Issues for bugs
- Email for security issues

---

**Version:** 1.0.0
**Last Updated:** 2026-07-15
