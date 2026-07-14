# AEL Reference Engine

> The shared engine powering all AEL Engineering References.

**Version 1.0.0** · Zero Dependencies · Universal · Reusable

---

## What Is This?

A universal engine (CSS + JS) that powers interactive engineering references. Provide a `data.json` file and get a complete reference with:

- Expandable cards with flags, examples, tips, and references
- Learning Roadmap (Beginner → Intermediate → Advanced)
- Difficulty levels on every item
- Learning progress tracking (○/◐/●)
- Favorites system
- Instant search with smart ranking
- Platform badges
- Cross-references
- Export (PDF / Markdown / JSON)
- Glossary
- Responsive dark mode
- Zero dependencies

---

## How It Works

### 1. Create your data.json

```json
{
  "meta": {
    "name": "My Reference",
    "shortName": "my-ref",
    "version": "1.0.0",
    "description": "Description here",
    "readingTime": "~2 hours",
    "stats": {
      "items": "100+",
      "categories": "10"
    }
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
      "difficulty": "beginner",
      "flags": [{ "flag": "-a", "desc": "Show hidden files" }],
      "examples": [{ "label": "Long format", "code": "ls -la" }],
      "tip": "Use -lh for human-readable sizes",
      "related": ["find", "tree"],
      "platforms": ["macOS", "Linux", "Bash"],
      "refs": [{ "label": "man ls", "url": "https://man7.org/linux/man-pages/man1/ls.1.html" }]
    }
  ],
  "glossary": [
    { "term": "PATH", "desc": "Environment variable listing directories" }
  ],
  "roadmap": [
    { "level": "Beginner", "desc": "Basics", "categories": ["nav"] }
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
  <script src="ael-engine.js"></script>
</body>
</html>
```

### 3. Done!

The engine auto-loads `data.json` and renders everything.

---

## Data Schema

### meta
| Field | Type | Description |
|-------|------|-------------|
| name | string | Full project name |
| shortName | string | Short name for localStorage keys |
| version | string | Version number |
| description | string | Short description |
| readingTime | string | Estimated reading time |
| repoUrl | string | GitHub repository URL |
| demoUrl | string | Live demo URL |
| stats | object | Statistics to display |

### categories
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Display name |
| icon | string | Emoji icon |
| color | string | Hex color |

### items
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✅ | Item name |
| syntax | string | ✅ | Full syntax |
| desc | string | ✅ | Short description |
| category | string | ✅ | Category ID |
| difficulty | string | ✅ | beginner / intermediate / advanced |
| flags | array | ❌ | [{flag, desc}] |
| examples | array | ❌ | [{label, code}] |
| tip | string | ❌ | Helpful tip |
| related | array | ❌ | [item names] |
| platforms | array | ❌ | Platform tags |
| refs | array | ❌ | [{label, url}] |

---

## Public API

```js
// Initialize
AEL.init(data);

// Search
AEL.search("grep");

// Expand/Collapse all
AEL.expandAll();
AEL.collapseAll();

// Export
AEL.exportPDF();
AEL.exportMarkdown();
AEL.exportJSON();
```

---

## Existing References Using This Engine

| Reference | Repository |
|-----------|------------|
| AEL Terminal Engineering Reference 2026 | [GitHub](https://github.com/aymanelmasryael/ael-terminal-engineering-reference-2026) |
| AEL LLM Engineering Reference 2026 | [GitHub](https://github.com/aymanelmasryael/ael-llm-engineering-reference-2026) |

---

## Author

**Ayman Elmasry** — AEL Digital Studio

## License

MIT
