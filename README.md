# AEL Reference Framework

> A specification-driven framework for building interactive engineering references.

**Specification-Driven. Plugin-First. Data-Driven. Zero Dependencies.**

**Version 2.0.0** · Core API Frozen · Specification Published · Architecture Complete

---

## What Is This?

A complete framework for building interactive, searchable, exportable technical references. Not just an engine — a full platform with specifications, governance, and conformance testing.

```
Core
  ↓
Plugins
  ↓
Themes
  ↓
References
```

---

## Architecture

```
AEL Reference Framework
│
├── Core Engine (Frozen)
│   ├── Rendering Engine
│   ├── Plugin API
│   ├── Theme System
│   └── Public API
│
├── SDK
│   ├── JSON Schema
│   ├── TypeScript Types
│   ├── Compiler (Markdown → JSON)
│   ├── Builder (Static Site)
│   └── CLI (12 commands)
│
├── Specifications
│   ├── Plugin Specification v1.0
│   └── Theme Specification v1.0
│
├── Conformance Kit (ARCK)
│   └── 47 tests across 8 categories
│
├── Governance
│   ├── GOVERNANCE.md
│   ├── CONTRIBUTING.md
│   ├── SECURITY.md
│   └── COMPATIBILITY.md
│
├── Official Plugins
│   └── Quiz Plugin
│
└── Architecture Decision Record
    └── ARCHITECTURE.md
```

---

## Quick Start

### 1. Create your data.json

```json
{
  "meta": {
    "name": "My Reference",
    "shortName": "my-ref",
    "version": "1.0.0",
    "description": "Description here"
  },
  "categories": [
    { "id": "nav", "name": "Navigation", "icon": "📁", "color": "#00FF88" }
  ],
  "items": [
    {
      "name": "ls",
      "syntax": "ls [dir]",
      "desc": "List files & folders",
      "category": "nav",
      "difficulty": "beginner"
    }
  ]
}
```

### 2. Create index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Reference</title>
  <link rel="stylesheet" href="ael-engine.css">
</head>
<body>
  <div id="app"></div>
  <script src="ael-engine.plugins.js"></script>
  <script src="ael-engine.themes.js"></script>
  <script src="ael-engine.js"></script>
</body>
</html>
```

### 3. Done!

The engine auto-loads `data.json` and renders everything.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `ael create <name>` | Create new reference project |
| `ael validate [path]` | Validate data.json |
| `ael compile [docs] [output]` | Compile Markdown to JSON |
| `ael build [options]` | Build static site |
| `ael serve [port]` | Start dev server |
| `ael test` | Run test suite |
| `ael conform [options]` | Run ARCK conformance tests |
| `ael publish` | Validate + Build + Deploy |
| `ael docs` | Generate documentation |
| `ael upgrade` | Upgrade engine files |
| `ael doctor` | Check project health |
| `ael info` | Show project info |

---

## Plugin System

```javascript
const MyPlugin = {
  name: "my-plugin",
  version: "1.0.0",
  install(api) {
    api.hook("after:render", () => {
      console.log("Engine rendered!");
    });
  }
};

AEL.use(MyPlugin);
```

---

## Theme System

```json
{
  "name": "my-theme",
  "colors": {
    "primary": "#0074FF",
    "background": "#0B1220",
    "text": "#E0E0E0"
  }
}
```

```javascript
AEL.theme.load(myTheme);
```

---

## Conformance Testing

```bash
# Run ARCK on your implementation
ael conform

# Test another engine
ael conform --target ./my-engine

# Generate reports
ael conform --json --report
```

---

## Existing References

| Reference | Repository |
|-----------|------------|
| AEL Terminal Engineering Reference 2026 | [GitHub](https://github.com/aymanelmasryael/ael-terminal-engineering-reference-2026) |
| AEL LLM Engineering Reference 2026 | [GitHub](https://github.com/aymanelmasryael/ael-llm-engineering-reference-2026) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architectural Decision Record |
| [SPEC-PLUGIN.md](SPEC-PLUGIN.md) | Plugin Specification v1.0 |
| [SPEC-THEME.md](SPEC-THEME.md) | Theme Specification v1.0 |
| [GOVERNANCE.md](GOVERNANCE.md) | Decision process |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [SECURITY.md](SECURITY.md) | Security policy |
| [ROADMAP.md](ROADMAP.md) | Future plans |
| [COMPATIBILITY.md](COMPATIBILITY.md) | Version matrix |

---

## Design Principles

1. **Data First** — Content separate from presentation
2. **Core Stability** — Engine rarely changes
3. **Extensibility over Modification** — Plugins, not core changes
4. **Zero Dependencies** — No external libraries
5. **Specification-Driven** — Spec before implementation
6. **Backward Compatibility** — Breaking changes require major versions

---

## Architecture Invariants

1. Core is frozen during minor releases
2. New capabilities are Plugins whenever possible
3. Data remains separate from Engine
4. Specification is source of truth
5. All implementations must pass ARCK
6. Public API changes require Major version
7. Backward compatibility is the default

---

## Author

**Ayman Elmasry** — AEL Digital Studio

## License

MIT
