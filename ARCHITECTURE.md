# AEL Reference Framework Architecture

> Architectural Decision Record — explains **why** the framework was designed this way.

## 1. Vision

### Why does AEL Reference Framework exist?

Technical knowledge is scattered across blogs, documentation sites, and personal notes. There is no standard format for creating interactive, searchable, exportable technical references.

AEL Reference Framework solves this by providing:

- A **standardized format** for reference data (JSON Schema)
- A **universal engine** that renders any reference interactively
- A **plugin system** that extends functionality without modifying core
- A **conformance kit** that validates implementations

### What problem does it solve?

Creating a technical reference (Terminal commands, LLM concepts, Git workflows) traditionally requires:

1. Building a custom UI from scratch
2. Implementing search, filtering, export
3. Maintaining the code alongside the content

With AEL Reference Framework:

1. Write content in Markdown or JSON
2. The engine renders it automatically
3. Plugins add functionality
4. The content is separate from the presentation

### Long-term goal

Become the **standard format** for interactive technical references — not a specific tool, but a specification that anyone can implement.

## 2. Design Principles

### Data First

The reference data (content) is separate from the engine (presentation). This means:

- The same data can be rendered by different engines
- Content can be version-controlled independently
- Data can be transformed (compiled from Markdown, exported to PDF)

### Core Stability

Once the core is stable, it rarely changes. This means:

- Existing references don't break when the engine updates
- Plugins don't need constant updates
- Users can trust that their work will continue to work

### Extensibility over Modification

New features are implemented as plugins, not core changes. This means:

- The core stays small and focused
- Features can be added without modifying the engine
- Community can contribute without understanding the entire codebase

### Zero Dependencies

The engine has no external dependencies. This means:

- No supply chain attacks
- No version conflicts
- Works in any environment (browser, Node.js, embedded)

### Specification-Driven Development

The specification comes before the implementation. This means:

- Multiple implementations are possible
- The spec is the source of truth, not the code
- Conformance testing is possible

### Backward Compatibility

New versions don't break existing references. This means:

- References created today will work tomorrow
- Upgrading is safe
- Breaking changes require major versions

## 3. Layered Architecture

```
┌─────────────────────────────────────┐
│  Layer 3: References                │
│  Terminal, LLM, Git, Docker...      │
├─────────────────────────────────────┤
│  Layer 2: Extensions                │
│  Plugins, Themes                    │
├─────────────────────────────────────┤
│  Layer 1: Core (Frozen)             │
│  Engine, SDK, CLI, Specifications   │
└─────────────────────────────────────┘
```

### Layer 1: Core

The foundation. Frozen during minor releases.

- **Core Engine** — Renders references from JSON data
- **Plugin API** — Allows plugins to hook into the engine
- **Theme System** — Allows customizing appearance
- **Public API** — Stable interface for all interactions
- **SDK** — Schema, Compiler, Builder, CLI
- **Specifications** — Plugin Spec, Theme Spec
- **Conformance Kit** — ARCK validation

### Layer 2: Extensions

Built on top of the core. Can be added independently.

- **Plugins** — Add functionality (Quiz, Mermaid, KaTeX)
- **Themes** — Customize appearance (Academic, Minimal, Corporate)

### Layer 3: References

Built using the core. The actual content.

- **Official References** — Terminal, LLM
- **Community References** — Any topic
- **Templates** — Starter projects

## 4. System Components

### Core Engine

Renders references from JSON data. Handles:

- Navigation and filtering
- Search
- Card expansion
- Progress tracking
- Favorites
- Export (PDF, Markdown, JSON)
- Scroll spy
- Back to top

### Plugin API

Allows plugins to extend the engine without modification.

- **Lifecycle Hooks** — before/after events for engine operations
- **Event Bus** — Publish/subscribe system
- **Commands** — Register CLI commands
- **Engine Access** — Controlled access to engine internals

### Theme System

Allows customizing appearance through theme.json files.

- **CSS Variables** — Theme values applied as custom properties
- **Deep Merge** — Custom themes merge with defaults
- **Component Themes** — Header, sidebar, card, search, button, code

### SDK

Tools for creating and managing references.

- **Schema** — JSON Schema for data.json
- **Compiler** — Markdown → JSON
- **Builder** — Static site generation
- **CLI** — Command-line interface (12 commands)
- **Validator** — Data validation
- **Conformance Kit** — ARCK testing

### Specifications

Formal standards for plugins and themes.

- **Plugin Specification** — Contract for plugin developers
- **Theme Specification** — Contract for theme developers

### Conformance Kit (ARCK)

Validates implementations against the specification.

- 47 tests across 8 categories
- Generates JSON and HTML reports
- Used to certify implementations

## 5. Architectural Decisions

### Decision: JSON as data format

**Decision:** Reference data is stored in JSON files.

**Rationale:**
- JSON is human-readable and machine-readable
- JSON is the native format of JavaScript (the engine's language)
- JSON can be validated against a schema
- JSON can be generated from Markdown via the Compiler
- JSON can be version-controlled easily

**Consequences:**
- References are text-based (no database)
- Data can be edited manually or via tools
- Large references may have large JSON files (mitigated by lazy loading)

---

### Decision: Plugins instead of core modifications

**Decision:** New features are implemented as plugins, not core changes.

**Rationale:**
- Core remains stable and small
- Features can be added without modifying the engine
- Community can contribute without understanding the entire codebase
- Features can be enabled/disabled per reference

**Consequences:**
- Some features require plugin installation
- Plugin API must be comprehensive enough for most use cases
- Core may lack features that are better as plugins

---

### Decision: Markdown as source, Compiler to JSON

**Decision:** Content is written in Markdown, then compiled to JSON.

**Rationale:**
- Markdown is familiar to developers
- Markdown is easy to write and edit
- Markdown can be version-controlled
- The Compiler handles the transformation to JSON
- JSON is the engine's native format

**Consequences:**
- Two-step process (write → compile)
- Compiler must handle edge cases
- JSON is the authoritative format

---

### Decision: Static Site instead of server

**Decision:** References are built as static sites, not dynamic applications.

**Rationale:**
- Static sites can be hosted anywhere (GitHub Pages, Cloudflare, Netlify)
- No server maintenance required
- Better performance (no server latency)
- Better security (no server-side code)
- Easier distribution (just files)

**Consequences:**
- No real-time updates (must rebuild)
- No user authentication (client-side only)
- No server-side processing

---

### Decision: Specification before implementation

**Decision:** The specification is written before the implementation.

**Rationale:**
- Multiple implementations are possible
- The spec is the source of truth
- Conformance testing is possible
- The spec can be reviewed before implementation

**Consequences:**
- Spec may not match implementation perfectly
- Spec must be maintained alongside implementation
- Changes to spec require changes to implementation

---

### Decision: ARCK for conformance testing

**Decision:** A conformance kit validates implementations against the specification.

**Rationale:**
- Ensures implementations follow the spec
- Allows independent implementations to be certified
- Provides objective quality metrics
- Prevents spec drift

**Consequences:**
- ARCK must be maintained alongside the spec
- ARCK tests may not cover all edge cases
- ARCK is the final arbiter of conformance

---

### Decision: Governance as a document

**Decision:** Governance is a document (GOVERNANCE.md), not a process.

**Rationale:**
- Governance should be transparent
- Governance should be version-controlled
- Governance should be reviewable
- Governance should be simple

**Consequences:**
- Governance may not cover all edge cases
- Governance requires manual updates
- Governance is the authority for decision-making

## 6. Public API Contract

### Stable API

These methods will NOT change in minor versions:

```javascript
AEL.init()
AEL.render()
AEL.destroy()
AEL.getData()
AEL.search(query)
AEL.expandAll()
AEL.collapseAll()
AEL.exportPDF()
AEL.exportMarkdown()
AEL.exportJSON()
AEL.use(plugin)
AEL.uninstall(name)
AEL.enable(name)
AEL.disable(name)
AEL.plugins()
AEL.theme.load(data)
AEL.theme.loadFile(path)
AEL.theme.get()
AEL.theme.getValue(path)
AEL.theme.reset()
AEL.events.on(event, callback)
AEL.events.off(event, callback)
AEL.events.emit(event, data)
AEL.events.once(event, callback)
AEL.hook(event, callback, priority)
AEL.command(name, handler)
```

### Change Policy

- **PATCH:** Bug fixes, no API changes
- **MINOR:** New features, backward compatible
- **MAJOR:** Breaking changes, migration guide required

### Breaking Changes

A breaking change is:

- Removing a public API method
- Changing the signature of a public method
- Changing the behavior of a hook
- Requiring a newer engine version

Breaking changes require:

1. Deprecation notice (1 version minimum)
2. Migration guide
3. Major version bump

## 7. Extension Philosophy

### How Plugins Are Built

1. Follow the Plugin Specification
2. Implement `install(api)` method
3. Use `api.hook()` for lifecycle events
4. Use `api.events.on()` for communication
5. Use `api.command()` for CLI commands
6. Use `api.engine.getData()` for data access

### How Themes Are Built

1. Follow the Theme Specification
2. Create `theme.json` with required properties
3. All values are CSS variables
4. No JavaScript required

### How References Are Built

1. Create `data.json` with required structure
2. Use the Engine to render
3. Or use the Compiler to generate from Markdown
4. Use the Builder to create static site

### What Prevents Core Modification

- Core is frozen during minor releases
- Plugins can extend functionality
- Themes can customize appearance
- The Specification defines what's allowed

## 8. Specification Model

```
┌─────────────────────────────────────┐
│  Specification                      │
│  (The standard)                     │
├─────────────────────────────────────┤
│  Reference Implementation           │
│  (AEL Engine)                       │
├─────────────────────────────────────┤
│  Conformance Kit (ARCK)             │
│  (Validation)                       │
├─────────────────────────────────────┤
│  Independent Implementations        │
│  (Rust, Go, Python...)              │
└─────────────────────────────────────┘
```

### Specification

The formal standard that defines:

- Plugin contract
- Theme contract
- Data format
- API surface

### Reference Implementation

The AEL Engine — the official implementation that:

- Follows the specification exactly
- Serves as the reference for other implementations
- Is maintained by AEL Digital Studio

### Conformance Kit (ARCK)

Validates implementations against the specification:

- 47 tests across 8 categories
- Generates certification reports
- Used to certify implementations

### Independent Implementations

Other implementations in different languages:

- Must follow the specification
- Must pass ARCK
- Are maintained by their respective communities

## 9. Governance

### Maintainer

Ayman Elmasry (AEL Digital Studio)

- Responsible for core platform decisions
- Reviews and approves all official plugins and themes
- Manages releases and versioning

### Contributors

Community members who submit plugins, themes, or references.

- Must follow the Plugin Specification and Theme Specification
- Must go through the review process
- Must pass ARCK for certification

### Review Process

1. Submission via Pull Request
2. Compliance with specification
3. Complete documentation
4. Test coverage
5. Maintainer approval

### Release Policy

- **PATCH:** As needed
- **MINOR:** Monthly
- **MAJOR:** Annually (if needed)

## 10. Non-Goals

AEL Reference Framework is NOT:

- **A CMS** — It doesn't have a content management interface
- **A Documentation Generator** — It's not designed for general documentation
- **A Static Site Generator** — It's specialized for interactive references
- **A Frontend Framework** — It's not a general-purpose UI framework
- **A Blog Engine** — It's not designed for blog posts
- **A Wiki** — It doesn't have collaboration features
- **A Database** — It doesn't store data server-side

AEL Reference Framework IS:

- **An interactive reference engine** — Renders technical references
- **A specification** — Defines the standard for references
- **A conformance kit** — Validates implementations

## 11. Roadmap Philosophy

### How New Features Are Accepted

1. Feature request via GitHub Issue
2. Discussion period (7 days minimum)
3. Must fit within the Extension Philosophy
4. If it can be a plugin, it should be a plugin
5. Maintainer approval

### When Major Versions Are Released

- Breaking changes to the API
- Architectural changes that can't be backward compatible
- New specifications that require new implementations

### When Everything Stays Plugin

- When the feature can be implemented without core changes
- When the feature is specific to certain references
- When the feature requires external dependencies
- When the feature is experimental

## 12. Architecture Evolution

```
Reference
    │
    ▼
Engine
    │
    ▼
SDK
    │
    ▼
Framework
    │
    ▼
Published Specification
    │
    ▼
Conformance Kit
    │
    ▼
Independent Implementations
```

Each stage built on the previous:

1. **Reference** — A single interactive reference
2. **Engine** — A reusable engine for any reference
3. **SDK** — Tools for creating references
4. **Framework** — A complete development framework
5. **Published Specification** — A formal standard
6. **Conformance Kit** — Validation of implementations
7. **Independent Implementations** — Other languages, other communities

## 13. Architecture Invariants

These rules **cannot be broken**:

1. **Core is frozen during minor releases.**
   No changes to the engine, plugin API, theme system, or public API in minor versions.

2. **New capabilities are implemented as Plugins whenever possible.**
   If a feature can be a plugin, it must be a plugin.

3. **Data remains separate from the Engine.**
   The engine reads data; it doesn't create or modify it.

4. **The Specification is the source of truth.**
   The code implements the spec; the spec doesn't follow the code.

5. **All compatible implementations must pass ARCK.**
   Certification requires passing the Conformance Kit.

6. **Public API changes require a Major version.**
   Breaking changes are only allowed in major releases.

7. **Backward compatibility is the default.**
   Unless there's a compelling reason, maintain compatibility.

---

**Version:** 1.0.0
**Status:** Active
**Author:** Ayman Elmasry — AEL Digital Studio
**License:** MIT
