/**
 * README quality scoring — local files only.
 * Honest rubric documented in README.
 */
import fs from "node:fs/promises";
import path from "node:path";

/** Max points per category (sum = 100) */
export const RUBRIC = {
  title: 5,
  description: 10,
  install: 20,
  usage: 20,
  license: 10,
  badges: 10,
  contributing: 5,
  linksValid: 15,
  structure: 5,
};

/**
 * @param {string} md
 */
export function extractRelativeLinks(md) {
  const links = [];
  const re = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    const href = m[2].trim().split(/\s+/)[0].replace(/^<|>$/g, "");
    if (!href || href.startsWith("#")) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    links.push({ text: m[1], href });
  }
  return links;
}

/**
 * @param {string} md
 * @param {string} readmeDir
 */
export async function checkRelativeLinks(md, readmeDir) {
  const links = extractRelativeLinks(md);
  const results = [];
  for (const link of links) {
    const clean = link.href.split("#")[0];
    if (!clean) {
      results.push({ ...link, exists: true, note: "fragment-only" });
      continue;
    }
    const target = path.resolve(readmeDir, clean);
    let exists = false;
    try {
      await fs.access(target);
      exists = true;
    } catch {
      exists = false;
    }
    results.push({ ...link, resolved: target, exists });
  }
  return results;
}

/**
 * @param {string} md
 * @param {{ readmeDir?: string, skipLinkCheck?: boolean }} [opts]
 */
export async function scoreReadmeMarkdown(md, opts = {}) {
  const text = String(md || "");
  const lower = text.toLowerCase();
  const categories = [];
  const suggestions = [];

  {
    const notes = [];
    let score = 0;
    if (/^#\s+\S+/m.test(text)) {
      score = 5;
      notes.push("Has top-level H1 title");
    } else {
      suggestions.push("Add a clear `# Project Title` as the first heading.");
      notes.push("Missing H1 title");
    }
    categories.push({ category: "title", max: RUBRIC.title, score, notes });
  }

  {
    const notes = [];
    let score = 0;
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const prose = lines.filter((l) => !l.startsWith("#") && !l.startsWith("![") && !l.startsWith("|"));
    const intro = prose.slice(0, 5).join(" ");
    if (intro.length >= 80) {
      score = 10;
      notes.push("Solid short description present");
    } else if (intro.length >= 30) {
      score = 6;
      notes.push("Short description present");
      suggestions.push("Expand the intro blurb to explain what the project does and who it is for (~2–3 sentences).");
    } else {
      score = 0;
      notes.push("Little or no description prose");
      suggestions.push("Add a short project description under the title.");
    }
    categories.push({ category: "description", max: RUBRIC.description, score, notes });
  }

  {
    const notes = [];
    let score = 0;
    const hasInstallHeading = /##?\s+.*install/i.test(text);
    const hasInstallCmd =
      /npm\s+i(nstall)?|pnpm\s+add|yarn\s+add|npx\s+|pip\s+install|cargo\s+install|brew\s+install|git\s+clone/i.test(
        text,
      );
    if (hasInstallHeading && hasInstallCmd) {
      score = 20;
      notes.push("Install section with commands");
    } else if (hasInstallHeading || hasInstallCmd) {
      score = 10;
      notes.push("Partial install docs");
      suggestions.push("Add an ## Install section with copy-pasteable install commands.");
    } else {
      score = 0;
      notes.push("No install section detected");
      suggestions.push("Document installation (package manager command and/or clone + build).");
    }
    categories.push({ category: "usage_install", max: RUBRIC.install, score, notes });
  }

  {
    const notes = [];
    let score = 0;
    const hasUsage = /##?\s+.*(usage|getting started|quickstart|example|how to)/i.test(text);
    const hasCodeFence = /```[\s\S]*?```/.test(text);
    if (hasUsage && hasCodeFence) {
      score = 20;
      notes.push("Usage/examples with code blocks");
    } else if (hasUsage || hasCodeFence) {
      score = 10;
      notes.push("Some usage or code examples");
      suggestions.push("Add an ## Usage (or Examples) section with at least one realistic code/config sample.");
    } else {
      score = 0;
      notes.push("No usage/examples detected");
      suggestions.push("Show how to use the project with a minimal example.");
    }
    categories.push({ category: "usage", max: RUBRIC.usage, score, notes });
  }

  {
    const notes = [];
    let score = 0;
    if (/##?\s+.*license/i.test(text) || /\bmit\b|\bapache\b|\bbsl\b|licensed under/i.test(lower)) {
      score = 10;
      notes.push("License mentioned");
    } else {
      score = 0;
      notes.push("No license mention");
      suggestions.push("Add a ## License section (and a LICENSE file in the repo).");
    }
    categories.push({ category: "license", max: RUBRIC.license, score, notes });
  }

  {
    const notes = [];
    let score = 0;
    const badgeCount = (text.match(/\[![^\]]*\]\([^)]+\)/g) || []).length;
    const shieldCount = (text.match(/shields\.io|badge\.fury|github\.com\/.*\/actions\/workflows/gi) || []).length;
    if (badgeCount >= 2 || shieldCount >= 1) {
      score = 10;
      notes.push(`Badges detected (${badgeCount} image-link badges)`);
    } else if (badgeCount === 1) {
      score = 5;
      notes.push("One badge present");
      suggestions.push("Consider adding CI/license/version badges for at-a-glance status.");
    } else {
      score = 0;
      notes.push("No badges");
      suggestions.push("Optional: add status badges (CI, license, npm version).");
    }
    categories.push({ category: "badges", max: RUBRIC.badges, score, notes });
  }

  {
    const notes = [];
    let score = 0;
    if (/##?\s+.*contribut/i.test(text) || /contributing\.md/i.test(text)) {
      score = 5;
      notes.push("Contributing section/link present");
    } else {
      score = 0;
      notes.push("No contributing section");
      suggestions.push("Add a short ## Contributing note (issues/PRs welcome, or link CONTRIBUTING.md).");
    }
    categories.push({ category: "contributing", max: RUBRIC.contributing, score, notes });
  }

  {
    const notes = [];
    const headings = (text.match(/^#{1,3}\s+.+/gm) || []).length;
    let score = 0;
    if (headings >= 4) {
      score = 5;
      notes.push(`${headings} headings — good structure`);
    } else if (headings >= 2) {
      score = 3;
      notes.push(`${headings} headings`);
      suggestions.push("Break the README into clearer sections with ## headings.");
    } else {
      score = 0;
      notes.push("Very few headings");
      suggestions.push("Use markdown headings to structure install, usage, and license.");
    }
    categories.push({ category: "structure", max: RUBRIC.structure, score, notes });
  }

  {
    const notes = [];
    let score = RUBRIC.linksValid;
    let linkResults = [];
    if (opts.skipLinkCheck || !opts.readmeDir) {
      score = Math.round(RUBRIC.linksValid * 0.5);
      notes.push("Link existence check skipped (no directory context)");
    } else {
      linkResults = await checkRelativeLinks(text, opts.readmeDir);
      const broken = linkResults.filter((l) => !l.exists);
      if (linkResults.length === 0) {
        score = RUBRIC.linksValid;
        notes.push("No relative file links to check");
      } else if (broken.length === 0) {
        score = RUBRIC.linksValid;
        notes.push(`All ${linkResults.length} relative links resolve`);
      } else {
        const ratio = 1 - broken.length / linkResults.length;
        score = Math.round(RUBRIC.linksValid * Math.max(0, ratio));
        notes.push(`${broken.length}/${linkResults.length} relative links missing`);
        for (const b of broken.slice(0, 8)) {
          suggestions.push(`Fix broken relative link: (${b.href})`);
        }
      }
    }
    categories.push({
      category: "linksValid",
      max: RUBRIC.linksValid,
      score,
      notes,
      brokenLinks: linkResults.filter((l) => !l.exists),
    });
  }

  const total = categories.reduce((s, c) => s + c.score, 0);
  const max = Object.values(RUBRIC).reduce((a, b) => a + b, 0);
  let grade = "F";
  if (total >= 90) grade = "A";
  else if (total >= 80) grade = "B";
  else if (total >= 70) grade = "C";
  else if (total >= 60) grade = "D";

  return {
    score: total,
    max,
    grade,
    rubric: RUBRIC,
    categories,
    suggestions: [...new Set(suggestions)],
    disclaimer:
      "Heuristic scoring for documentation completeness — not a measure of code quality or security.",
  };
}

/**
 * @param {{ filePath: string, skipLinkCheck?: boolean }} input
 */
export async function scoreReadmeFile(input) {
  const abs = path.resolve(String(input.filePath));
  const md = await fs.readFile(abs, "utf8");
  const result = await scoreReadmeMarkdown(md, {
    readmeDir: path.dirname(abs),
    skipLinkCheck: Boolean(input.skipLinkCheck),
  });
  return { file: abs, ...result };
}

/**
 * @param {{ filePath: string }} input
 */
export async function suggestImprovements(input) {
  const scored = await scoreReadmeFile(input);
  return {
    file: scored.file,
    score: scored.score,
    grade: scored.grade,
    suggestions: scored.suggestions,
    lowCategories: scored.categories
      .filter((c) => c.score < c.max * 0.6)
      .map((c) => ({ category: c.category, score: c.score, max: c.max, notes: c.notes })),
  };
}

/**
 * @param {{ filePath: string }} input
 */
export async function checkReadmeLinks(input) {
  const abs = path.resolve(String(input.filePath));
  const md = await fs.readFile(abs, "utf8");
  const links = await checkRelativeLinks(md, path.dirname(abs));
  const broken = links.filter((l) => !l.exists);
  return {
    file: abs,
    linkCount: links.length,
    brokenCount: broken.length,
    links,
    broken,
  };
}
