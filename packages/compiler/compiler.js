#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

class SimpleYAMLParser {
  static parse(content) {
    const lines = content.split("\n");
    const result = {};
    const stack = [{ target: result, indent: -1 }];

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const trimmed = raw.trimStart();

      if (trimmed === "" || trimmed.startsWith("#")) continue;

      const indent = raw.length - raw.trimStart().length;

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].target;

      if (trimmed.startsWith("- ")) {
        const itemContent = trimmed.substring(2);
        const colonIdx = itemContent.indexOf(":");

        if (colonIdx !== -1) {
          const key = itemContent.substring(0, colonIdx).trim();
          const val = itemContent.substring(colonIdx + 1).trim();
          const obj = { [key]: SimpleYAMLParser.parseValue(val) };

          if (Array.isArray(parent)) {
            parent.push(obj);
          }
          stack.push({ target: obj, indent: indent });
        } else {
          const item = SimpleYAMLParser.parseValue(itemContent);
          if (Array.isArray(parent)) {
            parent.push(item);
          }
        }
        continue;
      }

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue;

      const key = trimmed.substring(0, colonIdx).trim();
      const val = trimmed.substring(colonIdx + 1).trim();

      if (val === "") {
        const nextIndent = i + 1 < lines.length
          ? lines[i + 1].length - lines[i + 1].trimStart().length
          : indent + 1;
        if (nextIndent > indent && i + 1 < lines.length) {
          const nextTrimmed = lines[i + 1].trimStart();
          if (nextTrimmed.startsWith("- ")) {
            const arr = [];
            parent[key] = arr;
            stack.push({ target: arr, indent: indent + 1 });
          } else {
            const obj = {};
            parent[key] = obj;
            stack.push({ target: obj, indent: indent + 1 });
          }
        } else {
          parent[key] = null;
        }
      } else {
        parent[key] = SimpleYAMLParser.parseValue(val);
      }
    }

    return result;
  }

  static parseValue(str) {
    if (str === "") return "";
    if (str === "true") return true;
    if (str === "false") return false;
    if (str === "null" || str === "~") return null;

    if (
      (str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))
    ) {
      return str.slice(1, -1);
    }

    if (str.startsWith("[")) {
      return SimpleYAMLParser.parseInlineArray(str);
    }

    if (str.startsWith("{")) {
      return str;
    }

    if (/^-?\d+(\.\d+)?$/.test(str)) {
      return Number(str);
    }

    return str;
  }

  static parseInlineArray(str) {
    str = str.trim();
    if (str === "[]") return [];

    const inner = str.slice(1, -1).trim();
    const items = [];
    let current = "";
    let depth = 0;
    let inQuote = false;
    let quoteChar = "";

    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];

      if (!inQuote && (ch === '"' || ch === "'")) {
        inQuote = true;
        quoteChar = ch;
        current += ch;
        continue;
      }
      if (inQuote && ch === quoteChar) {
        inQuote = false;
        current += ch;
        continue;
      }
      if (inQuote) {
        current += ch;
        continue;
      }
      if (ch === "[") { depth++; current += ch; continue; }
      if (ch === "]") { depth--; current += ch; continue; }
      if (ch === "," && depth === 0) {
        items.push(SimpleYAMLParser.parseValue(current.trim()));
        current = "";
        continue;
      }
      current += ch;
    }

    if (current.trim()) {
      items.push(SimpleYAMLParser.parseValue(current.trim()));
    }

    return items;
  }
}

class AELValidator {
  constructor(meta, categories, items) {
    this.meta = meta;
    this.categories = categories;
    this.items = items;
    this.errors = [];
    this.warnings = [];
  }

  validate() {
    this.validateMeta();
    this.validateCategories();
    this.validateItems();
    this.validateReferences();
    this.validateDuplicateItems();

    return { errors: this.errors, warnings: this.warnings };
  }

  validateMeta() {
    if (!this.meta) {
      this.errors.push("Metadata object is missing");
      return;
    }

    const required = ["name", "shortName", "version", "description"];
    for (const field of required) {
      if (!this.meta[field]) {
        this.errors.push(`Missing required meta field: ${field}`);
      }
    }
  }

  validateCategories() {
    if (!Array.isArray(this.categories)) {
      this.errors.push("Categories must be an array");
      return;
    }

    for (const cat of this.categories) {
      if (!cat.id) {
        this.errors.push(`Category missing "id" field: ${JSON.stringify(cat)}`);
      }
      if (!cat.name) {
        this.warnings.push(`Category "${cat.id}" missing "name"`);
      }
      if (!cat.icon) {
        this.warnings.push(`Category "${cat.id}" missing "icon"`);
      }
      if (!cat.color) {
        this.warnings.push(`Category "${cat.id}" missing "color"`);
      }
    }
  }

  validateItems() {
    const categoryIds = new Set(this.categories.map((c) => c.id));

    for (const item of this.items) {
      if (!item.name) {
        this.errors.push(
          `Item in "${item._sourceFile}" missing "name" field`
        );
        continue;
      }

      if (!item.category) {
        this.warnings.push(`Item "${item.name}" missing "category"`);
      } else if (!categoryIds.has(item.category)) {
        this.warnings.push(
          `Item "${item.name}" references unknown category "${item.category}"`
        );
      }

      if (!item.desc) {
        this.warnings.push(`Item "${item.name}" missing "desc"`);
      }

      if (!item.syntax) {
        this.warnings.push(`Item "${item.name}" missing "syntax"`);
      }

      if (item.difficulty) {
        const valid = ["beginner", "intermediate", "advanced"];
        if (!valid.includes(String(item.difficulty).toLowerCase())) {
          this.warnings.push(
            `Item "${item.name}" has unknown difficulty "${item.difficulty}"`
          );
        }
      }

      if (item.flags && !Array.isArray(item.flags)) {
        this.warnings.push(`Item "${item.name}" has non-array "flags"`);
      }

      if (item.examples && !Array.isArray(item.examples)) {
        this.warnings.push(`Item "${item.name}" has non-array "examples"`);
      }

      if (item.refs && !Array.isArray(item.refs)) {
        this.warnings.push(`Item "${item.name}" has non-array "refs"`);
      }
    }
  }

  validateReferences() {
    const itemNames = new Set(this.items.map((i) => i.name));

    for (const item of this.items) {
      if (Array.isArray(item.related)) {
        for (const ref of item.related) {
          if (!itemNames.has(ref)) {
            this.warnings.push(
              `Item "${item.name}" references unknown related item "${ref}"`
            );
          }
        }
      }
    }
  }

  validateDuplicateItems() {
    const seen = new Map();

    for (const item of this.items) {
      if (!item.name) continue;
      if (seen.has(item.name)) {
        this.errors.push(
          `Duplicate item "${item.name}": "${seen.get(item.name)._sourceFile}" and "${item._sourceFile}"`
        );
      } else {
        seen.set(item.name, item);
      }
    }
  }
}

class AELCompiler {
  constructor(docsDir) {
    this.docsDir = path.resolve(docsDir);
    this.meta = null;
    this.categories = [];
    this.glossary = [];
    this.roadmap = [];
    this.items = [];
    this.errors = [];
    this.warnings = [];
  }

  async compile() {
    this.banner();
    this.step("Loading metadata...");
    this.loadMeta();
    this.step("Loading categories...");
    this.loadCategories();
    this.step("Loading glossary...");
    this.loadGlossary();
    this.step("Loading roadmap...");
    this.loadRoadmap();
    this.step("Scanning items...");
    this.scanItems();
    this.step("Validating...");
    this.runValidation();
    this.step("Writing data.json...");
    this.writeOutput();
  }

  banner() {
    console.log("");
    console.log("  AEL Data Compiler v1.0.0");
    console.log("  ─────────────────────────");
    console.log("");
  }

  step(msg) {
    process.stdout.write(`  ${msg} `);
  }

  ok(extra) {
    console.log(`✓${extra ? " " + extra : ""}`);
  }

  warn(msg) {
    console.warn(`  ⚠ ${msg}`);
  }

  fail(msg) {
    console.error(`  ✗ ${msg}`);
  }

  loadMeta() {
    const p = path.join(this.docsDir, "_meta.json");

    if (!fs.existsSync(p)) {
      this.fail(`Missing required _meta.json at ${p}`);
      this.errors.push("Missing _meta.json");
      this.ok("");
      return;
    }

    try {
      this.meta = JSON.parse(fs.readFileSync(p, "utf-8"));
      this.ok(`(${this.meta.shortName || "?"} v${this.meta.version || "?"})`);
    } catch (err) {
      this.fail(`Invalid _meta.json: ${err.message}`);
      this.errors.push(`Invalid _meta.json: ${err.message}`);
      this.ok("");
    }
  }

  loadCategories() {
    const p = path.join(this.docsDir, "_categories.json");

    if (!fs.existsSync(p)) {
      this.fail(`Missing required _categories.json at ${p}`);
      this.errors.push("Missing _categories.json");
      this.ok("");
      return;
    }

    try {
      this.categories = JSON.parse(fs.readFileSync(p, "utf-8"));
      this.ok(`(${this.categories.length} categories)`);
    } catch (err) {
      this.fail(`Invalid _categories.json: ${err.message}`);
      this.errors.push(`Invalid _categories.json: ${err.message}`);
      this.ok("");
    }
  }

  loadGlossary() {
    const p = path.join(this.docsDir, "_glossary.md");

    if (!fs.existsSync(p)) {
      this.glossary = [];
      this.ok("(0 terms, file not found)");
      return;
    }

    try {
      this.glossary = this.parseGlossary(fs.readFileSync(p, "utf-8"));
      this.ok(`(${this.glossary.length} terms)`);
    } catch (err) {
      this.glossary = [];
      this.warn(`Glossary parse error: ${err.message}`);
      this.ok("(0 terms)");
    }
  }

  loadRoadmap() {
    const p = path.join(this.docsDir, "_roadmap.json");

    if (!fs.existsSync(p)) {
      this.roadmap = [];
      this.ok("(0 steps, file not found)");
      return;
    }

    try {
      this.roadmap = JSON.parse(fs.readFileSync(p, "utf-8"));
      this.ok(`(${this.roadmap.length} steps)`);
    } catch (err) {
      this.roadmap = [];
      this.warn(`Roadmap parse error: ${err.message}`);
      this.ok("(0 steps)");
    }
  }

  scanItems() {
    const mdFiles = this.findMarkdownFiles(this.docsDir);

    const itemFiles = mdFiles.filter((f) => !path.basename(f).startsWith("_"));

    for (const filePath of itemFiles) {
      try {
        const item = this.parseItemFile(filePath);
        if (item) {
          this.items.push(item);
        }
      } catch (err) {
        const rel = path.relative(this.docsDir, filePath);
        this.errors.push(`Parse error in ${rel}: ${err.message}`);
      }
    }

    this.ok(`(${this.items.length} items)`);
  }

  findMarkdownFiles(dir) {
    const results = [];

    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push(...this.findMarkdownFiles(full));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(full);
      }
    }

    return results;
  }

  parseItemFile(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data, body } = this.parseFrontmatter(content);

    const rel = path.relative(this.docsDir, filePath);
    const parts = rel.split(path.sep);

    const dirCategory = parts.length >= 2 ? parts[0] : null;

    return {
      ...data,
      category: data.category || dirCategory,
      body: body,
      _sourceFile: rel,
    };
  }

  parseFrontmatter(content) {
    const delim = "---";
    const first = content.indexOf(delim);

    if (first === -1) {
      return { data: {}, body: content.trim() };
    }

    const second = content.indexOf(delim, first + delim.length);

    if (second === -1) {
      return { data: {}, body: content.trim() };
    }

    const yamlStr = content.substring(first + delim.length, second).trim();
    const body = content.substring(second + delim.length).trim();

    let data;
    try {
      data = SimpleYAMLParser.parse(yamlStr);
    } catch (err) {
      throw new Error(`YAML parse error at position ${err.line || "?"}: ${err.message}`);
    }

    if (data.platforms && !Array.isArray(data.platforms)) {
      data.platforms = [data.platforms];
    }
    if (data.related && !Array.isArray(data.related)) {
      data.related = [data.related];
    }
    if (data.flags && !Array.isArray(data.flags)) {
      data.flags = [data.flags];
    }
    if (data.examples && !Array.isArray(data.examples)) {
      data.examples = [data.examples];
    }
    if (data.refs && !Array.isArray(data.refs)) {
      data.refs = [data.refs];
    }

    return { data, body };
  }

  parseGlossary(content) {
    const terms = [];
    const lines = content.split("\n");
    let currentTerm = null;
    let currentDesc = [];

    const flush = () => {
      if (currentTerm) {
        terms.push({
          term: currentTerm,
          desc: currentDesc.join("\n").trim(),
        });
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        flush();
        currentTerm = trimmed.substring(2).trim();
        currentDesc = [];
      } else if (trimmed.startsWith("## ")) {
        flush();
        currentTerm = trimmed.substring(3).trim();
        currentDesc = [];
      } else if (currentTerm && trimmed !== "") {
        currentDesc.push(trimmed);
      }
    }

    flush();
    return terms;
  }

  runValidation() {
    const validator = new AELValidator(this.meta, this.categories, this.items);
    const { errors, warnings } = validator.validate();

    this.errors.push(...errors);
    this.warnings.push(...warnings);

    if (errors.length === 0 && warnings.length === 0) {
      this.ok("No errors or warnings");
    } else {
      console.log("");

      if (errors.length > 0) {
        this.fail(`${errors.length} error(s):`);
        for (const e of errors) {
          console.error(`    • ${e}`);
        }
      }

      if (warnings.length > 0) {
        this.warn(`${warnings.length} warning(s):`);
        for (const w of warnings) {
          console.warn(`    • ${w}`);
        }
      }

      console.log("");
      if (errors.length === 0) {
        this.ok(`${warnings.length} warning(s) accepted`);
      }
    }
  }

  writeOutput() {
    const itemsByCategory = {};

    for (const cat of this.categories) {
      itemsByCategory[cat.id] = [];
    }

    for (const item of this.items) {
      const cid = item.category;

      if (!itemsByCategory[cid]) {
        itemsByCategory[cid] = [];
      }

      itemsByCategory[cid].push(item);
    }

    for (const cid in itemsByCategory) {
      itemsByCategory[cid].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    }

    const output = {
      meta: this.meta,
      categories: this.categories,
      itemsByCategory,
      items: this.items,
      glossary: this.glossary,
      roadmap: this.roadmap,
      stats: {
        totalItems: this.items.length,
        totalCategories: this.categories.length,
        totalGlossaryTerms: this.glossary.length,
        totalRoadmapSteps: this.roadmap.length,
      },
      compiledAt: new Date().toISOString(),
    };

    const json = JSON.stringify(output, null, 2);
    const outPath = path.resolve("data.json");

    fs.writeFileSync(outPath, json, "utf-8");

    const size = fs.statSync(outPath).size;
    const kb = (size / 1024).toFixed(1);

    console.log("");
    this.ok(
      `data.json written → ${outPath} (${kb} KB, ${this.items.length} items, ${this.categories.length} categories)`
    );
    console.log("");

    if (this.errors.length > 0) {
      console.error(
        `  Compilation failed with ${this.errors.length} error(s)\n`
      );
      process.exit(1);
    }

    if (this.warnings.length > 0) {
      console.warn(
        `  Completed with ${this.warnings.length} warning(s)\n`
      );
    } else {
      console.log("  Build successful.\n");
    }
  }
}

class AELCompilerCLI {
  static async run() {
    const args = process.argv.slice(2);

    if (args.includes("--help") || args.includes("-h")) {
      console.log(`
  AEL Data Compiler

  Usage:
    node compiler.js [docs-dir] [output-file]

  Arguments:
    docs-dir     Path to the docs directory (default: "docs")
    output-file  Output file path (default: "data.json")

  Options:
    -h, --help   Show this help message

  Description:
    Compiles Markdown files with YAML frontmatter into a single
    data.json file for the AEL Reference Engine.

  Input structure:
    docs/
    ├── _meta.json
    ├── _categories.json
    ├── _glossary.md
    ├── _roadmap.json
    └── <category>/
        └── <item>.md
`);
      process.exit(0);
    }

    const docsDir = args[0] || "docs";
    const compiler = new AELCompiler(docsDir);

    try {
      await compiler.compile();
    } catch (err) {
      console.error(`\n  COMPILATION FAILED\n  ${err.message}\n`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  AELCompilerCLI.run();
}

module.exports = { AELCompiler, SimpleYAMLParser, AELValidator };
