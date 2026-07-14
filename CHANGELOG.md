# Changelog

All notable changes to this project will be documented in this file.

## v2.0.0 — 15 July 2026

### Added

- **Plugin API** — Lifecycle hooks, Event Bus, Plugin Registry
- **Theme System** — CSS variables, deep merge, component themes
- **Public API** — Stable contract (AEL.init, render, destroy, use, theme, events)
- **SDK**
  - JSON Schema for data.json
  - TypeScript type definitions
  - Validator (structural + semantic)
  - Compiler (Markdown → JSON)
  - Builder (Static Site generation)
  - CLI (12 commands)
- **Specifications**
  - Plugin Specification v1.0
  - Theme Specification v1.0
- **Conformance Kit (ARCK)** — 47 tests across 8 categories
- **Governance**
  - GOVERNANCE.md
  - CONTRIBUTING.md
  - SECURITY.md
  - ROADMAP.md
  - COMPATIBILITY.md
- **Registry** — registry.json for official components
- **Architecture Decision Record** — ARCHITECTURE.md
- **Official Quiz Plugin** — Interactive quiz system
- **CLI Commands**
  - `ael compile` — Markdown to JSON
  - `ael build` — Static site builder
  - `ael conform` — Conformance testing
  - `ael publish` — Validate + Build + Deploy
  - `ael docs` — Documentation generator
  - `ael upgrade` — Engine file updater
  - `ael doctor` — Project health check

### Changed

- **Core API Frozen** — No more core feature additions
- **Architecture Complete** — Platform is architecturally complete
- **Specification Published** — Formal standards for plugins and themes

### Security

- Security policy documented in SECURITY.md
- Vulnerability reporting process established

---

## v1.0.0 — 15 July 2026

### Added

- Universal CSS design system (dark mode, glassmorphism, responsive)
- Universal JavaScript engine (data-driven rendering)
- JSON data schema for references
- Expand/collapse cards
- Learning progress tracking (○/◐/●)
- Favorites system
- Search with smart ranking
- Difficulty badges
- Platform badges
- Cross-references
- Export (PDF, Markdown, JSON)
- Glossary
- Learning Roadmap
- Scroll spy
- URL hash navigation
- Copy to clipboard
- Print styles
- Public API (AEL.init, search, expandAll, etc.)
