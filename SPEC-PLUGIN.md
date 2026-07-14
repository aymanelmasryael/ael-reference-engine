# AEL Plugin Specification v1.0

> Official specification for AEL Reference Platform plugins.

## Overview

This document defines the standard for creating, distributing, and certifying plugins for the AEL Reference Platform. All official plugins MUST comply with this specification.

## Plugin Manifest

Every plugin MUST include a manifest with the following properties:

```json
{
  "name": "string (required)",
  "version": "string (required, semver)",
  "description": "string (required)",
  "author": "string (required)",
  "license": "string (required)",
  "aelVersion": "string (required, engine compatibility)",
  "entry": "string (required, main file path)",
  "dependencies": "array (optional)",
  "peerDependencies": "array (optional)",
  "keywords": "array (optional)",
  "repository": "string (optional)",
  "homepage": "string (optional)"
}
```

## Plugin Structure

```
plugin-name/
├── plugin.js          # Main plugin file
├── plugin.css         # Styles (optional, can be injected)
├── package.json       # NPM package manifest
├── README.md          # Documentation
├── LICENSE            # License file
├── CHANGELOG.md       # Version history
└── tests/             # Test files (optional)
    └── plugin.test.js
```

## Plugin Contract

Every plugin MUST export an object with the following structure:

```javascript
const MyPlugin = {
  name: "string (required, unique)",
  version: "string (required, semver)",
  description: "string (optional)",
  author: "string (optional)",

  install(api) {
    // Required: Called when plugin is installed
    // Receives the PluginAPI object
  },

  uninstall(api) {
    // Optional: Called when plugin is uninstalled
  }
};
```

## Plugin API

The `api` object passed to `install()` provides:

### Lifecycle Hooks

```javascript
api.hook(eventName, callback, priority)
```

Available hooks:

| Hook | When | Data |
|------|------|------|
| before:init | Before engine initialization | `{}` |
| after:init | After engine initialization | `{ data }` |
| before:render | Before rendering | `{ data }` |
| after:render | After rendering | `{ data, element }` |
| before:search | Before search | `{ query }` |
| after:search | After search | `{ query, results }` |
| before:export | Before export | `{ format }` |
| after:export | After export | `{ format, result }` |
| on:data:load | When data is loaded | `{ data }` |
| on:error | On error | `{ error }` |
| on:theme:change | Theme changes | `{ theme }` |
| destroy | Engine destroyed | `{}` |

### Event System

```javascript
// Subscribe
api.events.on(eventName, callback, priority)

// Unsubscribe
api.events.off(eventName, callback)

// Emit
api.events.emit(eventName, data)

// Once
api.events.once(eventName, callback)
```

### Commands

```javascript
api.command(name, handler)
```

### Engine Access

```javascript
api.engine.getData()
api.engine.search(query)
api.engine.expandAll()
api.engine.collapseAll()
api.engine.render()
```

## Versioning

Plugins MUST follow Semantic Versioning (semver):

- **MAJOR**: Breaking changes to plugin API or behavior
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Compatibility

### Engine Compatibility

Plugins MUST declare compatible engine versions:

```json
{
  "aelVersion": ">=1.1.0"
}
```

### Compatibility Matrix

| Engine | Plugin Version | Status |
|--------|---------------|--------|
| 1.1.0 | 1.0.x | ✅ Supported |
| 1.1.0 | 1.1.x | ✅ Supported |
| 2.0.0 | 1.x.x | ⚠️ May work |
| 2.0.0 | 2.0.0 | ✅ Supported |

## Certification Levels

### Official

- Built by AEL Digital Studio
- Fully tested
- Documentation complete
- Performance validated
- Accessibility compliant

### Verified

- Third-party developed
- Passed AEL review process
- Meets all specification requirements
- Actively maintained

### Community

- Third-party developed
- Not reviewed by AEL
- May have limitations
- Use at own risk

### Experimental

- In development
- API may change
- Not recommended for production

### Deprecated

- No longer maintained
- May have security issues
- Should not be used

## Publishing Process

1. **Validate** — Plugin passes schema validation
2. **Test** — All tests pass
3. **Review** — Code review completed
4. **Documentation** — README complete
5. **Release** — Published to registry

## Naming Convention

- Package name: `@ael/plugin-{name}` or `ael-plugin-{name}`
- Plugin name (in code): `{name}` (lowercase, hyphens allowed)
- File name: `plugin.js`

## Quality Requirements

### Performance

- Plugin MUST NOT block engine initialization
- Plugin MUST NOT add more than 50KB to bundle size
- Plugin MUST use lazy loading for heavy resources

### Accessibility

- Plugin MUST follow WCAG 2.1 AA guidelines
- Plugin MUST support keyboard navigation
- Plugin MUST include ARIA labels

### Security

- Plugin MUST NOT execute external code without user consent
- Plugin MUST NOT send data to external services without disclosure
- Plugin MUST sanitize all user input

### Documentation

- Plugin MUST include a README.md
- README MUST include installation instructions
- README MUST include usage examples
- README MUST include API documentation

## Breaking Changes

A breaking change is:

- Removing a public API method
- Changing the signature of a public method
- Changing the behavior of a hook
- Requiring a newer engine version

Breaking changes MUST result in a MAJOR version bump.

## Deprecation Policy

When deprecating a feature:

1. Add deprecation warning in current version
2. Document in CHANGELOG.md
3. Remove in next MAJOR version
4. Provide migration guide

---

**Version:** 1.0.0
**Status:** Stable
**Author:** Ayman Elmasry — AEL Digital Studio
**License:** MIT
