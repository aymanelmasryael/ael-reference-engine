const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const REQUIRED_META_FIELDS = ["name", "shortName", "description", "version", "repoUrl"];
const OPTIONAL_META_FIELDS = ["demoUrl", "author", "license", "tags"];

const REQUIRED_TOP_FIELDS = ["meta", "categories", "items", "glossary", "roadmap"];

class AELValidator {
  constructor(data) {
    this.data = data;
    this.errors = [];
    this.warnings = [];
  }

  validate() {
    this.errors = [];
    this.warnings = [];
    this.validateSchema();
    this.validateSemantic();
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        categories: this.data?.categories?.length || 0,
        items: this.data?.items?.length || 0,
        glossary: this.data?.glossary?.length || 0,
      },
    };
  }

  // ─── Schema Validation ───────────────────────────────────────────────

  validateSchema() {
    if (!this.data || typeof this.data !== "object") {
      this.addError("INVALID_TYPE", "Root data must be an object", "root");
      return;
    }

    this.validateTopLevelFields();
    this.validateMeta();
    this.validateCategories();
    this.validateItems();
    this.validateGlossary();
    this.validateRoadmap();
  }

  validateTopLevelFields() {
    for (const field of REQUIRED_TOP_FIELDS) {
      if (!(field in this.data)) {
        this.addError("MISSING_FIELD", `${field} is required`, field);
      }
    }

    for (const key of Object.keys(this.data)) {
      if (!REQUIRED_TOP_FIELDS.includes(key)) {
        this.addError(
          "INVALID_FORMAT",
          `Unexpected top-level property: "${key}"`,
          key,
        );
      }
    }

    if (Array.isArray(this.data.categories) && this.data.categories.length === 0) {
      this.addError("EMPTY_ARRAY", "categories array must not be empty", "categories");
    }

    if (Array.isArray(this.data.items) && this.data.items.length === 0) {
      this.addError("EMPTY_ARRAY", "items array must not be empty", "items");
    }

    if (Array.isArray(this.data.glossary) && this.data.glossary.length === 0) {
      this.addError("EMPTY_ARRAY", "glossary array must not be empty", "glossary");
    }

    if (Array.isArray(this.data.roadmap) && this.data.roadmap.length === 0) {
      this.addError("EMPTY_ARRAY", "roadmap array must not be empty", "roadmap");
    }
  }

  validateMeta() {
    const meta = this.data.meta;
    if (!meta || typeof meta !== "object") {
      this.addError("INVALID_TYPE", "meta must be an object", "meta");
      return;
    }

    for (const field of REQUIRED_META_FIELDS) {
      if (!(field in meta)) {
        this.addError("MISSING_FIELD", `meta.${field} is required`, `meta.${field}`);
      }
    }

    if ("name" in meta && typeof meta.name !== "string") {
      this.addError("INVALID_TYPE", "meta.name must be a string", "meta.name");
    }

    if ("shortName" in meta && typeof meta.shortName !== "string") {
      this.addError("INVALID_TYPE", "meta.shortName must be a string", "meta.shortName");
    }

    if ("description" in meta && typeof meta.description !== "string") {
      this.addError("INVALID_TYPE", "meta.description must be a string", "meta.description");
    }

    if ("version" in meta && typeof meta.version !== "string") {
      this.addError("INVALID_TYPE", "meta.version must be a string", "meta.version");
    }

    if ("repoUrl" in meta) {
      if (typeof meta.repoUrl !== "string") {
        this.addError("INVALID_TYPE", "meta.repoUrl must be a string", "meta.repoUrl");
      } else if (!URL_REGEX.test(meta.repoUrl)) {
        this.addError("INVALID_FORMAT", "meta.repoUrl must be a valid URL", "meta.repoUrl");
      }
    }

    if ("demoUrl" in meta) {
      if (typeof meta.demoUrl !== "string") {
        this.addError("INVALID_TYPE", "meta.demoUrl must be a string", "meta.demoUrl");
      } else if (!URL_REGEX.test(meta.demoUrl)) {
        this.addError("INVALID_FORMAT", "meta.demoUrl must be a valid URL", "meta.demoUrl");
      }
    }

    if ("author" in meta && typeof meta.author !== "string") {
      this.addError("INVALID_TYPE", "meta.author must be a string", "meta.author");
    }

    if ("license" in meta && typeof meta.license !== "string") {
      this.addError("INVALID_TYPE", "meta.license must be a string", "meta.license");
    }

    if ("tags" in meta) {
      if (!Array.isArray(meta.tags)) {
        this.addError("INVALID_TYPE", "meta.tags must be an array", "meta.tags");
      } else {
        for (let i = 0; i < meta.tags.length; i++) {
          if (typeof meta.tags[i] !== "string") {
            this.addError("INVALID_TYPE", `meta.tags[${i}] must be a string`, `meta.tags[${i}]`);
          }
        }
      }
    }

    const allMetaFields = [...REQUIRED_META_FIELDS, ...OPTIONAL_META_FIELDS];
    for (const key of Object.keys(meta)) {
      if (!allMetaFields.includes(key)) {
        this.addError(
          "INVALID_FORMAT",
          `Unexpected property in meta: "${key}"`,
          `meta.${key}`,
        );
      }
    }
  }

  validateCategories() {
    const categories = this.data.categories;
    if (!Array.isArray(categories)) {
      this.addError("INVALID_TYPE", "categories must be an array", "categories");
      return;
    }

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const path = `categories[${i}]`;

      if (!cat || typeof cat !== "object") {
        this.addError("INVALID_TYPE", `${path} must be an object`, path);
        continue;
      }

      if (!("id" in cat)) {
        this.addError("MISSING_FIELD", `${path}.id is required`, `${path}.id`);
      } else if (typeof cat.id !== "string") {
        this.addError("INVALID_TYPE", `${path}.id must be a string`, `${path}.id`);
      }

      if (!("name" in cat)) {
        this.addError("MISSING_FIELD", `${path}.name is required`, `${path}.name`);
      } else if (typeof cat.name !== "string") {
        this.addError("INVALID_TYPE", `${path}.name must be a string`, `${path}.name`);
      }

      if (!("description" in cat)) {
        this.addError("MISSING_FIELD", `${path}.description is required`, `${path}.description`);
      } else if (typeof cat.description !== "string") {
        this.addError("INVALID_TYPE", `${path}.description must be a string`, `${path}.description`);
      }

      if (!("color" in cat)) {
        this.addError("MISSING_FIELD", `${path}.color is required`, `${path}.color`);
      } else if (typeof cat.color !== "string") {
        this.addError("INVALID_TYPE", `${path}.color must be a string`, `${path}.color`);
      } else if (!COLOR_REGEX.test(cat.color)) {
        this.addError("INVALID_FORMAT", `${path}.color must be a valid #RRGGBB hex color`, `${path}.color`);
      }

      if ("icon" in cat && typeof cat.icon !== "string") {
        this.addError("INVALID_TYPE", `${path}.icon must be a string`, `${path}.icon`);
      }

      const allowedCatFields = ["id", "name", "description", "color", "icon"];
      for (const key of Object.keys(cat)) {
        if (!allowedCatFields.includes(key)) {
          this.addError(
            "INVALID_FORMAT",
            `Unexpected property in ${path}: "${key}"`,
            `${path}.${key}`,
          );
        }
      }
    }
  }

  validateItems() {
    const items = this.data.items;
    if (!Array.isArray(items)) {
      this.addError("INVALID_TYPE", "items must be an array", "items");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const path = `items[${i}]`;

      if (!item || typeof item !== "object") {
        this.addError("INVALID_TYPE", `${path} must be an object`, path);
        continue;
      }

      if (!("name" in item)) {
        this.addError("MISSING_FIELD", `${path}.name is required`, `${path}.name`);
      } else if (typeof item.name !== "string") {
        this.addError("INVALID_TYPE", `${path}.name must be a string`, `${path}.name`);
      }

      if (!("category" in item)) {
        this.addError("MISSING_FIELD", `${path}.category is required`, `${path}.category`);
      } else if (typeof item.category !== "string") {
        this.addError("INVALID_TYPE", `${path}.category must be a string`, `${path}.category`);
      }

      if (!("difficulty" in item)) {
        this.addError("MISSING_FIELD", `${path}.difficulty is required`, `${path}.difficulty`);
      } else if (!VALID_DIFFICULTIES.includes(item.difficulty)) {
        this.addError(
          "INVALID_ENUM",
          `${path}.difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
          `${path}.difficulty`,
        );
      }

      if ("description" in item && typeof item.description !== "string") {
        this.addError("INVALID_TYPE", `${path}.description must be a string`, `${path}.description`);
      }

      if ("related" in item) {
        if (!Array.isArray(item.related)) {
          this.addError("INVALID_TYPE", `${path}.related must be an array`, `${path}.related`);
        } else {
          for (let j = 0; j < item.related.length; j++) {
            if (typeof item.related[j] !== "string") {
              this.addError(
                "INVALID_TYPE",
                `${path}.related[${j}] must be a string`,
                `${path}.related[${j}]`,
              );
            }
          }
        }
      }

      if ("refs" in item) {
        if (!Array.isArray(item.refs)) {
          this.addError("INVALID_TYPE", `${path}.refs must be an array`, `${path}.refs`);
        } else {
          for (let j = 0; j < item.refs.length; j++) {
            const ref = item.refs[j];
            const refPath = `${path}.refs[${j}]`;

            if (!ref || typeof ref !== "object") {
              this.addError("INVALID_TYPE", `${refPath} must be an object`, refPath);
              continue;
            }

            if (!("title" in ref)) {
              this.addError("MISSING_FIELD", `${refPath}.title is required`, `${refPath}.title`);
            } else if (typeof ref.title !== "string") {
              this.addError("INVALID_TYPE", `${refPath}.title must be a string`, `${refPath}.title`);
            }

            if (!("url" in ref)) {
              this.addError("MISSING_FIELD", `${refPath}.url is required`, `${refPath}.url`);
            } else if (typeof ref.url !== "string") {
              this.addError("INVALID_TYPE", `${refPath}.url must be a string`, `${refPath}.url`);
            } else if (!URL_REGEX.test(ref.url)) {
              this.addError("INVALID_FORMAT", `${refPath}.url must be a valid URL`, `${refPath}.url`);
            }
          }
        }
      }

      const allowedItemFields = ["name", "category", "difficulty", "description", "related", "refs"];
      for (const key of Object.keys(item)) {
        if (!allowedItemFields.includes(key)) {
          this.addError(
            "INVALID_FORMAT",
            `Unexpected property in ${path}: "${key}"`,
            `${path}.${key}`,
          );
        }
      }
    }
  }

  validateGlossary() {
    const glossary = this.data.glossary;
    if (!Array.isArray(glossary)) {
      this.addError("INVALID_TYPE", "glossary must be an array", "glossary");
      return;
    }

    for (let i = 0; i < glossary.length; i++) {
      const entry = glossary[i];
      const path = `glossary[${i}]`;

      if (!entry || typeof entry !== "object") {
        this.addError("INVALID_TYPE", `${path} must be an object`, path);
        continue;
      }

      if (!("term" in entry)) {
        this.addError("MISSING_FIELD", `${path}.term is required`, `${path}.term`);
      } else if (typeof entry.term !== "string") {
        this.addError("INVALID_TYPE", `${path}.term must be a string`, `${path}.term`);
      }

      if (!("definition" in entry)) {
        this.addError("MISSING_FIELD", `${path}.definition is required`, `${path}.definition`);
      } else if (typeof entry.definition !== "string") {
        this.addError("INVALID_TYPE", `${path}.definition must be a string`, `${path}.definition`);
      }

      const allowedGlossaryFields = ["term", "definition"];
      for (const key of Object.keys(entry)) {
        if (!allowedGlossaryFields.includes(key)) {
          this.addError(
            "INVALID_FORMAT",
            `Unexpected property in ${path}: "${key}"`,
            `${path}.${key}`,
          );
        }
      }
    }
  }

  validateRoadmap() {
    const roadmap = this.data.roadmap;
    if (!Array.isArray(roadmap)) {
      this.addError("INVALID_TYPE", "roadmap must be an array", "roadmap");
      return;
    }

    for (let i = 0; i < roadmap.length; i++) {
      const phase = roadmap[i];
      const path = `roadmap[${i}]`;

      if (!phase || typeof phase !== "object") {
        this.addError("INVALID_TYPE", `${path} must be an object`, path);
        continue;
      }

      if (!("title" in phase)) {
        this.addError("MISSING_FIELD", `${path}.title is required`, `${path}.title`);
      } else if (typeof phase.title !== "string") {
        this.addError("INVALID_TYPE", `${path}.title must be a string`, `${path}.title`);
      }

      if (!("description" in phase)) {
        this.addError("MISSING_FIELD", `${path}.description is required`, `${path}.description`);
      } else if (typeof phase.description !== "string") {
        this.addError("INVALID_TYPE", `${path}.description must be a string`, `${path}.description`);
      }

      if (!("order" in phase)) {
        this.addError("MISSING_FIELD", `${path}.order is required`, `${path}.order`);
      } else if (typeof phase.order !== "number") {
        this.addError("INVALID_TYPE", `${path}.order must be a number`, `${path}.order`);
      }

      if (!("categories" in phase)) {
        this.addError("MISSING_FIELD", `${path}.categories is required`, `${path}.categories`);
      } else if (!Array.isArray(phase.categories)) {
        this.addError("INVALID_TYPE", `${path}.categories must be an array`, `${path}.categories`);
      } else if (phase.categories.length === 0) {
        this.addError("EMPTY_ARRAY", `${path}.categories must not be empty`, `${path}.categories`);
      }

      const allowedPhaseFields = ["title", "description", "order", "categories"];
      for (const key of Object.keys(phase)) {
        if (!allowedPhaseFields.includes(key)) {
          this.addError(
            "INVALID_FORMAT",
            `Unexpected property in ${path}: "${key}"`,
            `${path}.${key}`,
          );
        }
      }
    }
  }

  // ─── Semantic Validation ─────────────────────────────────────────────

  validateSemantic() {
    this.validateCategoryReferences();
    this.validateRelatedReferences();
    this.validateRoadmapReferences();
    this.validateNoDuplicateCategoryIds();
    this.validateNoDuplicateItemNames();
    this.validateNoDuplicateGlossaryTerms();
    this.validateCategoryCoverage();
  }

  validateCategoryReferences() {
    if (!Array.isArray(this.data.categories) || !Array.isArray(this.data.items)) {
      return;
    }

    const categoryIds = new Set(this.data.categories.map((c) => c.id).filter(Boolean));

    for (let i = 0; i < this.data.items.length; i++) {
      const item = this.data.items[i];
      if (item && item.category && !categoryIds.has(item.category)) {
        this.addError(
          "UNKNOWN_CATEGORY",
          `Item "${item.name}" references non-existent category "${item.category}"`,
          `items[${i}].category`,
        );
      }
    }
  }

  validateRelatedReferences() {
    if (!Array.isArray(this.data.items)) {
      return;
    }

    const itemNames = new Set(this.data.items.map((item) => item.name).filter(Boolean));

    for (let i = 0; i < this.data.items.length; i++) {
      const item = this.data.items[i];
      if (!item || !Array.isArray(item.related)) {
        continue;
      }

      for (let j = 0; j < item.related.length; j++) {
        const relatedName = item.related[j];
        if (!itemNames.has(relatedName)) {
          this.addError(
            "UNKNOWN_REFERENCE",
            `Item "${item.name}" references non-existent related item "${relatedName}"`,
            `items[${i}].related[${j}]`,
          );
        }
      }
    }
  }

  validateRoadmapReferences() {
    if (!Array.isArray(this.data.categories) || !Array.isArray(this.data.roadmap)) {
      return;
    }

    const categoryIds = new Set(this.data.categories.map((c) => c.id).filter(Boolean));

    for (let i = 0; i < this.data.roadmap.length; i++) {
      const phase = this.data.roadmap[i];
      if (!phase || !Array.isArray(phase.categories)) {
        continue;
      }

      for (let j = 0; j < phase.categories.length; j++) {
        const catId = phase.categories[j];
        if (!categoryIds.has(catId)) {
          this.addError(
            "INVALID_ROADMAP",
            `Roadmap phase "${phase.title}" references non-existent category "${catId}"`,
            `roadmap[${i}].categories[${j}]`,
          );
        }
      }
    }
  }

  validateNoDuplicateCategoryIds() {
    if (!Array.isArray(this.data.categories)) {
      return;
    }

    const seen = new Map();
    for (let i = 0; i < this.data.categories.length; i++) {
      const cat = this.data.categories[i];
      if (!cat || !cat.id) {
        continue;
      }

      if (seen.has(cat.id)) {
        this.addError(
          "DUPLICATE_ID",
          `Duplicate category id "${cat.id}" found at categories[${i}] (first at categories[${seen.get(cat.id)}])`,
          `categories[${i}].id`,
        );
      } else {
        seen.set(cat.id, i);
      }
    }
  }

  validateNoDuplicateItemNames() {
    if (!Array.isArray(this.data.items)) {
      return;
    }

    const seen = new Map();
    for (let i = 0; i < this.data.items.length; i++) {
      const item = this.data.items[i];
      if (!item || !item.name) {
        continue;
      }

      if (seen.has(item.name)) {
        this.addError(
          "DUPLICATE_ID",
          `Duplicate item name "${item.name}" found at items[${i}] (first at items[${seen.get(item.name)}])`,
          `items[${i}].name`,
        );
      } else {
        seen.set(item.name, i);
      }
    }
  }

  validateNoDuplicateGlossaryTerms() {
    if (!Array.isArray(this.data.glossary)) {
      return;
    }

    const seen = new Map();
    for (let i = 0; i < this.data.glossary.length; i++) {
      const entry = this.data.glossary[i];
      if (!entry || !entry.term) {
        continue;
      }

      if (seen.has(entry.term)) {
        this.addWarning(
          "DUPLICATE_ID",
          `Duplicate glossary term "${entry.term}" found at glossary[${i}] (first at glossary[${seen.get(entry.term)}])`,
          `glossary[${i}].term`,
        );
      } else {
        seen.set(entry.term, i);
      }
    }
  }

  validateCategoryCoverage() {
    if (!Array.isArray(this.data.categories) || !Array.isArray(this.data.items)) {
      return;
    }

    const itemCounts = new Map();
    for (const item of this.data.items) {
      if (item && item.category) {
        itemCounts.set(item.category, (itemCounts.get(item.category) || 0) + 1);
      }
    }

    for (let i = 0; i < this.data.categories.length; i++) {
      const cat = this.data.categories[i];
      if (cat && cat.id && !itemCounts.has(cat.id)) {
        this.addWarning(
          "EMPTY_ARRAY",
          `Category "${cat.id}" has no items assigned to it`,
          `categories[${i}]`,
        );
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  addError(code, message, path) {
    this.errors.push({ code, message, path, severity: "error" });
  }

  addWarning(code, message, path) {
    this.warnings.push({ code, message, path, severity: "warning" });
  }
}

function formatResults(result) {
  const lines = [];

  lines.push("");
  lines.push("═══════════════════════════════════════════════════");
  lines.push("  AEL Reference Validator — Results");
  lines.push("═══════════════════════════════════════════════════");
  lines.push("");

  if (result.errors.length > 0) {
    lines.push("  ERRORS");
    lines.push("  ──────");
    for (const err of result.errors) {
      lines.push(`  ✗ [${err.code}] ${err.message}`);
      lines.push(`    at ${err.path}`);
    }
    lines.push("");
  } else {
    lines.push("  ✓ No errors found");
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("  WARNINGS");
    lines.push("  ────────");
    for (const warn of result.warnings) {
      lines.push(`  ⚠ [${warn.code}] ${warn.message}`);
      lines.push(`    at ${warn.path}`);
    }
    lines.push("");
  } else {
    lines.push("  ✓ No warnings found");
    lines.push("");
  }

  lines.push("───────────────────────────────────────────────────");
  lines.push("  SUMMARY");
  lines.push("───────────────────────────────────────────────────");
  lines.push(`  Errors:     ${result.summary.errors}`);
  lines.push(`  Warnings:   ${result.summary.warnings}`);
  lines.push(`  Categories: ${result.summary.categories}`);
  lines.push(`  Items:      ${result.summary.items}`);
  lines.push(`  Glossary:   ${result.summary.glossary}`);
  lines.push("───────────────────────────────────────────────────");

  if (result.valid) {
    lines.push("");
    lines.push("  ✓ VALID — Schema and semantics check passed");
    lines.push("");
  } else {
    lines.push("");
    lines.push("  ✗ INVALID — Fix the errors above and re-validate");
    lines.push("");
  }

  return lines.join("\n");
}

module.exports = { AELValidator, formatResults };

if (require.main === module) {
  const fs = require("fs");
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node validator.js <data.json>");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const validator = new AELValidator(data);
  const result = validator.validate();
  console.log(formatResults(result));
  process.exit(result.valid ? 0 : 1);
}
