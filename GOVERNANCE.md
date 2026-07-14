# AEL Reference Platform Governance

> How decisions are made for the AEL Reference Platform.

## Overview

The AEL Reference Platform is governed by AEL Digital Studio. This document describes the decision-making process for the platform.

## Roles

### Maintainer

- Ayman Elmasry (AEL Digital Studio)
- Responsible for core platform decisions
- Reviews and approves all official plugins and themes
- Manages releases and versioning

### Contributors

- Community members who submit plugins, themes, or references
- Must follow the Plugin Specification and Theme Specification
- Must go through the review process

### Users

- Anyone who uses the platform
- Can report issues and request features
- Can submit plugins and themes

## Decision Process

### Core Changes

Any change to the core platform (Engine, SDK, CLI) requires:

1. Proposal via GitHub Issue
2. Discussion period (7 days minimum)
3. Approval by Maintainer
4. Implementation
5. Review
6. Release

### Plugin Certification

Plugin certification requires:

1. Submission via Pull Request
2. Compliance with Plugin Specification
3. Complete documentation
4. Test coverage
5. Maintainer approval

### Theme Certification

Theme certification requires:

1. Submission via Pull Request
2. Compliance with Theme Specification
3. Visual review
4. Accessibility check
5. Maintainer approval

## Versioning Policy

### Semantic Versioning

All components follow semver:

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Schedule

- **PATCH**: As needed
- **MINOR**: Monthly
- **MAJOR**: Annually (if needed)

### Breaking Changes

Breaking changes require:

1. Deprecation notice (1 version minimum)
2. Migration guide
3. Major version bump

## Conflict Resolution

### Technical Disputes

1. Discussion on GitHub Issue
2. Maintainer decision
3. No further appeal

### Community Disputes

1. Discussion on GitHub Discussion
2. Maintainer mediation
3. Final decision by Maintainer

## Changes to Governance

Changes to this document require:

1. Proposal via Pull Request
2. Discussion period (14 days minimum)
3. Approval by Maintainer

---

**Version:** 1.0.0
**Status:** Active
**Last Updated:** 2026-07-15
