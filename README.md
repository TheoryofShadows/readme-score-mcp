# @mcpx-digital/readme-score

**MCP server that scores README quality and suggests improvements.**

Honest, heuristic scoring for install/usage/license/badges/structure plus relative link checks. Local markdown files only.

## Scoring rubric (100 points)

| Category | Max | What we look for |
|----------|-----|------------------|
| Title | 5 | Top-level `#` heading |
| Description | 10 | Short prose intro |
| Install | 20 | Install heading + package-manager / clone commands |
| Usage | 20 | Usage/examples heading + fenced code |
| License | 10 | License section or clear license mention |
| Badges | 10 | Status/shield badges |
| Contributing | 5 | Contributing section or link |
| Relative links | 15 | Relative paths resolve on disk |
| Structure | 5 | Enough markdown headings |

Grades: A≥90, B≥80, C≥70, D≥60, else F.

> Heuristic for **documentation completeness** — not code quality, security, or SEO.

## Install

```bash
npx -y @mcpx-digital/readme-score
```

## Cursor `mcp.json` example

```json
{
  "mcpServers": {
    "readme-score": {
      "command": "npx",
      "args": ["-y", "@mcpx-digital/readme-score"]
    }
  }
}
```

Local clone:

```json
{
  "mcpServers": {
    "readme-score": {
      "command": "node",
      "args": ["/absolute/path/to/readme-score-mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | What it does |
|------|----------------|
| `score_readme` | Full 0–100 score with category breakdown |
| `suggest_improvements` | Concrete fix list |
| `check_readme_links` | Relative link existence only |

## Example prompts

- “Score `./README.md`”
- “Suggest README improvements for this repo”
- “Which relative links in the README are broken?”

## Development

```bash
git clone https://github.com/TheoryofShadows/readme-score-mcp.git
cd readme-score-mcp
npm install
npm test
```

## License

MIT
