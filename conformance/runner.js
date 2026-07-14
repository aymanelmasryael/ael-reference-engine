#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ARCK {
  constructor(options) {
    this.target = options.target || '.';
    this.specVersion = options.specVersion || '1.0';
    this.verbose = options.verbose || false;
    this.jsonOutput = options.json || false;
    this.htmlReport = options.report || false;
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  async run() {
    this.startTime = Date.now();

    console.log(this.formatHeader());

    await this.runCategory('Schema', this.schemaTests());
    await this.runCategory('Rendering', this.renderingTests());
    await this.runCategory('Plugin API', this.pluginApiTests());
    await this.runCategory('Theme API', this.themeApiTests());
    await this.runCategory('Public API', this.publicApiTests());
    await this.runCategory('Accessibility', this.accessibilityTests());
    await this.runCategory('Performance', this.performanceTests());
    await this.runCategory('Compatibility', this.compatibilityTests());

    this.endTime = Date.now();

    console.log(this.formatSummary());

    if (this.jsonOutput) this.generateJSON();
    if (this.htmlReport) this.generateHTML();

    const failed = this.results.filter(r => !r.pass && r.level === 'required');
    process.exit(failed.length > 0 ? 1 : 0);
  }

  async runCategory(name, tests) {
    console.log(`\n  ${name}`);
    console.log(`  ${'─'.repeat(40)}`);

    for (const test of tests) {
      const result = await this.runTest(test);
      this.results.push(result);

      const icon = result.pass ? '✓' : '✕';
      const color = result.pass ? '\x1b[32m' : '\x1b[31m';
      const level = result.level === 'required' ? '' : ` [${result.level}]`;

      console.log(`    ${color}${icon}\x1b[0m ${result.name}${level}`);

      if (!result.pass && this.verbose) {
        console.log(`      \x1b[33m${result.message}\x1b[0m`);
      }
    }
  }

  async runTest(test) {
    try {
      const pass = await test.fn();
      return {
        id: test.id,
        name: test.name,
        category: test.category,
        level: test.level || 'required',
        pass,
        message: pass ? 'PASS' : 'FAIL',
        details: test.details || null
      };
    } catch (err) {
      return {
        id: test.id,
        name: test.name,
        category: test.category,
        level: test.level || 'required',
        pass: false,
        message: err.message,
        details: null
      };
    }
  }

  schemaTests() {
    return [
      {
        id: 'schema-001',
        name: 'data.json exists',
        category: 'Schema',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, 'data.json'))
      },
      {
        id: 'schema-002',
        name: 'data.json is valid JSON',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8');
          JSON.parse(data);
          return true;
        }
      },
      {
        id: 'schema-003',
        name: 'meta section exists',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          return !!data.meta && typeof data.meta === 'object';
        }
      },
      {
        id: 'schema-004',
        name: 'meta.name is string',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          return typeof data.meta?.name === 'string' && data.meta.name.length > 0;
        }
      },
      {
        id: 'schema-005',
        name: 'meta.version is string',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          return typeof data.meta?.version === 'string' && data.meta.version.length > 0;
        }
      },
      {
        id: 'schema-006',
        name: 'categories is array',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          return Array.isArray(data.categories);
        }
      },
      {
        id: 'schema-007',
        name: 'items is array',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          return Array.isArray(data.items);
        }
      },
      {
        id: 'schema-008',
        name: 'no duplicate item ids',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          const ids = new Set();
          for (const item of data.items || []) {
            if (ids.has(item.id)) return false;
            ids.add(item.id);
          }
          return true;
        }
      },
      {
        id: 'schema-009',
        name: 'all items have required fields',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          for (const item of data.items || []) {
            if (!item.id || !item.name || !item.category) return false;
          }
          return true;
        }
      },
      {
        id: 'schema-010',
        name: 'all categories have required fields',
        category: 'Schema',
        level: 'required',
        fn: () => {
          const data = JSON.parse(fs.readFileSync(path.join(this.target, 'data.json'), 'utf-8'));
          for (const cat of data.categories || []) {
            if (!cat.id || !cat.name) return false;
          }
          return true;
        }
      }
    ];
  }

  renderingTests() {
    return [
      {
        id: 'render-001',
        name: 'index.html exists',
        category: 'Rendering',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, 'index.html'))
      },
      {
        id: 'render-002',
        name: 'index.html has #mainContent',
        category: 'Rendering',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('mainContent');
        }
      },
      {
        id: 'render-003',
        name: 'ael-engine.js is referenced',
        category: 'Rendering',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('ael-engine.js');
        }
      },
      {
        id: 'render-004',
        name: 'ael-engine.css is referenced',
        category: 'Rendering',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('ael-engine.css');
        }
      },
      {
        id: 'render-005',
        name: 'data.json is referenced',
        category: 'Rendering',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('data.json');
        }
      }
    ];
  }

  pluginApiTests() {
    return [
      {
        id: 'plugin-001',
        name: 'ael-engine.plugins.js exists',
        category: 'Plugin API',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, 'ael-engine.plugins.js'))
      },
      {
        id: 'plugin-002',
        name: 'AEL.use() is defined',
        category: 'Plugin API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('window.AEL') && js.includes('.use');
        }
      },
      {
        id: 'plugin-003',
        name: 'AEL.uninstall() is defined',
        category: 'Plugin API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('.uninstall');
        }
      },
      {
        id: 'plugin-004',
        name: 'AEL.hooks() is defined',
        category: 'Plugin API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('.hooks');
        }
      },
      {
        id: 'plugin-005',
        name: 'AEL.events is defined',
        category: 'Plugin API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('.events');
        }
      },
      {
        id: 'plugin-006',
        name: 'AEL.LIFECYCLE is defined',
        category: 'Plugin API',
        level: 'recommended',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('.LIFECYCLE');
        }
      },
      {
        id: 'plugin-007',
        name: 'EventBus.on() is defined',
        category: 'Plugin API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('.on') && js.includes('.off') && js.includes('.emit');
        }
      },
      {
        id: 'plugin-008',
        name: 'Plugin registry exists',
        category: 'Plugin API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.plugins.js'), 'utf-8');
          return js.includes('registry') && js.includes('Map');
        }
      }
    ];
  }

  themeApiTests() {
    return [
      {
        id: 'theme-001',
        name: 'ael-engine.themes.js exists',
        category: 'Theme API',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, 'ael-engine.themes.js'))
      },
      {
        id: 'theme-002',
        name: 'AEL.theme.load() is defined',
        category: 'Theme API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.themes.js'), 'utf-8');
          return js.includes('.load') && js.includes('.loadFile');
        }
      },
      {
        id: 'theme-003',
        name: 'AEL.theme.get() is defined',
        category: 'Theme API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.themes.js'), 'utf-8');
          return js.includes('.get') && js.includes('.getValue');
        }
      },
      {
        id: 'theme-004',
        name: 'AEL.theme.reset() is defined',
        category: 'Theme API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.themes.js'), 'utf-8');
          return js.includes('.reset');
        }
      },
      {
        id: 'theme-005',
        name: 'DEFAULT_THEME is defined',
        category: 'Theme API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.themes.js'), 'utf-8');
          return js.includes('DEFAULT_THEME') && js.includes('colors');
        }
      },
      {
        id: 'theme-006',
        name: 'CSS variables are generated',
        category: 'Theme API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.themes.js'), 'utf-8');
          return js.includes('--ael-color-') && js.includes('setProperty');
        }
      }
    ];
  }

  publicApiTests() {
    return [
      {
        id: 'api-001',
        name: 'AEL.init() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('window.AEL') && js.includes('.init');
        }
      },
      {
        id: 'api-002',
        name: 'AEL.render() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.render');
        }
      },
      {
        id: 'api-003',
        name: 'AEL.destroy() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.destroy');
        }
      },
      {
        id: 'api-004',
        name: 'AEL.getData() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.getData');
        }
      },
      {
        id: 'api-005',
        name: 'AEL.search() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.search');
        }
      },
      {
        id: 'api-006',
        name: 'AEL.expandAll() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.expandAll');
        }
      },
      {
        id: 'api-007',
        name: 'AEL.collapseAll() is defined',
        category: 'Public API',
        level: 'required',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.collapseAll');
        }
      },
      {
        id: 'api-008',
        name: 'AEL.exportPDF() is defined',
        category: 'Public API',
        level: 'recommended',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.exportPDF');
        }
      },
      {
        id: 'api-009',
        name: 'AEL.exportMarkdown() is defined',
        category: 'Public API',
        level: 'recommended',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.exportMarkdown');
        }
      },
      {
        id: 'api-010',
        name: 'AEL.exportJSON() is defined',
        category: 'Public API',
        level: 'recommended',
        fn: () => {
          const js = fs.readFileSync(path.join(this.target, 'ael-engine.js'), 'utf-8');
          return js.includes('.exportJSON');
        }
      }
    ];
  }

  accessibilityTests() {
    return [
      {
        id: 'a11y-001',
        name: 'HTML has lang attribute',
        category: 'Accessibility',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('lang=');
        }
      },
      {
        id: 'a11y-002',
        name: 'HTML has viewport meta',
        category: 'Accessibility',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('viewport');
        }
      },
      {
        id: 'a11y-003',
        name: 'HTML has charset',
        category: 'Accessibility',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('charset');
        }
      },
      {
        id: 'a11y-004',
        name: 'HTML has title',
        category: 'Accessibility',
        level: 'required',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('<title>');
        }
      },
      {
        id: 'a11y-005',
        name: 'HTML has meta description',
        category: 'Accessibility',
        level: 'recommended',
        fn: () => {
          const html = fs.readFileSync(path.join(this.target, 'index.html'), 'utf-8');
          return html.includes('description');
        }
      }
    ];
  }

  performanceTests() {
    return [
      {
        id: 'perf-001',
        name: 'engine.js is under 100KB',
        category: 'Performance',
        level: 'recommended',
        fn: () => {
          const stat = fs.statSync(path.join(this.target, 'ael-engine.js'));
          return stat.size < 100 * 1024;
        }
      },
      {
        id: 'perf-002',
        name: 'engine.css is under 50KB',
        category: 'Performance',
        level: 'recommended',
        fn: () => {
          const stat = fs.statSync(path.join(this.target, 'ael-engine.css'));
          return stat.size < 50 * 1024;
        }
      },
      {
        id: 'perf-003',
        name: 'plugins.js is under 30KB',
        category: 'Performance',
        level: 'recommended',
        fn: () => {
          const stat = fs.statSync(path.join(this.target, 'ael-engine.plugins.js'));
          return stat.size < 30 * 1024;
        }
      },
      {
        id: 'perf-004',
        name: 'themes.js is under 20KB',
        category: 'Performance',
        level: 'recommended',
        fn: () => {
          const stat = fs.statSync(path.join(this.target, 'ael-engine.themes.js'));
          return stat.size < 20 * 1024;
        }
      },
      {
        id: 'perf-005',
        name: 'data.json is under 500KB',
        category: 'Performance',
        level: 'recommended',
        fn: () => {
          const stat = fs.statSync(path.join(this.target, 'data.json'));
          return stat.size < 500 * 1024;
        }
      }
    ];
  }

  compatibilityTests() {
    return [
      {
        id: 'compat-001',
        name: 'README.md exists',
        category: 'Compatibility',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, 'README.md'))
      },
      {
        id: 'compat-002',
        name: 'LICENSE exists',
        category: 'Compatibility',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, 'LICENSE'))
      },
      {
        id: 'compat-003',
        name: '.gitignore exists',
        category: 'Compatibility',
        level: 'required',
        fn: () => fs.existsSync(path.join(this.target, '.gitignore'))
      },
      {
        id: 'compat-004',
        name: 'CHANGELOG.md exists',
        category: 'Compatibility',
        level: 'recommended',
        fn: () => fs.existsSync(path.join(this.target, 'CHANGELOG.md'))
      }
    ];
  }

  formatHeader() {
    return `
  \x1b[1mAEL Reference Conformance Kit (ARCK)\x1b[0m
  \x1b[2mv1.0.0 — Specification ${this.specVersion}\x1b[0m

  \x1b[2m${'─'.repeat(44)}\x1b[0m

  Target:  \x1b[36m${this.target}\x1b[0m
  Spec:    \x1b[36m${this.specVersion}\x1b[0m`;
  }

  formatSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;
    const required = this.results.filter(r => r.level === 'required');
    const requiredFailed = required.filter(r => !r.pass);

    const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);

    let output = `\n  \x1b[2m${'─'.repeat(44)}\x1b[0m\n\n`;
    output += `  \x1b[1mSummary\x1b[0m\n\n`;
    output += `  Total:       ${total} tests\n`;
    output += `  Passed:      \x1b[32m${passed}\x1b[0m\n`;
    output += `  Failed:      \x1b[31m${failed}\x1b[0m\n`;
    output += `  Duration:    ${duration}s\n\n`;

    if (requiredFailed.length === 0) {
      output += `  \x1b[42m\x1b[37m\x1b[1m CERTIFIED \x1b[0m  \x1b[32mAll required tests passed.\x1b[0m\n`;
    } else {
      output += `  \x1b[41m\x1b[37m\x1b[1m FAILED \x1b[0m     \x1b[31m${requiredFailed.length} required test(s) failed.\x1b[0m\n`;
    }

    output += `\n`;

    return output;
  }

  generateJSON() {
    const report = {
      engine: this.target,
      specification: this.specVersion,
      timestamp: new Date().toISOString(),
      duration: this.endTime - this.startTime,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.pass).length,
        failed: this.results.filter(r => !r.pass).length,
        certified: this.results.filter(r => r.level === 'required' && !r.pass).length === 0
      },
      results: this.results
    };

    const outputPath = path.join(this.target, 'conformance-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`  \x1b[32m✓\x1b[0m Report saved to ${outputPath}\n`);
  }

  generateHTML() {
    const certified = this.results.filter(r => r.level === 'required' && !r.pass).length === 0;
    const passed = this.results.filter(r => r.pass).length;
    const total = this.results.length;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEL Conformance Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; background: #0B1220; color: #E0E0E0; }
    h1 { color: #0074FF; }
    .certified { background: #00FF88; color: #000; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: bold; }
    .failed { background: #FF4444; color: #fff; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: bold; }
    .test { padding: 0.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .pass { color: #00FF88; }
    .fail { color: #FF4444; }
    .category { font-weight: bold; margin-top: 1.5rem; color: #0074FF; }
  </style>
</head>
<body>
  <h1>AEL Conformance Report</h1>
  <p>Engine: ${this.target}</p>
  <p>Specification: ${this.specVersion}</p>
  <p>Date: ${new Date().toISOString()}</p>
  <p>${certified ? '<span class="certified">CERTIFIED</span>' : '<span class="failed">NOT CERTIFIED</span>'}</p>
  <p>${passed} / ${total} tests passed</p>
  <h2>Results</h2>
  ${this.results.map(r => `
    <div class="test">
      <span class="${r.pass ? 'pass' : 'fail'}">${r.pass ? '✓' : '✕'}</span>
      ${r.name} [${r.level}]
    </div>
  `).join('')}
</body>
</html>`;

    const outputPath = path.join(this.target, 'conformance-report.html');
    fs.writeFileSync(outputPath, html);
    console.log(`  \x1b[32m✓\x1b[0m Report saved to ${outputPath}\n`);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
  \x1b[1mAEL Reference Conformance Kit (ARCK)\x1b[0m

  Usage:
    node runner.js [options]

  Options:
    --target, -t     Target engine directory (default: .)
    --spec, -s       Specification version (default: 1.0)
    --json, -j       Output JSON report
    --report, -r     Generate HTML report
    --verbose, -v    Verbose output
    --help, -h       Show help

  Examples:
    node runner.js
    node runner.js --target ./my-engine
    node runner.js --json --report
    node runner.js --verbose
`);
    process.exit(0);
  }

  const options = {
    target: getArg(args, '--target', '-t') || '.',
    specVersion: getArg(args, '--spec', '-s') || '1.0',
    json: args.includes('--json') || args.includes('-j'),
    report: args.includes('--report') || args.includes('-r'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  const arck = new ARCK(options);
  arck.run();
}

function getArg(args, long, short) {
  const idx = args.indexOf(long);
  if (idx !== -1) return args[idx + 1];
  const sIdx = args.indexOf(short);
  if (sIdx !== -1) return args[sIdx + 1];
  return null;
}

main();
