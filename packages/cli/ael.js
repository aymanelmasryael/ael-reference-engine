#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const readline = require('readline');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
};

const b = (s) => `${C.bold}${s}${C.reset}`;
const g = (s) => `${C.green}${s}${C.reset}`;
const r = (s) => `${C.red}${s}${C.reset}`;
const y = (s) => `${C.yellow}${s}${C.reset}`;
const c = (s) => `${C.cyan}${s}${C.reset}`;
const dim = (s) => `${C.dim}${s}${C.reset}`;
const mag = (s) => `${C.magenta}${s}${C.reset}`;
const bgOk = (s) => `${C.bgGreen}${C.white}${C.bold} ${s} ${C.reset}`;
const bgFail = (s) => `${C.bgRed}${C.white}${C.bold} ${s} ${C.reset}`;

const HLINE = `${C.dim}${'─'.repeat(48)}${C.reset}`;
const HLINE_LONG = `${C.dim}${'─'.repeat(56)}${C.reset}`;
const VERSION = '1.1.0';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadJson(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`\n  ${r('Error:')} ${b('data.json')} not found at ${c(resolved)}.`);
    console.error(`  Run ${c('ael create')} to create a new project.\n`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`\n  ${r('Error:')} Failed to parse ${b('data.json')}: ${err.message}\n`);
    process.exit(1);
  }
}

function validateProjectData(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    errors.push('Root must be a JSON object.');
    return { valid: false, errors, warnings };
  }

  // Meta
  if (!data.meta || typeof data.meta !== 'object') {
    errors.push('Missing "meta" object.');
  } else {
    if (!data.meta.name || typeof data.meta.name !== 'string') {
      errors.push('meta.name is required and must be a string.');
    }
    if (!data.meta.shortName || typeof data.meta.shortName !== 'string') {
      errors.push('meta.shortName is required and must be a string.');
    }
    if (!data.meta.version || typeof data.meta.version !== 'string') {
      errors.push('meta.version is required and must be a string.');
    }
    if (!data.meta.description || typeof data.meta.description !== 'string') {
      warnings.push('meta.description is recommended.');
    }
  }

  // Categories
  if (!Array.isArray(data.categories)) {
    errors.push('"categories" must be an array.');
  } else {
    const catIds = new Set();
    data.categories.forEach((cat, i) => {
      if (!cat.id) errors.push(`categories[${i}].id is required.`);
      if (catIds.has(cat.id)) errors.push(`Duplicate category id: "${cat.id}".`);
      catIds.add(cat.id);
      if (!cat.name) warnings.push(`categories[${i}].name is recommended.`);
    });
  }

  // Items
  if (!Array.isArray(data.items)) {
    errors.push('"items" must be an array.');
  } else {
    const itemIds = new Set();
    const catIds = new Set((data.categories || []).map((c) => c.id));
    data.items.forEach((item, i) => {
      if (!item.id) errors.push(`items[${i}].id is required.`);
      if (itemIds.has(item.id)) errors.push(`Duplicate item id: "${item.id}".`);
      itemIds.add(item.id);
      if (!item.category) {
        warnings.push(`items[${i}].category is recommended.`);
      } else if (catIds.size > 0 && !catIds.has(item.category)) {
        warnings.push(
          `items[${i}].category "${item.category}" does not match any category id.`
        );
      }
      if (!item.title) warnings.push(`items[${i}].title is recommended.`);
    });
  }

  // Glossary
  if (data.glossary && !Array.isArray(data.glossary)) {
    errors.push('"glossary" must be an array if present.');
  }

  // Roadmap
  if (data.roadmap && !Array.isArray(data.roadmap)) {
    errors.push('"roadmap" must be an array if present.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function renderValidation(result) {
  if (result.valid && result.warnings.length === 0) {
    console.log(`\n  ${bgOk('PASS')}  ${g('data.json is valid.')}\n`);
  } else if (result.valid && result.warnings.length > 0) {
    console.log(`\n  ${bgOk('PASS')}  ${g('data.json is valid.')} ${y(`(${result.warnings.length} warning(s))`)}\n`);
  } else {
    console.log(`\n  ${bgFail('FAIL')}  ${r('data.json is invalid.')}\n`);
  }

  if (result.errors.length > 0) {
    console.log(`  ${b('Errors:')}`);
    result.errors.forEach((e) => console.log(`    ${r('✕')} ${e}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log(`  ${b('Warnings:')}`);
    result.warnings.forEach((w) => console.log(`    ${y('⚠')} ${w}`));
    console.log('');
  }
}

function checkEngineRefs() {
  const indexFile = path.resolve('index.html');
  const issues = [];

  if (!fs.existsSync(indexFile)) {
    return { ready: false, issues: ['index.html not found in current directory.'] };
  }

  const html = fs.readFileSync(indexFile, 'utf-8');

  if (!html.includes('ael-engine.css')) {
    issues.push('ael-engine.css is not referenced in index.html.');
  }
  if (!html.includes('ael-engine.js')) {
    issues.push('ael-engine.js is not referenced in index.html.');
  }

  return { ready: issues.length === 0, issues };
}

function countArray(data, key) {
  return Array.isArray(data[key]) ? data[key].length : 0;
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  if (platform === 'darwin') cmd = `open "${url}"`;
  else if (platform === 'win32') cmd = `start "" "${url}"`;
  else cmd = `xdg-open "${url}" 2>/dev/null || echo ""`;

  try {
    require('child_process').exec(cmd);
  } catch (_) {
    // Silently ignore — browser open is best-effort.
  }
}

// ─── Commands ───────────────────────────────────────────────────────────────

function cmdCreate(args) {
  const name = args[0];
  if (!name) {
    console.log(`\n  ${b('Usage:')} ${c('ael create')} ${mag('<name>')}\n`);
    console.log(`  Creates a new AEL Reference project in the current directory.\n`);
    console.log(`  ${b('Example:')}`);
    console.log(`    ${c('ael create docker-reference')}\n`);
    process.exit(1);
  }

  const projectDir = path.resolve(name);
  if (fs.existsSync(projectDir)) {
    console.error(`\n  ${r('Error:')} Directory ${b(name)} already exists.\n`);
    process.exit(1);
  }

  console.log(`\n  ${c('Creating AEL Reference project:')} ${b(name)} ...\n`);

  const dirs = [projectDir, path.join(projectDir, 'assets')];
  dirs.forEach((d) => fs.mkdirSync(d, { recursive: true }));

  const indexHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEL Reference</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/aymanelmasryael/ael-reference-engine@main/ael-engine.css">
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/gh/aymanelmasryael/ael-reference-engine@main/ael-engine.js"></script>
</body>
</html>`;

  const dataJson = {
    meta: {
      name: `AEL ${name} Reference 2026`,
      shortName: name,
      version: '1.0.0',
      description: `The definitive ${name} reference`,
      readingTime: '~2 hours',
      stats: { items: '0', categories: '0' },
    },
    categories: [],
    items: [],
    glossary: [],
    roadmap: [],
  };

  const readme = `# AEL ${name} Reference

> The definitive \`${name}\` reference — built with the [AEL Reference Engine](https://github.com/aymanelmasryael/ael-reference-engine).

## Getting Started

1. Open \`index.html\` in your browser, or run \`ael serve\` for local development.
2. Edit \`data.json\` to add your categories, items, and glossary entries.
3. Run \`ael validate\` to check your data.
4. Run \`ael build\` to verify readiness for publishing.

## Commands

| Command          | Description                          |
|------------------|--------------------------------------|
| \`ael create\`   | Create a new reference project       |
| \`ael validate\` | Validate \`data.json\`                |
| \`ael build\`    | Validate and check publish readiness |
| \`ael serve\`    | Start local dev server               |
| \`ael info\`     | Show project info                    |
| \`ael help\`     | Show help                            |

## Structure

\`\`\`
${name}/
├── index.html          # App shell (AEL Engine)
├── data.json           # Reference data
├── README.md           # This file
├── .gitignore
└── assets/             # Images, icons, etc.
    └── .gitkeep
\`\`\`

## License

MIT
`;

  const gitignore = `# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# Node
node_modules/

# Build
dist/
build/
`;

  const gitkeep = '';

  const files = [
    [path.join(projectDir, 'index.html'), indexHtml],
    [path.join(projectDir, 'data.json'), JSON.stringify(dataJson, null, 2) + '\n'],
    [path.join(projectDir, 'README.md'), readme],
    [path.join(projectDir, '.gitignore'), gitignore],
    [path.join(projectDir, 'assets', '.gitkeep'), gitkeep],
  ];

  files.forEach(([fp, content]) => {
    fs.writeFileSync(fp, content, 'utf-8');
  });

  console.log(`  ${g('✓')} ${b('index.html')}         — AEL Engine shell`);
  console.log(`  ${g('✓')} ${b('data.json')}          — Template data`);
  console.log(`  ${g('✓')} ${b('README.md')}          — Project readme`);
  console.log(`  ${g('✓')} ${b('.gitignore')}         — Git ignore rules`);
  console.log(`  ${g('✓')} ${b('assets/.gitkeep')}    — Assets directory`);
  console.log('');
  console.log(`  ${g('Project created successfully!')}\n`);
  console.log(`  ${b('Next steps:')}`);
  console.log(`    cd ${c(name)}`);
  console.log(`    ${c('ael serve')}      ${dim('# start dev server')}`);
  console.log(`    ${c('ael validate')}   ${dim('# validate your data')}`);
  console.log('');
}

function cmdValidate(args) {
  const filePath = args[0] || './data.json';
  const data = loadJson(filePath);
  const result = validateProjectData(data);
  renderValidation(result);

  if (!result.valid) {
    process.exit(1);
  }
}

function cmdBuild() {
  console.log(`\n  ${b('AEL Reference Build')}\n`);
  console.log(HLINE);
  console.log('');

  // Step 1: Load and validate data.json
  console.log(`  ${c('1.')} Loading ${b('data.json')} ...`);
  const data = loadJson('./data.json');

  console.log(`  ${c('2.')} Validating data ...`);
  const result = validateProjectData(data);
  renderValidation(result);

  if (!result.valid) {
    console.log(`  ${bgFail('ABORT')}  ${r('Fix the errors above and try again.')}\n`);
    process.exit(1);
  }

  // Step 3: Check index.html and engine references
  console.log(`  ${c('3.')} Checking ${b('index.html')} and engine references ...`);
  const engineCheck = checkEngineRefs();

  if (engineCheck.ready) {
    console.log(`  ${g('✓')} ${b('index.html')} exists and references ael-engine assets.\n`);
  } else {
    console.log(`  ${r('✕')} Engine reference issues:`);
    engineCheck.issues.forEach((issue) => {
      console.log(`    ${r('•')} ${issue}`);
    });
    console.log('');
  }

  // Step 4: Summary
  const catCount = countArray(data, 'categories');
  const itemCount = countArray(data, 'items');
  const glossaryCount = countArray(data, 'glossary');

  console.log(HLINE);
  console.log('');
  console.log(`  ${b('Summary')}`);
  console.log(`  ${dim('Name:')}       ${data.meta?.name || 'N/A'}`);
  console.log(`  ${dim('Version:')}    ${data.meta?.version || 'N/A'}`);
  console.log(`  ${dim('Categories:')} ${catCount}`);
  console.log(`  ${dim('Items:')}      ${itemCount}`);
  console.log(`  ${dim('Glossary:')}   ${glossaryCount}`);
  console.log('');

  if (engineCheck.ready) {
    console.log(`  ${bgOk('READY')}  ${g('Project is ready for publishing.')}\n`);
  } else {
    console.log(`  ${bgFail('NOT READY')}  ${y('Fix the issues above before publishing.')}\n`);
    process.exit(1);
  }
}

function cmdServe(args) {
  const port = parseInt(args[0], 10) || 3000;
  const root = process.cwd();

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(root, reqPath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(
          `<!DOCTYPE html><html><body><h1>404 Not Found</h1><p>${reqPath}</p></body></html>`
        );
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n  ${r('Error:')} Port ${b(port)} is already in use.`);
      console.error(`  Try a different port: ${c(`ael serve ${port + 1}`)}\n`);
    } else {
      console.error(`\n  ${r('Error:')} ${err.message}\n`);
    }
    process.exit(1);
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('');
    console.log(`  ${b('AEL Reference Server')}\n`);
    console.log(HLINE);
    console.log('');
    console.log(`  ${g('Serving:')}  ${c(root)}`);
    console.log(`  ${g('URL:')}      ${b(url)}`);
    console.log(`  ${g('Port:')}     ${port}`);
    console.log('');
    console.log(HLINE);
    console.log('');
    console.log(`  ${dim('Press')} ${b('Ctrl+C')} ${dim('to stop.')}\n`);

    openBrowser(url);
  });
}

function cmdInfo() {
  const data = loadJson('./data.json');

  const catCount = countArray(data, 'categories');
  const itemCount = countArray(data, 'items');
  const glossaryCount = countArray(data, 'glossary');
  const roadmapCount = countArray(data, 'roadmap');

  const result = validateProjectData(data);
  const status = result.valid ? `${g('✓ Valid')}` : `${r('✕ Invalid')}`;

  console.log('');
  console.log(`  ${b('AEL Reference Info')}`);
  console.log(HLINE);
  console.log('');
  console.log(`  ${dim('Name:')}       ${data.meta?.name || 'N/A'}`);
  console.log(`  ${dim('Version:')}    ${data.meta?.version || '1.0.0'}`);
  console.log(`  ${dim('Categories:')} ${catCount}`);
  console.log(`  ${dim('Items:')}      ${itemCount}`);
  console.log(`  ${dim('Glossary:')}   ${glossaryCount}`);
  console.log(`  ${dim('Roadmap:')}    ${roadmapCount} ${roadmapCount === 1 ? 'step' : 'steps'}`);
  console.log('');
  console.log(HLINE);
  console.log('');
  console.log(`  ${dim('Status:')}    ${status}`);
  console.log('');
}

function cmdCompile(args) {
  const docsDir = args[0] || './docs';
  const outputFile = args[1] || './data.json';
  
  console.log(`\n  ${b('AEL Data Compiler')} ${dim('v1.0.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  // Check if compiler exists
  const compilerPath = path.resolve(__dirname, '../compiler/compiler.js');
  if (!fs.existsSync(compilerPath)) {
    console.error(`  ${r('Error:')} Compiler not found at ${c(compilerPath)}.`);
    console.error(`  Run ${c('npm install')} in the engine directory.\n`);
    process.exit(1);
  }
  
  // Check if docs directory exists
  if (!fs.existsSync(path.resolve(docsDir))) {
    console.error(`  ${r('Error:')} Docs directory not found at ${c(docsDir)}.`);
    console.error(`  Create a ${b('docs/')} directory with your markdown files.\n`);
    process.exit(1);
  }
  
  console.log(`  ${c('Input:')}   ${b(docsDir)}/`);
  console.log(`  ${c('Output:')}  ${b(outputFile)}`);
  console.log('');
  
  // Run compiler
  try {
    const { AELCompiler } = require(compilerPath);
    const compiler = new AELCompiler(path.resolve(docsDir));
    compiler.compile(path.resolve(outputFile));
  } catch (err) {
    console.error(`\n  ${r('Error:')} ${err.message}\n`);
    process.exit(1);
  }
}

function cmdBuildSite(args) {
  console.log(`\n  ${b('AEL Static Site Builder')} ${dim('v1.0.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  // Check if builder exists
  const builderPath = path.resolve(__dirname, '../builder/builder.js');
  if (!fs.existsSync(builderPath)) {
    console.error(`  ${r('Error:')} Builder not found at ${c(builderPath)}.`);
    console.error(`  Run ${c('npm install')} in the engine directory.\n`);
    process.exit(1);
  }
  
  // Run builder
  try {
    const builder = require(builderPath);
    // The builder will handle its own argument parsing
    const originalArgv = process.argv;
    process.argv = ['node', 'builder.js', ...args];
    builder.main();
    process.argv = originalArgv;
  } catch (err) {
    console.error(`\n  ${r('Error:')} ${err.message}\n`);
    process.exit(1);
  }
}

function cmdTest() {
  console.log(`\n  ${b('AEL Test Suite')} ${dim('v1.0.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  let passed = 0;
  let failed = 0;
  let total = 0;
  
  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`  ${g('✓')} ${name}`);
    } catch (err) {
      failed++;
      console.log(`  ${r('✕')} ${name}`);
      console.log(`    ${dim(err.message)}`);
    }
  }
  
  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }
  
  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }
  
  function assertArray(arr, message) {
    if (!Array.isArray(arr)) throw new Error(message || `Expected array, got ${typeof arr}`);
  }
  
  function assertObject(obj, message) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error(message || `Expected object, got ${typeof obj}`);
    }
  }
  
  // Test 1: Schema Validation
  console.log(`  ${b('Schema Validation')}`);
  
  test('data.json exists', () => {
    assert(fs.existsSync('./data.json'), 'data.json not found');
  });
  
  let data;
  test('data.json is valid JSON', () => {
    const raw = fs.readFileSync('./data.json', 'utf-8');
    data = JSON.parse(raw);
    assert(data !== null, 'data.json is null');
  });
  
  test('meta section exists', () => {
    assertObject(data.meta, 'meta is missing');
    assert(data.meta.name, 'meta.name is missing');
    assert(data.meta.version, 'meta.version is missing');
  });
  
  test('categories is array', () => {
    assertArray(data.categories, 'categories is not array');
    assert(data.categories.length > 0, 'categories is empty');
  });
  
  test('items is array', () => {
    assertArray(data.items, 'items is not array');
    assert(data.items.length > 0, 'items is empty');
  });
  
  test('no duplicate item ids', () => {
    const ids = new Set();
    data.items.forEach((item, i) => {
      assert(!ids.has(item.id), `Duplicate id: ${item.id} at index ${i}`);
      ids.add(item.id);
    });
  });
  
  test('all item categories exist', () => {
    const catIds = new Set(data.categories.map(c => c.id));
    data.items.forEach(item => {
      if (item.category) {
        assert(catIds.has(item.category), `Unknown category: ${item.category}`);
      }
    });
  });
  
  console.log('');
  
  // Test 2: File Structure
  console.log(`  ${b('File Structure')}`);
  
  test('index.html exists', () => {
    assert(fs.existsSync('./index.html'), 'index.html not found');
  });
  
  test('index.html references ael-engine.css', () => {
    const html = fs.readFileSync('./index.html', 'utf-8');
    assert(html.includes('ael-engine.css'), 'ael-engine.css not referenced');
  });
  
  test('index.html references ael-engine.js', () => {
    const html = fs.readFileSync('./index.html', 'utf-8');
    assert(html.includes('ael-engine.js'), 'ael-engine.js not referenced');
  });
  
  test('README.md exists', () => {
    assert(fs.existsSync('./README.md'), 'README.md not found');
  });
  
  test('.gitignore exists', () => {
    assert(fs.existsSync('./.gitignore'), '.gitignore not found');
  });
  
  console.log('');
  
  // Test 3: Data Integrity
  console.log(`  ${b('Data Integrity')}`);
  
  test('glossary is array (if present)', () => {
    if (data.glossary) {
      assertArray(data.glossary, 'glossary is not array');
    }
  });
  
  test('roadmap is array (if present)', () => {
    if (data.roadmap) {
      assertArray(data.roadmap, 'roadmap is not array');
    }
  });
  
  test('all items have required fields', () => {
    data.items.forEach((item, i) => {
      assert(item.id, `items[${i}].id is missing`);
      assert(item.name || item.title, `items[${i}].name/title is missing`);
      assert(item.category, `items[${i}].category is missing`);
    });
  });
  
  test('all categories have required fields', () => {
    data.categories.forEach((cat, i) => {
      assert(cat.id, `categories[${i}].id is missing`);
      assert(cat.name, `categories[${i}].name is missing`);
    });
  });
  
  console.log('');
  
  // Summary
  console.log(HLINE);
  console.log('');
  
  if (failed === 0) {
    console.log(`  ${bgOk('PASS')}  ${g(`All ${total} tests passed.`)}\n`);
  } else {
    console.log(`  ${bgFail('FAIL')}  ${r(`${failed} of ${total} tests failed.`)}\n`);
    process.exit(1);
  }
}

function cmdPublish(args) {
  console.log(`\n  ${b('AEL Publish')} ${dim('v1.1.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  // Step 1: Validate
  console.log(`  ${c('1.')} Validating data.json ...`);
  if (!fs.existsSync('./data.json')) {
    console.error(`  ${r('Error:')} data.json not found.\n`);
    process.exit(1);
  }
  
  const data = loadJson('./data.json');
  const result = validateProjectData(data);
  
  if (!result.valid) {
    console.log(`  ${bgFail('ABORT')}  ${r('Fix validation errors first.')}\n`);
    process.exit(1);
  }
  console.log(`  ${g('✓')} Validation passed`);
  
  // Step 2: Build
  console.log(`  ${c('2.')} Building static site ...`);
  const builderPath = path.resolve(__dirname, '../builder/builder.js');
  if (fs.existsSync(builderPath)) {
    try {
      const builder = require(builderPath);
      const originalArgv = process.argv;
      process.argv = ['node', 'builder.js', '-o', './dist'];
      builder.main();
      process.argv = originalArgv;
      console.log(`  ${g('✓')} Build complete`);
    } catch (err) {
      console.log(`  ${y('⚠')} Build skipped: ${err.message}`);
    }
  } else {
    console.log(`  ${y('⚠')} Builder not found, skipping build`);
  }
  
  // Step 3: Git
  console.log(`  ${c('3.')} Checking git status ...`);
  const { execSync } = require('child_process');
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      console.log(`  ${y('⚠')} Uncommitted changes detected`);
      console.log(`  Run ${c('git add . && git commit')} before publishing`);
    } else {
      console.log(`  ${g('✓')} Working directory clean`);
    }
  } catch (err) {
    console.log(`  ${y('⚠')} Not a git repository`);
  }
  
  // Step 4: Summary
  console.log('');
  console.log(HLINE);
  console.log('');
  console.log(`  ${b('Publish Summary')}`);
  console.log(`  ${dim('Name:')}    ${data.meta?.name || 'N/A'}`);
  console.log(`  ${dim('Version:')} ${data.meta?.version || 'N/A'}`);
  console.log(`  ${dim('Items:')}   ${data.items?.length || 0}`);
  console.log('');
  
  if (data.meta?.repoUrl) {
    console.log(`  ${b('Publish to:')}`);
    console.log(`    ${c('git push')}                    Push to GitHub`);
    console.log(`    ${c('gh-pages -d dist')}            Deploy to GitHub Pages`);
    console.log(`    ${c('wrangler pages deploy dist')}   Deploy to Cloudflare`);
    console.log(`    ${c('netlify deploy --dir=dist')}    Deploy to Netlify`);
  } else {
    console.log(`  ${y('⚠')} Set ${b('meta.repoUrl')} in data.json for deployment instructions`);
  }
  console.log('');
}

function cmdDocs() {
  console.log(`\n  ${b('AEL Documentation Generator')} ${dim('v1.1.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  console.log(`  ${c('Generating documentation...')}\n`);
  
  // Create docs directory
  const docsDir = './docs';
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Generate Schema Documentation
  const schemaPath = path.resolve(__dirname, '../schema/schema.json');
  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const schemaDocs = `# AEL Reference Schema

> Official JSON Schema for AEL Engineering References

## Overview

${schema.description || 'No description available.'}

## Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| meta | object | Yes | Project metadata |
| categories | array | Yes | Category definitions |
| items | array | Yes | Reference items |
| glossary | array | No | Glossary terms |
| roadmap | array | No | Learning roadmap |

## Meta Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| name | string | Yes | Project name |
| shortName | string | Yes | Short identifier |
| version | string | Yes | Version number |
| description | string | No | Project description |

## Item Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Display name |
| category | string | Yes | Category ID |
| syntax | string | No | Command syntax |
| desc | string | No | Description |
| difficulty | string | No | beginner/intermediate/advanced |
| platforms | array | No | Supported platforms |
| related | array | No | Related items |
| refs | array | No | External references |
| flags | array | No | Command flags |
| examples | array | No | Usage examples |
| tip | string | No | Helpful tip |

---

Generated by AEL Documentation Generator
`;
    fs.writeFileSync(path.join(docsDir, 'schema.md'), schemaDocs);
    console.log(`  ${g('✓')} Schema documentation`);
  }
  
  // Generate CLI Documentation
  const cliDocs = `# AEL Reference CLI

> Command-line interface for AEL Engineering References

## Commands

| Command | Description |
|---------|-------------|
| \`ael create <name>\` | Create a new reference project |
| \`ael validate [path]\` | Validate a data.json file |
| \`ael compile [docs] [output]\` | Compile Markdown to data.json |
| \`ael build [options]\` | Build static site to dist/ |
| \`ael serve [port]\` | Start local dev server |
| \`ael test\` | Run test suite |
| \`ael info\` | Show project information |
| \`ael publish\` | Validate, build, and prepare for deployment |
| \`ael docs\` | Generate documentation |
| \`ael upgrade\` | Upgrade engine files to latest version |
| \`ael doctor\` | Check project health |
| \`ael help\` | Show help message |

## Examples

\`\`\`bash
# Create a new reference
ael create docker-reference

# Compile markdown to data.json
ael compile docs/ data.json

# Build static site
ael build --minify

# Start dev server
ael serve 8080

# Run tests
ael test

# Publish to GitHub Pages
ael publish
\`\`\`

## Build Options

| Option | Description |
|--------|-------------|
| \`--input, -i\` | Input data.json path |
| \`--output, -o\` | Output directory |
| \`--engine, -e\` | Engine directory |
| \`--base, -b\` | Base URL for deployment |
| \`--minify, -m\` | Minify HTML/CSS/JS |

---

Generated by AEL Documentation Generator
`;
  fs.writeFileSync(path.join(docsDir, 'cli.md'), cliDocs);
  console.log(`  ${g('✓')} CLI documentation`);
  
  // Generate API Documentation
  const apiDocs = `# AEL Public API

> Stable API for AEL Reference Engine

## Core Methods

### AEL.init()
Initialize the engine. Called automatically on DOM ready.

### AEL.render()
Re-render the reference with current data.

### AEL.destroy()
Destroy the engine and clean up resources.

## Data Methods

### AEL.getData()
Returns the loaded reference data object.

### AEL.search(query)
Search for items matching the query string.

### AEL.expandAll()
Expand all item cards.

### AEL.collapseAll()
Collapse all item cards.

## Export Methods

### AEL.exportPDF()
Export reference as PDF.

### AEL.exportMarkdown()
Export reference as Markdown.

### AEL.exportJSON()
Export reference as JSON.

## Plugin Methods

### AEL.use(plugin)
Install a plugin.

### AEL.uninstall(pluginName)
Uninstall a plugin.

### AEL.enable(pluginName)
Enable an installed plugin.

### AEL.disable(pluginName)
Disable an installed plugin.

### AEL.plugins()
List all installed plugins.

## Theme Methods

### AEL.theme.load(themeData)
Load a custom theme from an object.

### AEL.theme.loadFile(themePath)
Load a custom theme from a JSON file.

### AEL.theme.get()
Get the current theme.

### AEL.theme.getValue(path)
Get a specific theme value by dot-notation path.

### AEL.theme.reset()
Reset to default theme.

## Events

### AEL.events.on(event, callback, priority)
Subscribe to an event.

### AEL.events.off(event, callback)
Unsubscribe from an event.

### AEL.events.emit(event, data)
Emit an event.

### AEL.events.once(event, callback)
Subscribe to an event once.

## Lifecycle Events

| Event | Description |
|-------|-------------|
| before:init | Before engine initialization |
| after:init | After engine initialization |
| before:render | Before rendering |
| after:render | After rendering |
| before:search | Before search |
| after:search | After search |
| before:export | Before export |
| after:export | After export |
| on:data:load | When data is loaded |
| on:error | On error |
| on:theme:change | When theme changes |
| destroy | When engine is destroyed |

## Plugin Events

| Event | Description |
|-------|-------------|
| plugin:installed | After plugin is installed |
| plugin:uninstalling | Before plugin is uninstalled |
| plugin:uninstalled | After plugin is uninstalled |
| plugin:enabled | After plugin is enabled |
| plugin:disabled | After plugin is disabled |

---

Generated by AEL Documentation Generator
`;
  fs.writeFileSync(path.join(docsDir, 'api.md'), apiDocs);
  console.log(`  ${g('✓')} API documentation`);
  
  console.log('');
  console.log(HLINE);
  console.log('');
  console.log(`  ${bgOk('DONE')}  Documentation generated in ${b('docs/')} directory.`);
  console.log('');
  console.log(`  ${b('Files:')}`);
  console.log(`    ${c('docs/schema.md')}   Schema documentation`);
  console.log(`    ${c('docs/cli.md')}      CLI documentation`);
  console.log(`    ${c('docs/api.md')}      API documentation`);
  console.log('');
}

function cmdUpgrade() {
  console.log(`\n  ${b('AEL Upgrade')} ${dim('v1.1.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  const engineUrl = 'https://cdn.jsdelivr.net/gh/aymanelmasryael/ael-reference-engine@main';
  
  console.log(`  ${c('Upgrading engine files...')}\n`);
  
  const files = [
    { name: 'ael-engine.css', path: './ael-engine.css' },
    { name: 'ael-engine.js', path: './ael-engine.js' },
    { name: 'ael-engine.plugins.js', path: './ael-engine.plugins.js' },
    { name: 'ael-engine.themes.js', path: './ael-engine.themes.js' }
  ];
  
  const https = require('https');
  
  files.forEach(file => {
    const url = `${engineUrl}/${file.name}`;
    console.log(`  ${c('Downloading')} ${b(file.name)} ...`);
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => {
          fs.writeFileSync(file.path, Buffer.concat(data));
          console.log(`  ${g('✓')} ${file.name}`);
        });
      } else {
        console.log(`  ${r('✕')} ${file.name} (HTTP ${res.statusCode})`);
      }
    }).on('error', (err) => {
      console.log(`  ${r('✕')} ${file.name} (${err.message})`);
    });
  });
  
  console.log('');
  console.log(`  ${dim('Note:')} Run ${c('ael test')} to verify upgrade.`);
  console.log('');
}

function cmdDoctor() {
  console.log(`\n  ${b('AEL Doctor')} ${dim('v1.1.0')}\n`);
  console.log(HLINE);
  console.log('');
  
  let issues = 0;
  
  function check(name, fn) {
    const result = fn();
    if (result === true) {
      console.log(`  ${g('✓')} ${name}`);
    } else if (result === false) {
      console.log(`  ${r('✕')} ${name}`);
      issues++;
    } else {
      console.log(`  ${y('⚠')} ${name} — ${result}`);
    }
  }
  
  // Check Node.js version
  check('Node.js version >= 14', () => {
    const [major] = process.versions.node.split('.').map(Number);
    return major >= 14;
  });
  
  // Check data.json
  check('data.json exists', () => fs.existsSync('./data.json'));
  check('data.json is valid JSON', () => {
    try {
      JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
      return true;
    } catch {
      return false;
    }
  });
  
  // Check index.html
  check('index.html exists', () => fs.existsSync('./index.html'));
  check('index.html references ael-engine.css', () => {
    try {
      const html = fs.readFileSync('./index.html', 'utf-8');
      return html.includes('ael-engine.css');
    } catch {
      return 'index.html not found';
    }
  });
  check('index.html references ael-engine.js', () => {
    try {
      const html = fs.readFileSync('./index.html', 'utf-8');
      return html.includes('ael-engine.js');
    } catch {
      return 'index.html not found';
    }
  });
  
  // Check engine files
  check('ael-engine.css exists', () => fs.existsSync('./ael-engine.css'));
  check('ael-engine.js exists', () => fs.existsSync('./ael-engine.js'));
  check('ael-engine.plugins.js exists', () => fs.existsSync('./ael-engine.plugins.js'));
  check('ael-engine.themes.js exists', () => fs.existsSync('./ael-engine.themes.js'));
  
  // Check .gitignore
  check('.gitignore exists', () => fs.existsSync('./.gitignore'));
  
  // Check README
  check('README.md exists', () => fs.existsSync('./README.md'));
  
  // Check assets
  check('assets/ directory exists', () => fs.existsSync('./assets'));
  
  // Check for common issues
  check('No duplicate category IDs', () => {
    try {
      const data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
      const ids = new Set();
      for (const cat of data.categories || []) {
        if (ids.has(cat.id)) return false;
        ids.add(cat.id);
      }
      return true;
    } catch {
      return 'Could not check';
    }
  });
  
  check('No duplicate item IDs', () => {
    try {
      const data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
      const ids = new Set();
      for (const item of data.items || []) {
        if (ids.has(item.id)) return false;
        ids.add(item.id);
      }
      return true;
    } catch {
      return 'Could not check';
    }
  });
  
  console.log('');
  console.log(HLINE);
  console.log('');
  
  if (issues === 0) {
    console.log(`  ${bgOk('PASS')}  ${g('No issues found.')}\n`);
  } else {
    console.log(`  ${bgFail('FAIL')}  ${r(`${issues} issue(s) found.`)}\n`);
    console.log(`  Run ${c('ael create')} to re-initialize the project.\n`);
  }
}

function cmdHelp() {
  console.log('');
  console.log(`  ${b('AEL Reference CLI')} ${dim(`v${VERSION}`)}`);
  console.log(HLINE_LONG);
  console.log('');
  console.log(`  ${b('Project Commands:')}`);
  console.log(`    ${c('ael')} ${mag('create')}    ${mag('<name>')}          Create a new reference project`);
  console.log(`    ${c('ael')} ${mag('validate')}  ${dim('[path]')}           Validate a data.json file`);
  console.log(`    ${c('ael')} ${mag('info')}                          Show project information`);
  console.log(`    ${c('ael')} ${mag('doctor')}                        Check project health`);
  console.log('');
  console.log(`  ${b('Build Commands:')}`);
  console.log(`    ${c('ael')} ${mag('compile')}   ${dim('[docs] [output]')}  Compile Markdown to data.json`);
  console.log(`    ${c('ael')} ${mag('build')}     ${dim('[options]')}       Build static site to dist/`);
  console.log(`    ${c('ael')} ${mag('serve')}      ${dim('[port]')}           Start local dev server`);
  console.log(`    ${c('ael')} ${mag('publish')}                       Validate, build, prepare deploy`);
  console.log('');
  console.log(`  ${b('Quality Commands:')}`);
  console.log(`    ${c('ael')} ${mag('test')}                          Run test suite`);
  console.log(`    ${c('ael')} ${mag('docs')}                          Generate documentation`);
  console.log(`    ${c('ael')} ${mag('upgrade')}                       Upgrade engine files`);
  console.log(`    ${c('ael')} ${mag('help')}                          Show this help message`);
  console.log('');
  console.log(HLINE_LONG);
  console.log('');
  console.log(`  ${b('Examples:')}`);
  console.log(`    ${c('ael create docker-reference')}`);
  console.log(`    ${c('ael compile docs/ data.json')}`);
  console.log(`    ${c('ael build --minify')}`);
  console.log(`    ${c('ael serve 8080')}`);
  console.log(`    ${c('ael test')}`);
  console.log(`    ${c('ael publish')}`);
  console.log(`    ${c('ael doctor')}`);
  console.log('');
  console.log(`  ${dim('Docs:')} ${c('https://github.com/aymanelmasryael/ael-reference-engine')}`);
  console.log('');
}

// ─── CLI Router ─────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = (args[0] || '').toLowerCase();
  const commandArgs = args.slice(1);

  switch (command) {
    case 'create':
      cmdCreate(commandArgs);
      break;
    case 'validate':
    case 'check':
      cmdValidate(commandArgs);
      break;
    case 'compile':
      cmdCompile(commandArgs);
      break;
    case 'build':
      cmdBuildSite(commandArgs);
      break;
    case 'serve':
    case 'start':
      cmdServe(commandArgs);
      break;
    case 'test':
      cmdTest();
      break;
    case 'publish':
    case 'deploy':
      cmdPublish(commandArgs);
      break;
    case 'docs':
      cmdDocs();
      break;
    case 'upgrade':
      cmdUpgrade();
      break;
    case 'doctor':
      cmdDoctor();
      break;
    case 'info':
      cmdInfo();
      break;
    case 'help':
    case '--help':
    case '-h':
      cmdHelp();
      break;
    case '--version':
    case '-v':
      console.log(`\n  ${c('ael')} v${VERSION}\n`);
      break;
    case '':
      cmdHelp();
      break;
    default:
      console.error(`\n  ${r('Error:')} Unknown command ${b(command)}.`);
      console.log(`  Run ${c('ael help')} to see available commands.\n`);
      process.exit(1);
  }
}

main();
