#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.0';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, icon, message) {
  console.log(`${COLORS[color]}${icon}${COLORS.reset} ${message}`);
}

function success(message) { log('green', '✓', message); }
function warn(message) { log('yellow', '⚠', message); }
function fatal(message) { log('red', '✗', message); }

function printHelp() {
  console.log(`
${COLORS.bold}AEL Static Site Builder v${VERSION}${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node builder.js [options]

${COLORS.cyan}Options:${COLORS.reset}
  --input, -i     Input data.json path (default: ./data.json)
  --output, -o    Output directory (default: ./dist)
  --engine, -e    Engine directory (default: auto-detect)
  --base, -b      Base URL for deployment (default: /)
  --minify, -m    Minify HTML/CSS/JS (default: false)
  --help, -h      Show this help

${COLORS.cyan}Examples:${COLORS.reset}
  node builder.js
  node builder.js -i ./my-data.json -o ./build
  node builder.js --minify --base /my-project/
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: './data.json',
    output: './dist',
    engine: null,
    base: '/',
    minify: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--input': case '-i':
        options.input = args[++i];
        break;
      case '--output': case '-o':
        options.output = args[++i];
        break;
      case '--engine': case '-e':
        options.engine = args[++i];
        break;
      case '--base': case '-b':
        options.base = args[++i];
        break;
      case '--minify': case '-m':
        options.minify = true;
        break;
      case '--help': case '-h':
        printHelp();
        process.exit(0);
        default:
        fatal(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

function detectEngineDir() {
  const scriptDir = __dirname;
  const candidates = [
    path.join(scriptDir, '..', 'packages', 'engine'),
    path.join(scriptDir, '..', 'engine'),
    path.join(scriptDir, '..', '..', 'packages', 'engine'),
    path.join(scriptDir),
    path.join(scriptDir, 'engine'),
  ];

  for (const candidate of candidates) {
    const cssPath = path.join(candidate, 'ael-engine.css');
    const jsPath = path.join(candidate, 'ael-engine.js');
    if (fs.existsSync(cssPath) && fs.existsSync(jsPath)) {
      return candidate;
    }
  }

  return null;
}

function validateData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('data.json must be a JSON object');
    return errors;
  }

  if (!data.meta || typeof data.meta !== 'object') {
    errors.push('Missing or invalid "meta" object');
  } else {
    if (!data.meta.name || typeof data.meta.name !== 'string') {
      errors.push('meta.name is required and must be a string');
    }
    if (!data.meta.description || typeof data.meta.description !== 'string') {
      errors.push('meta.description is required and must be a string');
    }
    if (!data.meta.version || typeof data.meta.version !== 'string') {
      errors.push('meta.version is required and must be a string');
    }
  }

  if (!Array.isArray(data.categories)) {
    errors.push('Missing or invalid "categories" array');
  } else {
    for (let i = 0; i < data.categories.length; i++) {
      const cat = data.categories[i];
      if (!cat || typeof cat !== 'object') {
        errors.push(`categories[${i}] must be an object`);
        continue;
      }
      if (!cat.id || typeof cat.id !== 'string') {
        errors.push(`categories[${i}].id is required and must be a string`);
      }
      if (!cat.name || typeof cat.name !== 'string') {
        errors.push(`categories[${i}].name is required and must be a string`);
      }
      if (Array.isArray(cat.items)) {
        for (let j = 0; j < cat.items.length; j++) {
          const item = cat.items[j];
          if (!item || typeof item !== 'object') {
            errors.push(`categories[${i}].items[${j}] must be an object`);
            continue;
          }
          if (!item.id || typeof item.id !== 'string') {
            errors.push(`categories[${i}].items[${j}].id is required and must be a string`);
          }
          if (!item.name || typeof item.name !== 'string') {
            errors.push(`categories[${i}].items[${j}].name is required and must be a string`);
          }
        }
      }
    }
  }

  return errors;
}

function getDirSize(dirPath) {
  let totalSize = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      totalSize += getDirSize(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      totalSize += stats.size;
    }
  }
  return totalSize;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .trim();
}

function minifyJS(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,=+\-<>!&|?])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minifyHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+\/>/g, '/>')
    .trim();
}

function generateSitemap(data, baseUrl) {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += `  <url>\n    <loc>${base}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      if (cat && cat.id) {
        xml += `  <url>\n    <loc>${base}#${cat.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }
    }
  }

  xml += '</urlset>\n';
  return xml;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Sitemap: /sitemap.xml
`;
}

function generateIndexHTML(data, cssContent, jsContent, baseUrl) {
  const meta = data.meta || {};
  const name = meta.name || 'AEL Reference';
  const description = meta.description || '';
  const version = meta.version || '1.0.0';
  const repoUrl = meta.repoUrl || '';

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const dataJSON = JSON.stringify(data, null, 2);

  let html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(name)}</title>
  <meta name="description" content="${escapeHTML(description)}">
  <meta name="version" content="${escapeHTML(version)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHTML(name)}">
  <meta property="og:description" content="${escapeHTML(description)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${escapeHTML(repoUrl)}/assets/og-image.png">
  <meta property="og:site_name" content="${escapeHTML(name)}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(name)}">
  <meta name="twitter:description" content="${escapeHTML(description)}">
  <meta name="twitter:image" content="${escapeHTML(repoUrl)}/assets/og-image.png">

  <!-- Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(structuredData, null, 2)}
  </script>

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="apple-touch-icon" href="assets/apple-touch-icon.png">

  <!-- Engine CSS (inlined) -->
  <style id="ael-engine-css">
${cssContent}
  </style>
</head>
<body>
  <div id="app"></div>

  <!-- Data (inlined) -->
  <script>
    window.AEL_DATA = ${dataJSON};
  </script>

  <!-- Engine JS (inlined) -->
  <script id="ael-engine-js">
${jsContent}
  </script>
</body>
</html>`;

  return html;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function copyAssets(assetsSource, assetsDest) {
  if (!fs.existsSync(assetsSource)) {
    warn('Assets directory not found, skipping');
    return 0;
  }

  fs.mkdirSync(assetsDest, { recursive: true });

  let count = 0;
  const entries = fs.readdirSync(assetsSource, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(assetsSource, entry.name);
    const destPath = path.join(assetsDest, entry.name);
    if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

async function build() {
  const startTime = Date.now();
  const options = parseArgs();

  console.log(`${COLORS.bold}AEL Static Site Builder v${VERSION}${COLORS.reset}`);
  console.log(`${COLORS.dim}${'─'.repeat(30)}${COLORS.reset}\n`);

  // Load data.json
  console.log(`${COLORS.cyan}Loading data.json...${COLORS.reset}`);
  const inputPath = path.resolve(options.input);
  if (!fs.existsSync(inputPath)) {
    fatal(`data.json not found at: ${inputPath}`);
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(inputPath, 'utf-8');
    data = JSON.parse(raw);
    success('Loaded data.json');
  } catch (err) {
    fatal(`Failed to parse data.json: ${err.message}`);
    process.exit(1);
  }

  // Validate data
  console.log(`\n${COLORS.cyan}Validating data...${COLORS.reset}`);
  const validationErrors = validateData(data);
  if (validationErrors.length > 0) {
    fatal('Validation failed:');
    for (const err of validationErrors) {
      console.log(`  ${COLORS.red}• ${err}${COLORS.reset}`);
    }
    process.exit(1);
  }
  success('Data is valid');

  // Detect engine directory
  console.log(`\n${COLORS.cyan}Detecting engine files...${COLORS.reset}`);
  let engineDir = options.engine ? path.resolve(options.engine) : detectEngineDir();
  let cssContent = '';
  let jsContent = '';
  let engineFound = false;

  if (engineDir) {
    const cssPath = path.join(engineDir, 'ael-engine.css');
    const jsPath = path.join(engineDir, 'ael-engine.js');

    if (fs.existsSync(cssPath)) {
      cssContent = fs.readFileSync(cssPath, 'utf-8');
      engineFound = true;
    } else {
      warn(`ael-engine.css not found in ${engineDir}`);
    }

    if (fs.existsSync(jsPath)) {
      jsContent = fs.readFileSync(jsPath, 'utf-8');
      engineFound = true;
    } else {
      warn(`ael-engine.js not found in ${engineDir}`);
    }

    if (engineFound) {
      success('Engine files loaded');
    }
  }

  if (!engineFound) {
    warn('Engine files not found, using empty fallback');
    cssContent = '/* AEL Engine CSS not found */';
    jsContent = '/* AEL Engine JS not found */';
  }

  // Create dist directory
  console.log(`\n${COLORS.cyan}Creating dist/...${COLORS.reset}`);
  const distDir = path.resolve(options.output);
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
  success('Created dist/ directory');

  // Generate index.html
  console.log(`\n${COLORS.cyan}Generating index.html...${COLORS.reset}`);
  let finalCSS = cssContent;
  let finalJS = jsContent;

  if (options.minify) {
    finalCSS = minifyCSS(cssContent);
    finalJS = minifyJS(jsContent);
  }

  let html = generateIndexHTML(data, finalCSS, finalJS, options.base);

  if (options.minify) {
    html = minifyHTML(html);
  }

  const htmlPath = path.join(distDir, 'index.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  const htmlSize = fs.statSync(htmlPath).size;
  success(`Generated index.html (${formatSize(htmlSize)}, standalone, inlined)`);

  // Copy data.json
  console.log(`\n${COLORS.cyan}Copying data.json...${COLORS.reset}`);
  fs.writeFileSync(path.join(distDir, 'data.json'), JSON.stringify(data, null, 2), 'utf-8');
  success('Copied data.json');

  // Copy engine files
  console.log(`\n${COLORS.cyan}Copying engine files...${COLORS.reset}`);
  if (engineDir) {
    const cssSrc = path.join(engineDir, 'ael-engine.css');
    const jsSrc = path.join(engineDir, 'ael-engine.js');

    if (fs.existsSync(cssSrc)) {
      const destCss = path.join(distDir, 'ael-engine.css');
      fs.copyFileSync(cssSrc, destCss);
      success(`Copied ael-engine.css (${formatSize(fs.statSync(destCss).size)})`);
    }

    if (fs.existsSync(jsSrc)) {
      const destJs = path.join(distDir, 'ael-engine.js');
      fs.copyFileSync(jsSrc, destJs);
      success(`Copied ael-engine.js (${formatSize(fs.statSync(destJs).size)})`);
    }
  } else {
    warn('Engine files not available to copy');
  }

  // Copy assets
  console.log(`\n${COLORS.cyan}Copying assets...${COLORS.reset}`);
  const assetsSource = engineDir ? path.join(engineDir, 'assets') : path.join(process.cwd(), 'assets');
  const assetsDest = path.join(distDir, 'assets');
  const assetsCopied = copyAssets(assetsSource, assetsDest);

  if (assetsCopied > 0) {
    success(`Copied ${assetsCopied} asset(s)`);
  } else {
    warn('No assets to copy');
  }

  // Copy CNAME if exists
  const cnameSource = engineDir ? path.join(engineDir, 'CNAME') : path.join(process.cwd(), 'CNAME');
  if (fs.existsSync(cnameSource)) {
    fs.copyFileSync(cnameSource, path.join(distDir, 'CNAME'));
    success('Copied CNAME');
  }

  // Generate sitemap.xml
  console.log(`\n${COLORS.cyan}Generating sitemap.xml...${COLORS.reset}`);
  const sitemap = generateSitemap(data, options.base);
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf-8');
  success('Generated sitemap.xml');

  // Generate robots.txt
  console.log(`\n${COLORS.cyan}Generating robots.txt...${COLORS.reset}`);
  const robots = generateRobotsTxt();
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf-8');
  success('Generated robots.txt');

  // Build summary
  const totalSize = getDirSize(distDir);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const categoryCount = Array.isArray(data.categories) ? data.categories.length : 0;
  let itemCount = 0;
  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      if (Array.isArray(cat.items)) {
        itemCount += cat.items.length;
      }
    }
  }

  console.log(`\n${COLORS.bold}Build Summary:${COLORS.reset}`);
  console.log(`  Name:        ${data.meta?.name || 'N/A'}`);
  console.log(`  Version:     ${data.meta?.version || 'N/A'}`);
  console.log(`  Categories:  ${categoryCount}`);
  console.log(`  Items:       ${itemCount}+`);
  console.log(`  Output:      ${options.output}/ (${formatSize(totalSize)})`);
  console.log(`  Time:        ${elapsed}s`);

  console.log(`\n${COLORS.green}${COLORS.bold}  ✓ Build complete! Ready for deployment.${COLORS.reset}`);

  console.log(`\n${COLORS.cyan}Deploy to:${COLORS.reset}`);
  console.log(`  GitHub Pages:     gh-pages -d ${options.output}`);
  console.log(`  Cloudflare Pages: wrangler pages deploy ${options.output}`);
  console.log(`  Netlify:          netlify deploy --dir=${options.output}`);
  console.log('');
}

build().catch((err) => {
  fatal(`Build failed: ${err.message}`);
  process.exit(1);
});