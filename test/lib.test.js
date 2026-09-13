import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractRelativeLinks,
  scoreReadmeFile,
  suggestImprovements,
  checkReadmeLinks,
  RUBRIC,
} from "../lib.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const good = path.join(__dirname, "../fixtures/good-README.md");
const thin = path.join(__dirname, "../fixtures/thin-README.md");

describe("RUBRIC", () => {
  it("sums to 100", () => {
    const sum = Object.values(RUBRIC).reduce((a, b) => a + b, 0);
    assert.equal(sum, 100);
  });
});

describe("extractRelativeLinks", () => {
  it("ignores absolute urls", () => {
    const links = extractRelativeLinks("[a](https://x.com) [b](./LICENSE)");
    assert.equal(links.length, 1);
    assert.equal(links[0].href, "./LICENSE");
  });
});

describe("scoreReadmeFile", () => {
  it("scores a solid README highly", async () => {
    const r = await scoreReadmeFile({ filePath: good });
    assert.ok(r.score >= 70, `expected >=70 got ${r.score}`);
    assert.ok(["A", "B", "C"].includes(r.grade));
  });

  it("scores a thin README poorly", async () => {
    const r = await scoreReadmeFile({ filePath: thin });
    assert.ok(r.score < 40);
    assert.ok(r.suggestions.length >= 1);
  });
});

describe("suggestImprovements", () => {
  it("returns suggestions for thin readme", async () => {
    const r = await suggestImprovements({ filePath: thin });
    assert.ok(r.suggestions.some((s) => /install|title|usage|license/i.test(s)));
  });
});

describe("checkReadmeLinks", () => {
  it("detects missing relative link", async () => {
    const r = await checkReadmeLinks({ filePath: good });
    assert.ok(r.broken.some((b) => b.href.includes("guide.md")));
    assert.ok(r.links.some((l) => l.href.includes("LICENSE") && l.exists));
  });
});
