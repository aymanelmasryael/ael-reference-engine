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

function cmdHelp() {
  console.log('');
  console.log(`  ${b('AEL Reference CLI')} ${dim(`v${VERSION}`)}`);
  console.log(HLINE_LONG);
  console.log('');
  console.log(`  ${b('Project Commands:')}`);
  console.log(`    ${c('ael')} ${mag('create')}    ${mag('<name>')}          Create a new reference project`);
  console.log(`    ${c('ael')} ${mag('validate')}  ${dim('[path]')}           Validate a data.json file`);
  console.log(`    ${c('ael')} ${mag('info')}                          Show project information`);
  console.log('');
  console.log(`  ${b('Build Commands:')}`);
  console.log(`    ${c('ael')} ${mag('compile')}   ${dim('[docs] [output]')}  Compile Markdown to data.json`);
  console.log(`    ${c('ael')} ${mag('build')}     ${dim('[options]')}       Build static site to dist/`);
  console.log(`    ${c('ael')} ${mag('serve')}      ${dim('[port]')}           Start local dev server`);
  console.log('');
  console.log(`  ${b('Quality Commands:')}`);
  console.log(`    ${c('ael')} ${mag('test')}                          Run test suite`);
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
