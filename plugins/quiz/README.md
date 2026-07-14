# AEL Quiz Plugin

> Interactive quiz system for AEL Engineering References — the official reference plugin for the AEL Reference Platform.

## Overview

The Quiz Plugin transforms any AEL reference into an interactive learning tool. Add quizzes to your reference and let users test their knowledge with multiple-choice questions, scoring, and progress tracking.

## Installation

### Method 1: Script Tag

Add to your `index.html`:

```html
<script src="ael-engine.js"></script>
<script src="plugins/quiz/plugin.js"></script>
```

### Method 2: CDN

```html
<script src="https://cdn.jsdelivr.net/gh/aymanelmasryael/ael-reference-engine@main/plugins/quiz/plugin.js"></script>
```

### Method 3: NPM

```bash
npm install @ael/plugin-quiz
```

```javascript
require('@ael/plugin-quiz');
```

## Data Format

Add quizzes to your `data.json`:

```json
{
  "meta": { ... },
  "categories": [ ... ],
  "items": [ ... ],
  "quizzes": [
    {
      "id": "terminal-basics",
      "title": "Terminal Basics Quiz",
      "description": "Test your knowledge of basic terminal commands",
      "category": "navigation",
      "difficulty": "beginner",
      "questions": [
        {
          "question": "What does `ls -la` do?",
          "options": [
            "Show hidden files with details",
            "Delete all files",
            "Compress files",
            "Change permissions"
          ],
          "answer": 0,
          "explanation": "The -a flag shows hidden files, -l shows long format (details)."
        },
        {
          "question": "Which command changes directory?",
          "options": [
            "cd",
            "ls",
            "pwd",
            "mkdir"
          ],
          "answer": 0,
          "explanation": "cd (change directory) is used to navigate between directories."
        }
      ]
    }
  ]
}
```

## Quiz Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | string | Yes | Unique quiz identifier |
| title | string | Yes | Quiz display title |
| description | string | No | Quiz description |
| category | string | No | Category ID (shows button on category card) |
| difficulty | string | No | beginner / intermediate / advanced |
| questions | array | Yes | Array of question objects |

## Question Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| question | string | Yes | The question text (supports Markdown) |
| options | array | Yes | Array of answer options (2-6 recommended) |
| answer | number | Yes | Index of correct answer (0-based) |
| explanation | string | No | Explanation shown after answering |

## Features

### Quiz Modes

- **All Questions** — Answer all questions in sequence
- **Single Question** — Answer one question at a time
- **Timed Mode** — Answer questions with a live timer

### Scoring System

- Animated score circle
- Color-coded results:
  - Green (≥80%): Excellent
  - Blue (≥50%): Good
  - Red (<50%): Needs practice
- Detailed stats (correct, incorrect, unanswered)

### Progress Tracking

- Saves quiz scores to localStorage
- Track completion status
- View past results

### Keyboard Shortcuts

- `1-4` — Select option
- `Enter` — Next question / Submit
- `Escape` — Close quiz

## CLI Integration

```bash
# List all quizzes
ael quiz

# Start a specific quiz
ael quiz terminal-basics

# Start with specific mode
ael quiz terminal-basics timed
```

## Plugin API Usage

This plugin demonstrates all plugin API features:

```javascript
const AELQuizPlugin = {
  name: "quiz",
  version: "1.0.0",
  
  install(api) {
    // 1. Hook into lifecycle
    api.hook("after:render", () => this.init());
    
    // 2. Register command
    api.command("quiz", (args) => this.handleCommand(args));
    
    // 3. Listen to events
    api.events.on("theme:changed", () => this.updateStyles());
    
    // 4. Emit events
    api.events.emit("quiz:completed", { score: 85 });
    
    // 5. Access engine data
    const data = api.engine.getData();
  }
};
```

## Events

| Event | Data | Description |
|-------|------|-------------|
| quiz:started | `{ quizId, questionCount }` | When a quiz begins |
| quiz:completed | `{ quizId, score, total, correct }` | When a quiz is submitted |
| quiz:question:answered | `{ quizId, questionIndex, correct }` | When a question is answered |

## Styling

The plugin uses CSS variables from the AEL Theme System:

```css
--ael-color-primary    /* Selected option */
--ael-color-success    /* Correct answer */
--ael-color-error      /* Incorrect answer */
--ael-color-surface    /* Card background */
--ael-color-text       /* Text color */
```

## Example: Adding Quizzes to Terminal Reference

```json
{
  "quizzes": [
    {
      "id": "navigation-quiz",
      "title": "Navigation Commands",
      "category": "navigation",
      "difficulty": "beginner",
      "questions": [
        {
          "question": "What does `cd ~` do?",
          "options": [
            "Go to home directory",
            "Go to root directory",
            "Go to previous directory",
            "List home directory"
          ],
          "answer": 0,
          "explanation": "~ represents the home directory."
        }
      ]
    }
  ]
}
```

## License

MIT — Ayman Elmasry — AEL Digital Studio
