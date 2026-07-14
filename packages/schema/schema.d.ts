/**
 * AEL Reference Engine Schema
 *
 * TypeScript type definitions for AEL Reference Engine data files.
 * Every reference project must conform to these types.
 *
 * @see https://aeldigitalstudio.com/schemas/reference-v1.json
 */

/** Project metadata including name, version, and description. */
export interface Meta {
  /** Full name of the reference project. */
  name: string;
  /** Short slug identifier for the project (e.g. "ael-js", "ael-css"). Must match `^[a-z0-9-]+$`. */
  shortName: string;
  /** Semantic version number (e.g. "1.0.0"). Must match `^\d+\.\d+\.\d+$`. */
  version: string;
  /** Brief description of the reference project. */
  description: string;
  /** Estimated reading time (e.g. "45 min", "1.5 hrs"). */
  readingTime: string;
  /** URL to the project's source repository. */
  repoUrl?: string;
  /** URL to a live demo of the project. */
  demoUrl?: string;
  /** Summary statistics displayed in the project header. */
  stats: MetaStats;
}

/** Summary statistics for a reference project. */
export interface MetaStats {
  /** Total number of items as a human-readable string (e.g. "150+", "200"). */
  items: string;
  /** Total number of categories as a human-readable string (e.g. "12", "10+"). */
  categories: string;
  /** Total number of feature flags as a human-readable string. */
  flags?: string;
  /** Total number of code examples as a human-readable string. */
  examples?: string;
  /** Total number of tips as a human-readable string. */
  tips?: string;
}

/** A category used to group reference items. */
export interface Category {
  /** Unique identifier for the category. Must match `^[a-z0-9-]+$`. */
  id: string;
  /** Human-readable category name. */
  name: string;
  /** Emoji icon for the category (e.g. "📦", "🔧"). */
  icon: string;
  /** Hex color code for the category (e.g. "#3B82F6", "#10B981"). Must match `^#[0-9A-Fa-f]{6}$`. */
  color: string;
}

/** A feature flag or option that modifies item behavior. */
export interface Flag {
  /** The flag identifier or option name. */
  flag: string;
  /** Description of what the flag does. */
  desc: string;
}

/** A code example demonstrating item usage. */
export interface Example {
  /** Short label for the example (e.g. "Basic usage", "With options"). */
  label: string;
  /** The code snippet to display. */
  code: string;
}

/** An external reference link for further reading. */
export interface Ref {
  /** Display label for the link. */
  label: string;
  /** URL of the external reference. */
  url: string;
}

/** A reference item with documentation, examples, and metadata. */
export interface Item {
  /** Display name of the item (e.g. "filter", "map", "async/await"). */
  name: string;
  /** Syntax signature or usage pattern (e.g. "array.filter(callback)"). */
  syntax: string;
  /** Brief description of what the item does. */
  desc: string;
  /** ID of the category this item belongs to. Must match a category id. */
  category: string;
  /** Difficulty level of the item. */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Feature flags or options that modify behavior. */
  flags: Flag[];
  /** Code examples demonstrating usage. */
  examples: Example[];
  /** Optional helpful tip or best practice note. */
  tip?: string;
  /** Names of related items. Must match other item names in the project. */
  related?: string[];
  /**
   * Supported platforms for this item.
   * Common values: "node", "browser", "deno", "bun", "webworker", "service-worker"
   */
  platforms?: string[];
  /** External reference links for further reading. */
  refs?: Ref[];
}

/** A glossary term definition. */
export interface GlossaryTerm {
  /** The term being defined. */
  term: string;
  /** Definition of the term. */
  desc: string;
}

/** A step in the learning roadmap. */
export interface RoadmapStep {
  /** Difficulty level for this roadmap step. */
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Description of what to learn at this level. */
  desc: string;
  /** Category IDs to study at this level. Must match category ids. */
  categories: string[];
}

/** Root schema for an AEL Reference Engine data file. */
export interface ReferenceData {
  /** Project metadata including name, version, and description. */
  meta: Meta;
  /** List of categories used to group items. */
  categories: Category[];
  /** All reference items in the project. */
  items: Item[];
  /** Definitions of key terms used throughout the reference. */
  glossary: GlossaryTerm[];
  /** Learning roadmap organized by difficulty level. */
  roadmap: RoadmapStep[];
}

/** Alias for ReferenceData — the root schema type. */
export type ReferenceSchema = ReferenceData;
