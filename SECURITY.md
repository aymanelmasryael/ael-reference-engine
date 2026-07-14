# AEL Reference Platform Security Policy

> Security policy for the AEL Reference Platform.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.0 | ✅ Yes |
| 1.0.0 | ⚠️ Security only |
| < 1.0.0 | ❌ No |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### Do NOT

- Open a public GitHub Issue
- Share the vulnerability publicly
- Exploit the vulnerability

### DO

- Email: ayman@aymanelmasry.me
- Include: Description, steps to reproduce, potential impact
- Allow: 48 hours for initial response

### What to Expect

1. **Acknowledgment** within 48 hours
2. **Assessment** within 7 days
3. **Fix** within 30 days (depending on severity)
4. **Credit** in release notes (unless you prefer anonymity)

## Security Measures

### Core Engine

- No external code execution
- No data transmission to external services
- Input sanitization for all user data
- XSS protection via HTML escaping

### Plugins

- Plugins run in sandboxed environment
- Plugins cannot access DOM outside their scope
- Plugins cannot make network requests without permission
- Plugins are reviewed before certification

### Themes

- Themes are CSS-only (no JavaScript)
- Themes cannot access user data
- Themes are reviewed before certification

## Security Best Practices

### For Users

- Keep the platform updated
- Only install certified plugins
- Review plugin permissions
- Report suspicious behavior

### For Plugin Developers

- Sanitize all user input
- Do not use `eval()` or `innerHTML` with user data
- Do not make external network requests without disclosure
- Do not access data outside your scope

### For Theme Developers

- Do not use `expression()` in CSS
- Do not load external resources without disclosure
- Do not hide critical UI elements

## Updates

Security updates are released as PATCH versions:

```bash
# Update to latest
git pull
```

## Acknowledgments

We thank security researchers who report vulnerabilities responsibly.

---

**Version:** 1.0.0
**Last Updated:** 2026-07-15
