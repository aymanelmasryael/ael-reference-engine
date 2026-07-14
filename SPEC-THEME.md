# AEL Theme Specification v1.0

> Official specification for AEL Reference Platform themes.

## Overview

This document defines the standard for creating and distributing themes for the AEL Reference Platform.

## Theme Structure

```
theme-name/
├── theme.json         # Theme manifest (required)
├── README.md          # Documentation
├── LICENSE            # License file
└── preview.png        # Theme preview (optional)
```

## Theme Manifest

Every theme MUST include a `theme.json` with the following structure:

```json
{
  "name": "string (required, unique)",
  "version": "string (required, semver)",
  "description": "string (required)",
  "author": "string (required)",
  "license": "string (required)",
  "aelVersion": "string (required, engine compatibility)",
  "colors": { ... },
  "typography": { ... },
  "spacing": { ... },
  "borderRadius": { ... },
  "shadows": { ... },
  "transitions": { ... },
  "components": { ... }
}
```

## Color Properties

```json
{
  "colors": {
    "primary": "#hex (required)",
    "secondary": "#hex (required)",
    "accent": "#hex (required)",
    "background": "#hex (required)",
    "surface": "rgba/rgba (required)",
    "surfaceHover": "rgba/rgba (required)",
    "text": "#hex (required)",
    "textSecondary": "#hex (required)",
    "textMuted": "#hex (required)",
    "border": "rgba/rgba (required)",
    "success": "#hex (required)",
    "warning": "#hex (required)",
    "error": "#hex (required)",
    "info": "#hex (required)"
  }
}
```

## Typography Properties

```json
{
  "typography": {
    "fontFamily": "string (required)",
    "fontSize": {
      "xs": "string (required)",
      "sm": "string (required)",
      "base": "string (required)",
      "lg": "string (required)",
      "xl": "string (required)",
      "2xl": "string (required)",
      "3xl": "string (required)",
      "4xl": "string (required)"
    },
    "fontWeight": {
      "normal": "string (required)",
      "medium": "string (required)",
      "semibold": "string (required)",
      "bold": "string (required)"
    },
    "lineHeight": {
      "tight": "string (required)",
      "normal": "string (required)",
      "relaxed": "string (required)"
    }
  }
}
```

## Spacing Properties

```json
{
  "spacing": {
    "xs": "string (required)",
    "sm": "string (required)",
    "md": "string (required)",
    "lg": "string (required)",
    "xl": "string (required)",
    "2xl": "string (required)",
    "3xl": "string (required)"
  }
}
```

## Border Radius Properties

```json
{
  "borderRadius": {
    "none": "string (required)",
    "sm": "string (required)",
    "md": "string (required)",
    "lg": "string (required)",
    "xl": "string (required)",
    "full": "string (required)"
  }
}
```

## Shadow Properties

```json
{
  "shadows": {
    "sm": "string (required)",
    "md": "string (required)",
    "lg": "string (required)",
    "xl": "string (required)",
    "glow": "string (required)"
  }
}
```

## Transition Properties

```json
{
  "transitions": {
    "fast": "string (required)",
    "normal": "string (required)",
    "slow": "string (required)"
  }
}
```

## Component Properties

```json
{
  "components": {
    "header": {
      "background": "string (required)",
      "blur": "string (required)",
      "height": "string (required)"
    },
    "sidebar": {
      "width": "string (required)",
      "background": "string (required)",
      "borderRight": "string (required)"
    },
    "card": {
      "background": "string (required)",
      "border": "string (required)",
      "borderRadius": "string (required)",
      "padding": "string (required)",
      "hoverBackground": "string (required)",
      "hoverBorder": "string (required)"
    },
    "search": {
      "background": "string (required)",
      "border": "string (required)",
      "borderRadius": "string (required)",
      "focusBorder": "string (required)",
      "focusShadow": "string (required)"
    },
    "button": {
      "background": "string (required)",
      "hoverBackground": "string (required)",
      "color": "string (required)",
      "borderRadius": "string (required)",
      "padding": "string (required)"
    },
    "code": {
      "background": "string (required)",
      "border": "string (required)",
      "borderRadius": "string (required)",
      "fontFamily": "string (required)"
    }
  }
}
```

## CSS Variables

Themes generate CSS variables automatically:

```css
--ael-color-{key}
--ael-font-family
--ael-font-size-{key}
--ael-spacing-{key}
--ael-radius-{key}
--ael-shadow-{key}
--ael-transition-{key}
--ael-{component}-{property}
```

## Loading Themes

### Method 1: File

```javascript
AEL.theme.loadFile("themes/academic/theme.json");
```

### Method 2: Object

```javascript
AEL.theme.load(themeObject);
```

### Method 3: HTML

```html
<script>
  window.AEL_THEME = { ... };
</script>
```

## Versioning

Themes MUST follow Semantic Versioning (semver):

- **MAJOR**: Breaking changes to theme structure
- **MINOR**: New properties, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Naming Convention

- Package name: `@ael/theme-{name}` or `ael-theme-{name}`
- Theme name (in JSON): `{name}` (lowercase, hyphens allowed)

## Quality Requirements

### Visual Consistency

- Theme MUST maintain readability
- Theme MUST maintain contrast ratios (WCAG AA)
- Theme MUST NOT break layout

### Performance

- Theme MUST NOT add more than 10KB to CSS
- Theme MUST NOT require external resources

### Compatibility

- Theme MUST declare compatible engine versions
- Theme MUST work with all official plugins

## Certification Levels

### Official

- Built by AEL Digital Studio
- Follows all specification requirements
- Tested across browsers
- Documentation complete

### Verified

- Third-party developed
- Passed AEL review
- Meets specification requirements

### Community

- Third-party developed
- Not reviewed by AEL
- Use at own risk

---

**Version:** 1.0.0
**Status:** Stable
**Author:** Ayman Elmasry — AEL Digital Studio
**License:** MIT
